import { v } from "convex/values";
import { internalQuery, mutation, query, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Retrieves the full user document for the currently authenticated user.
 * Returns null if the user is not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    // Fetch the full user document
    const user = await ctx.db.get(userId);
    if (!user) {
      // This should not happen if getAuthUserId returns an ID, but handle defensively
      console.error(`User document not found for authenticated userId: ${userId}`);
      return null;
    }
    // The fetched user doc should now match the updated validator
    return user;
  },
});

/**
 * Updates the role for the currently authenticated user.
 * Throws an error if the user is not authenticated.
 */
export const updateRole = mutation({
  args: {
    role: v.union(v.literal("consumer"), v.literal("business")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to update role.");
    }

    console.log(`Updating role for user ${userId} to ${args.role}`);
    await ctx.db.patch(userId, { role: args.role });
    console.log(`Role updated successfully for user ${userId}`);
    return null;
  },
});

/**
 * Internal Mutation: Save the generated profile embedding to a user document.
 */
export const saveUserProfileEmbedding = internalMutation({
    args: {
        userId: v.id("users"),
        embedding: v.optional(v.array(v.float64())), // Match schema: T | undefined
    },
    returns: v.null(),
    handler: async (ctx, { userId, embedding }) => {
        await ctx.db.patch(userId, { profileEmbedding: embedding });
        console.log(`Patched user ${userId} profile embedding.`);
        return null;
    },
});

/**
 * Query: Get dishes from the user's history that haven't been reviewed yet.
 */
export const getUnratedDishes = query({
    args: {},
    returns: v.array(v.object({
        historyId: v.id("userDishHistory"), // ID of the history entry
        dishId: v.id("dishes"),
        dishName: v.string(),
        dishImage: v.union(v.string(), v.null()), // First image URL or null
        restaurantName: v.string(),
        timestamp: v.number(), // Timestamp from history entry
    })),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return []; // Not logged in
        }

        const userHistory = await ctx.db
            .query("userDishHistory")
            .withIndex("by_user", q => q.eq("userId", userId))
            .order("desc") // Get most recent first
            .collect();

        const unratedDishes = [];

        for (const historyEntry of userHistory) {
            // Check if a review exists for this user and dish
            const existingReview = await ctx.db
                .query("reviews")
                .withIndex("by_user_dish", q => q.eq("userId", userId).eq("dishId", historyEntry.dishId))
                .first(); // Check if at least one exists

            // If no review exists, fetch details
            if (!existingReview) {
                const dish = await ctx.db.get(historyEntry.dishId);
                if (dish) {
                    const restaurant = await ctx.db.get(dish.restaurantId);
                    if (restaurant) {
                        // Get first image URL (async)
                        let firstImageUrl: string | null = null;
                        if (dish.imageIds && dish.imageIds.length > 0) {
                            firstImageUrl = await ctx.storage.getUrl(dish.imageIds[0]);
                        }

                        unratedDishes.push({
                            historyId: historyEntry._id,
                            dishId: dish._id,
                            dishName: dish.name,
                            dishImage: firstImageUrl,
                            restaurantName: restaurant.name,
                            timestamp: historyEntry.timestamp,
                        });
                    }
                }
            }
        }

        return unratedDishes;
    },
}); 