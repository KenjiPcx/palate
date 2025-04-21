import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// Define the structure for an enriched review, similar to mock data
const enrichedReviewValidator = v.object({
    _id: v.id("reviews"),
    _creationTime: v.number(),
    userId: v.id("users"),
    dishId: v.id("dishes"),
    rating: v.number(),
    comment: v.optional(v.string()),
    timestamp: v.number(),
    // Enriched data
    user: v.object({ // Subset of user fields needed
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
        // tasteProfile: v.optional(tasteProfileValidator), // Optional
    }),
    dish: v.object({ // Subset of dish fields needed
        _id: v.id("dishes"),
        name: v.string(),
        image: v.union(v.string(), v.null()), // First image URL
        restaurantId: v.id("restaurants"),
    }),
    restaurant: v.object({ // Subset of restaurant fields needed
        _id: v.id("restaurants"),
        name: v.string(),
    }),
    // tasteMatch: v.optional(v.number()), // Calculate if needed
});

/**
 * Query: Get recent reviews, enriched with user, dish, and restaurant info.
 */
export const getRecentReviews = query({
    args: { paginationOpts: v.optional(paginationOptsValidator) }, // Optional pagination
    returns: v.array(enrichedReviewValidator), // Return array of enriched reviews
    handler: async (ctx, args) => {
        // Fetch recent reviews, ordered by creation time
        const reviews = await ctx.db
            .query("reviews")
            .order("desc") // Get newest first
            .take(args.paginationOpts?.numItems ?? 10); // Simple limit for now

        const enrichedReviews = [];

        for (const review of reviews) {
            // Fetch related data in parallel
            const [user, dish, restaurant] = await Promise.all([
                ctx.db.get(review.userId),
                ctx.db.get(review.dishId),
                // Fetch restaurant via dish ID (assuming dish is fetched)
                (async () => {
                    const dishForRestaurant = await ctx.db.get(review.dishId);
                    return dishForRestaurant ? ctx.db.get(dishForRestaurant.restaurantId) : null;
                })(), // Execute the async function immediately
            ]);

            // Skip if essential data is missing
            if (!user || !dish || !restaurant) {
                console.warn(`Skipping review ${review._id} due to missing related data.`);
                continue;
            }

            // Get first dish image URL
            let firstDishImageUrl: string | null = null;
            if (dish.imageIds && dish.imageIds.length > 0) {
                firstDishImageUrl = await ctx.storage.getUrl(dish.imageIds[0]);
            }

            enrichedReviews.push({
                ...review,
                user: {
                    _id: user._id,
                    name: user.name ?? 'Unknown User', // Handle missing name
                    avatar: user.avatar, // Use avatar field from schema
                },
                dish: {
                    _id: dish._id,
                    name: dish.name,
                    image: firstDishImageUrl,
                    restaurantId: dish.restaurantId,
                },
                restaurant: {
                    _id: restaurant._id,
                    name: restaurant.name,
                },
            });
        }

        return enrichedReviews;
    },
}); 