import { v } from "convex/values";
import { query, internalMutation, action } from "./_generated/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { dishWithImageUrlsValidator } from "./schema";

/**
 * Helper function to generate image URLs for a dish document.
 */
async function generateImageUrls(ctx: QueryCtx | MutationCtx | ActionCtx, dish: Doc<"dishes">): Promise<(string | null)[]> {
    if (!dish.imageIds || dish.imageIds.length === 0) {
        return [];
    }
    return await Promise.all(
        dish.imageIds.map(imageId => ctx.storage.getUrl(imageId))
    );
}

/**
 * Retrieves all dishes for a given restaurant ID, including generated image URLs.
 */
export const getForRestaurant = query({
    args: { restaurantId: v.id("restaurants") },
    // Use the shared validator
    returns: v.array(dishWithImageUrlsValidator),
    handler: async (ctx, args) => {
        const dishes = await ctx.db
            .query("dishes")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
            .order("desc")
            .collect();

        // Generate URLs for dishes with images
        const dishesWithUrls = await Promise.all(
            dishes.map(async (dish) => {
                const imageUrls = await generateImageUrls(ctx, dish);
                return {
                    ...dish,
                    imageUrls: imageUrls
                };
            })
        );
        return dishesWithUrls;
    },
});

/**
 * Retrieves all dishes, paginated, including generated image URLs.
 * TODO: Add filtering by category, search terms, etc.
 */
export const getAll = query({
    args: { paginationOpts: paginationOptsValidator },
    returns: v.object({
        page: v.array(dishWithImageUrlsValidator),
        isDone: v.boolean(),
        continueCursor: v.string(),
    }),
    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("dishes")
            // Add an index for ordering if needed, e.g., by creation time or name
            // .withIndex("by_creationTime") // Example, assumes index exists
            .order("desc") // Or "asc"
            .paginate(args.paginationOpts);

        // Generate image URLs for the dishes in the current page
        const pageWithUrls = await Promise.all(
            result.page.map(async (dish) => {
                const imageUrls = await generateImageUrls(ctx, dish);
                return {
                    ...dish,
                    imageUrls: imageUrls
                };
            })
        );

        return {
            ...result, // Includes isDone and continueCursor
            page: pageWithUrls,
        };
    },
});

/**
 * Internal Mutation: Save the generated embedding to a dish document.
 */
export const saveDishEmbedding = internalMutation({
    args: {
        dishId: v.id("dishes"),
        embedding: v.array(v.float64()),
    },
    returns: v.null(),
    handler: async (ctx, { dishId, embedding }) => {
        console.log(`Saving embedding for dish ${dishId}`);
        await ctx.db.patch(dishId, { embedding: embedding });
        console.log(`Successfully saved embedding for dish ${dishId}`);
        return null;
    },
});

/**
 * Query: Get multiple dish documents by their IDs.
 * Returns an array potentially containing nulls if an ID doesn't exist.
 */
export const getDishesByIds = query({
    args: { dishIds: v.array(v.id("dishes")) },
    returns: v.array(v.union(v.null(), dishWithImageUrlsValidator)), // Use shared validator
    handler: async (ctx, args) => { // Removed explicit Promise return type annotation
        // Use Promise.all for efficient parallel fetching
        const dishesWithUrls = await Promise.all(
            args.dishIds.map(async (dishId) => {
                const dish = await ctx.db.get(dishId);
                if (!dish) return null;
                const imageUrls = await generateImageUrls(ctx, dish);
                return { ...dish, imageUrls };
            })
        );
        return dishesWithUrls;
    },
});

/**
 * Query: Get a single dish document by its ID, including generated image URL.
 */
export const getDishById = query({
    args: { dishId: v.id("dishes") },
    returns: v.union(v.null(), dishWithImageUrlsValidator), // Use shared validator
    handler: async (ctx, args) => {
        const dish = await ctx.db.get(args.dishId);
        if (!dish) {
            return null;
        }
        const imageUrls = await generateImageUrls(ctx, dish);
        return {
            ...dish,
            imageUrls: imageUrls
        };
    },
});

/**
 * Action: Generate a short-lived upload URL for a dish image.
 * Requires authentication and user must own the restaurant associated with the dish.
 */
export const generateDishImageUploadUrl = action({
    args: { dishId: v.id("dishes") },
    returns: v.string(),
    handler: async (ctx, args) => { // Added 'args' parameter
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("User must be authenticated.");
        }

        // Verify user owns the restaurant this dish belongs to
        // Use getDishById directly, as it includes necessary fields
        const dish = await ctx.runQuery(api.dishes.getDishById, { dishId: args.dishId });
        if (!dish) {
            throw new Error("Dish not found.");
        }
        // Fetch the restaurant using the restaurantId from the dish
        const restaurant = await ctx.runQuery(api.restaurants.getRestaurantForUser, { restaurantId: dish.restaurantId });
        if (!restaurant) {
            throw new Error("User does not own the restaurant associated with this dish.");
        }

        console.log(`Generating dish image upload URL for dish ${args.dishId}`);
        const uploadUrl = await ctx.storage.generateUploadUrl();
        return uploadUrl;
    },
});

/**
 * Internal Mutation: Save the storage ID of the uploaded image to the dish document.
 */
export const saveDishImageId = internalMutation({
    args: {
        dishId: v.id("dishes"),
        newImageId: v.id("_storage"),
    },
    returns: v.null(),
    handler: async (ctx, { dishId, newImageId }) => {
        const existingDish = await ctx.db.get(dishId);
        if (!existingDish) {
            console.error(`Dish ${dishId} not found, cannot save image ID.`);
            return null; // Or throw an error
        }

        // Get current image IDs or initialize as empty array
        const currentImageIds = existingDish.imageIds ?? [];

        // Append the new image ID
        const updatedImageIds = [...currentImageIds, newImageId];

        // Patch the dish with the updated array
        await ctx.db.patch(dishId, { imageIds: updatedImageIds });
        console.log(`Appended imageId ${newImageId} for dish ${dishId}. New array:`, updatedImageIds);

        // Note: We are NOT deleting old images here anymore.
        // Deletion should be a separate explicit action.

        return null;
    },
});

/**
 * Public Mutation: Link an uploaded image storage ID to a dish.
 * Requires authentication and user must own the restaurant associated with the dish.
 */
export const linkDishImage = mutation({
    args: {
        dishId: v.id("dishes"),
        newImageId: v.id("_storage"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("User must be authenticated.");
        }

        // Verify user owns the restaurant this dish belongs to
        const dish = await ctx.runQuery(api.dishes.getDishById, { dishId: args.dishId });
        if (!dish) {
            throw new Error("Dish not found.");
        }
        // Fetch the restaurant using the restaurantId from the dish
        const restaurant = await ctx.runQuery(api.restaurants.getRestaurantForUser, { restaurantId: dish.restaurantId });
        if (!restaurant) {
            throw new Error("User does not own the restaurant associated with this dish, or restaurant not found.");
        }

        // User is authenticated and owns the restaurant, proceed to link image
        console.log(`Linking image ${args.newImageId} to dish ${args.dishId} by user ${userId}`);
        // Pass the renamed argument
        await ctx.runMutation(internal.dishes.saveDishImageId, {
            dishId: args.dishId,
            newImageId: args.newImageId,
        });

        return null; // Return null on success
    }
});

// TODO: Add mutations/actions for creating/updating/deleting dishes manually if needed
// TODO: Add action for generating embeddings and taste profiles