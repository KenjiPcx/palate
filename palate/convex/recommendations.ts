import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Action: Get dish recommendations for the current user.
 * Uses vector search based on the user's profile embedding.
 */
export const getRecommendations = action({
    args: {
        // Optional: Add limit for number of recommendations
        limit: v.optional(v.number()),
    },
    // Return type matches dish structure
    returns: v.array(
        v.object({
            _id: v.id("dishes"),
            _creationTime: v.number(),
            restaurantId: v.id("restaurants"),
            name: v.string(),
            description: v.optional(v.string()),
            price: v.optional(v.number()),
            embedding: v.optional(v.array(v.float64())),
            // Add tasteProfile later if needed
        })
    ),
    handler: async (ctx, args): Promise<Doc<"dishes">[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            // Not logged in, return empty recommendations
            return [];
        }

        // 1. Get the user's profile embedding
        const user = await ctx.runQuery(api.users.getCurrentUser, {});
        if (!user || !user.profileEmbedding) {
            console.log(`User ${userId} has no profile embedding yet.`);
            // No embedding, return empty or maybe popular dishes later?
            return [];
        }

        // 2. Perform vector search for similar dishes
        const results = await ctx.vectorSearch("dishes", "by_embedding", {
            vector: user.profileEmbedding,
            limit: (args.limit ?? 10) + 10, // Fetch extra to filter out rated ones
        });

        if (results.length === 0) {
            console.log(`No vector search results for user ${userId}`);
            return [];
        }

        // 3. Get the user's rating history to filter results
        const history = await ctx.runQuery(api.history.getUserHistory, { userId });
        const ratedDishIds = new Set(history.map(h => h.dishId));

        // 4. Filter out rated dishes and get full documents
        const resultIds = results.map(r => r._id);
        // Fetch all potential dishes at once for efficiency
        const potentialDishDocs = await ctx.runQuery(api.dishes.getDishesByIds, { dishIds: resultIds }); 
        
        // Create a map for quick lookup
        const potentialDishesMap = new Map(potentialDishDocs
            .filter((doc): doc is Doc<"dishes"> => doc !== null)
            .map(doc => [doc._id, doc])
        );

        const recommendedDishes: Doc<"dishes">[] = [];
        // Iterate through the original vector search results to maintain order
        for (const result of results) {
            const dishDoc = potentialDishesMap.get(result._id);
            // Check if dish exists and is not rated
            if (dishDoc && !ratedDishIds.has(dishDoc._id)) { 
                recommendedDishes.push(dishDoc); // Push the found document
                if (recommendedDishes.length >= (args.limit ?? 10)) {
                    break; 
                }
            }
        }

        console.log(`Returning ${recommendedDishes.length} recommendations for user ${userId}`);
        return recommendedDishes;
    },
}); 