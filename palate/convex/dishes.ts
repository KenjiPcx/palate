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

/**
 * Action: Generate upload URLs for potentially multiple new dish images.
 * Requires authentication and user must own the restaurant associated with the dish.
 * The client should specify how many URLs are needed.
 */
export const updateDishAction = action({
    args: {
        dishId: v.id("dishes"),
        // Client specifies how many new images they intend to upload
        newImageCount: v.number(),
        // Other fields are NOT updated here, only URLs are generated
    },
    returns: v.object({
        uploadUrls: v.array(v.string()),
    }),
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
        const restaurant = await ctx.runQuery(api.restaurants.getRestaurantForUser, {
            restaurantId: dish.restaurantId,
        });
        if (!restaurant) {
            throw new Error("User does not own the restaurant associated with this dish.");
        }

        // Generate the requested number of upload URLs
        const uploadUrls: string[] = [];
        if (args.newImageCount > 0) {
            console.log(`Generating ${args.newImageCount} upload URLs for dish ${args.dishId}`);
            for (let i = 0; i < args.newImageCount; i++) {
                const url = await ctx.storage.generateUploadUrl();
                uploadUrls.push(url);
            }
        }

        // Return the array of URLs
        return { uploadUrls };
    },
});

/**
 * Mutation: Links new image storage IDs and updates other dish details.
 * Requires user to be authenticated and own the associated restaurant.
 * Replaces the entire imageIds array with the one provided.
 */
export const linkDishImagesAndUpdate = mutation({
    args: {
        dishId: v.id("dishes"),
        // Client provides the *complete* list of storage IDs for the dish
        // This includes existing IDs they want to keep and new IDs from recent uploads.
        imageIds: v.optional(v.array(v.id("_storage"))),
        // Other updatable fields from dishValidator (except restaurantId)
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        category: v.optional(v.string()),
        tasteProfile: v.optional(v.object({ // Make sure this matches schema.ts
            sweet: v.number(),
            salty: v.number(),
            sour: v.number(),
            bitter: v.number(),
            umami: v.number(),
            spicy: v.number(),
        })),
        dietaryFlags: v.optional(v.array(v.string())),
        isAvailable: v.optional(v.boolean()),
        // embedding is handled separately
        // averageRating is likely calculated, not set directly
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }

        const dish = await ctx.db.get(args.dishId);
        if (!dish) {
            throw new Error("Dish not found.");
        }

        // Verify user owns the associated restaurant
        const restaurant = await ctx.db.get(dish.restaurantId);
        if (!restaurant || restaurant.userId !== userId) {
            throw new Error("User does not own the restaurant associated with this dish.");
        }

        const { dishId, ...updates } = args;

        // Prepare the patch data, explicitly filtering undefined values
        const patchData: Partial<Doc<"dishes">> = {};
        if (updates.name !== undefined) patchData.name = updates.name;
        if (updates.description !== undefined) patchData.description = updates.description;
        if (updates.price !== undefined) patchData.price = updates.price;
        if (updates.category !== undefined) patchData.category = updates.category;
        if (updates.tasteProfile !== undefined) patchData.tasteProfile = updates.tasteProfile;
        if (updates.dietaryFlags !== undefined) patchData.dietaryFlags = updates.dietaryFlags;
        if (updates.isAvailable !== undefined) patchData.isAvailable = updates.isAvailable;
        // IMPORTANT: Replace the entire imageIds array
        if (updates.imageIds !== undefined) patchData.imageIds = updates.imageIds;

        if (Object.keys(patchData).length > 0) {
            // TODO: Handle deletion of images that were removed from the imageIds array?
            // Requires comparing args.imageIds with dish.imageIds before patching.
            const oldImageIds = dish.imageIds ?? [];
            const newImageIds = args.imageIds ?? [];
            const idsToDelete = oldImageIds.filter(id => !newImageIds.includes(id));

            await ctx.db.patch(dishId, patchData);
            console.log(`Patched dish ${dishId} with new data.`);

            // Delete orphaned images *after* successful patch
            if (idsToDelete.length > 0) {
                console.log(`Deleting ${idsToDelete.length} orphaned images for dish ${dishId}`);
                await Promise.all(idsToDelete.map(id => ctx.storage.delete(id).catch(e => console.error(`Failed to delete image ${id}:`, e))));
            }

        } else {
            console.log(`No updates provided for dish ${dishId}.`);
        }

        return null;
    },
});

/**
 * Mutation: Delete a dish and its associated images.
 * Requires user to be authenticated and own the associated restaurant.
 */
export const deleteDish = mutation({
    args: { dishId: v.id("dishes") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }

        const dish = await ctx.db.get(args.dishId);
        if (!dish) {
            // Dish already deleted or never existed, consider this success.
            console.warn(`Dish ${args.dishId} not found for deletion.`);
            return null;
        }

        // Verify user owns the associated restaurant
        const restaurant = await ctx.db.get(dish.restaurantId);
        if (!restaurant || restaurant.userId !== userId) {
            throw new Error("User does not own the restaurant associated with this dish.");
        }

        // Delete associated images first
        const imageIdsToDelete = dish.imageIds ?? [];
        if (imageIdsToDelete.length > 0) {
            console.log(`Deleting ${imageIdsToDelete.length} images for dish ${args.dishId}`);
            await Promise.all(imageIdsToDelete.map(id => ctx.storage.delete(id).catch(e => console.error(`Failed to delete image ${id}:`, e))));
        }

        // Delete the dish document
        await ctx.db.delete(args.dishId);
        console.log(`Deleted dish ${args.dishId}`);

        return null;
    },
});

/**
 * Mutation: Create a new dish for a specific restaurant.
 * Requires user to be authenticated and own the restaurant.
 * Images are added/updated separately after creation using linkDishImagesAndUpdate.
 */
export const createDish = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        // Required fields
        name: v.string(),
        price: v.number(),
        // Optional fields (matching schema)
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        tasteProfile: v.optional(v.object({ // Match validator in schema.ts
            sweet: v.number(),
            salty: v.number(),
            sour: v.number(),
            bitter: v.number(),
            umami: v.number(),
            spicy: v.number(),
        })),
        dietaryFlags: v.optional(v.array(v.string())),
        isAvailable: v.optional(v.boolean()),
        // imageIds are handled after creation
    },
    returns: v.id("dishes"), // Return the new dish ID
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated to create a dish.");
        }

        // Verify user owns the restaurant
        const restaurant = await ctx.db.get(args.restaurantId);
        if (!restaurant) {
            throw new Error("Restaurant not found.");
        }
        if (restaurant.userId !== userId) {
            throw new Error("User does not own this restaurant.");
        }

        console.log(`Creating dish '${args.name}' for restaurant ${args.restaurantId}`);

        // Insert the new dish
        const dishId = await ctx.db.insert("dishes", {
            restaurantId: args.restaurantId,
            name: args.name,
            price: args.price,
            description: args.description, // Will be undefined if not provided
            category: args.category,
            tasteProfile: args.tasteProfile,
            dietaryFlags: args.dietaryFlags,
            isAvailable: args.isAvailable ?? true, // Default to available if not specified
            imageIds: [], // Start with empty images
            // averageRating will be calculated later
            // embedding will be generated later
        });

        console.log(`Dish created with ID: ${dishId}`);
        return dishId;
    },
});

// TODO: Add mutations/actions for creating/updating/deleting dishes manually if needed
// TODO: Add action for generating embeddings and taste profiles