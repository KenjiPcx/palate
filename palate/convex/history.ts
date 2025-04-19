import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Mutation: Log that a user has eaten a dish and their rating (like/dislike).
 * Also schedules the user profile embedding update.
 */
export const logAndRateDish = mutation({
  args: {
    dishId: v.id("dishes"),
    liked: v.boolean(), // Keep it simple for MVP
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to log/rate a dish.");
    }

    const now = Date.now();

    // Check if there's existing history for this user/dish
    const existingEntry = await ctx.db
      .query("userDishHistory")
      .withIndex("by_user_dish", (q) => 
        q.eq("userId", userId).eq("dishId", args.dishId)
      )
      .unique(); 

    if (existingEntry) {
      // Update existing entry
      console.log(`Updating rating for dish ${args.dishId} for user ${userId}`);
      await ctx.db.patch(existingEntry._id, { 
        liked: args.liked, 
        timestamp: now 
      });
    } else {
      // Insert new entry
      console.log(`Logging new rating for dish ${args.dishId} for user ${userId}`);
      await ctx.db.insert("userDishHistory", {
        userId: userId,
        dishId: args.dishId,
        liked: args.liked,
        timestamp: now,
      });
    }

    // Schedule the user profile embedding update (fire-and-forget)
    // Uncomment when updateUserProfileEmbedding is implemented
    await ctx.scheduler.runAfter(0, internal.embedding.updateUserProfileEmbedding, {
        userId: userId,
    });
    console.log(`Scheduled profile update for user ${userId}`);

    return null;
  },
});

/**
 * Query: Get all history entries for a specific user.
 */
export const getUserHistory = query({
    args: { userId: v.id("users") },
    // Define return type based on userDishHistory schema
    returns: v.array(
        v.object({
            _id: v.id("userDishHistory"),
            _creationTime: v.number(),
            userId: v.id("users"),
            dishId: v.id("dishes"),
            liked: v.optional(v.boolean()),
            timestamp: v.number(),
        })
    ),
    handler: async (ctx, args): Promise<Doc<"userDishHistory">[]> => {
        return await ctx.db
            .query("userDishHistory")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc") // Most recent first
            .collect();
    },
}); 