import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Define a type for the combined feed item structure
// TODO: Expand this as more feed item types are added
const feedItemValidator = v.object({
    id: v.union(v.id("reviews"), v.id("users"), v.string()), // Use review ID, user ID, or recommendation ID
    type: v.union(
        v.literal("dish_review"),
        v.literal("similar_users"), // Placeholder
        v.literal("taste_recommendation") // Placeholder
    ),
    timestamp: v.number(), // Use review timestamp or generation time
    data: v.any(), // Use v.any() for now, refine later with specific validators per type
});

/**
 * Action: Get the personalized feed for the current user.
 * Orchestrates fetching reviews, recommendations, similar users, etc.
 */
export const getFeed = action({
    args: {},
    // Returns an array of feed items
    returns: v.array(feedItemValidator),
    handler: async (ctx): Promise<Array<Infer<typeof feedItemValidator>>> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            // Return empty feed or public feed if not logged in?
            return [];
        }

        console.log("Generating feed for user:", userId);

        // 1. Fetch recent reviews (initially, can add friend filtering later)
        // TODO: Add pagination/limits
        const recentReviews = await ctx.runQuery(api.reviews.getRecentReviews, {});

        // 2. Fetch recommendations (TODO)
        // const recommendations = await ctx.runQuery(api.recommendations.getRecommendations, { limit: 5 });

        // 3. Fetch similar users (TODO)
        // const similarUsers = await ctx.runQuery(api.users.findSimilarUsers, { limit: 3 });

        // 4. Format reviews into feed items
        const reviewFeedItems = recentReviews.map(review => ({
            id: review._id,
            type: "dish_review" as const,
            timestamp: review._creationTime, // Or review.timestamp if that field exists
            data: review, // Pass the whole enriched review object for now
        }));

        // TODO: Format recommendations and similar users into feed items

        // 5. Combine and sort feed items (simple sort by timestamp for now)
        const combinedFeed = [...reviewFeedItems];
        // TODO: Add recommendation items, similar user items

        combinedFeed.sort((a, b) => b.timestamp - a.timestamp);

        // TODO: Add pagination/limit to the final feed

        console.log("Returning feed items:", combinedFeed.length);
        return combinedFeed;
    },
});

// Helper type for TypeScript inference
import type { Infer } from "convex/values";
export type FeedItem = Infer<typeof feedItemValidator>; 