import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import type { Infer } from "convex/values";
import { restaurantValidator, restaurantWithImageUrlsValidator } from "./schema";

/**
 * Validator for fields updatable by owner
 */
const restaurantUpdateValidator = {
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  address: v.optional(v.string()),
  deliveryFee: v.optional(v.number()),
  categories: v.optional(v.array(v.string())),
  isOpen: v.optional(v.boolean()),
  // These are handled separately via linkRestaurantImage
  // imageId: v.optional(v.id("_storage")),
  // coverImageId: v.optional(v.id("_storage")),
};

/**
 * Helper to get image URLs
 */
async function getRestaurantImageUrls(ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } }, restaurant: Doc<"restaurants">): Promise<{ imageUrl: string | null; coverImageUrl: string | null }> {
  const imageUrl = restaurant.imageId ? await ctx.storage.getUrl(restaurant.imageId) : null;
  const coverImageUrl = restaurant.coverImageId ? await ctx.storage.getUrl(restaurant.coverImageId) : null;
  return { imageUrl, coverImageUrl };
}

/**
 * Creates a new restaurant entry linked to the authenticated user.
 */
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    // Add other initial fields?
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to create a restaurant.");
    }

    console.log(`Creating restaurant '${args.name}' for user ${userId}`);
    // Insert basic details, images added separately
    const restaurantId = await ctx.db.insert("restaurants", {
      userId: userId,
      name: args.name,
      address: args.address || "",
      description: args.description || "",
      // Initialize optional fields
      rating: 0,
      reviewCount: 0,
      isOpen: true, // Default to open?
      latitude: 0,
      longitude: 0,
    });
    console.log(`Restaurant created with ID: ${restaurantId}`);

    return restaurantId;
  },
});

/**
 * Retrieves all restaurants owned by the currently authenticated user.
 */
export const getMyRestaurants = query({
  args: {},
  returns: v.array(restaurantValidator),
  handler: async (ctx): Promise<Doc<"restaurants">[]> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return []; // Return empty array if not logged in
    }

    const restaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc") // Order by creation time or name?
      .collect();

    return restaurants;
  },
});

/**
 * Retrieves all restaurants (simple fetch for MVP).
 * Consider pagination for production.
 */
export const getAll = query({
  args: {},
  returns: v.array(restaurantValidator),
  handler: async (ctx): Promise<Doc<"restaurants">[]> => {
    // Simple fetch all for MVP - add pagination later
    const restaurants = await ctx.db.query("restaurants").collect();
    return restaurants;
  },
});

/**
 * Retrieves a specific restaurant by its ID, but only if it's owned by the
 * currently authenticated user. Returns null if the restaurant is not found
 * or not owned by the user.
 */
export const getRestaurantForUser = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.union(v.null(), restaurantValidator),
  handler: async (ctx, args): Promise<Doc<"restaurants"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      // Not logged in, can't own any restaurant
      return null;
    }

    const restaurant = await ctx.db.get(args.restaurantId);

    if (!restaurant) {
      // Restaurant not found
      return null;
    }

    // Check if the logged-in user is the owner
    if (restaurant.userId !== userId) {
      return null;
    }

    // Return the full restaurant object if owned by the user
    return restaurant;
  },
});

/**
 * Query: Get a single restaurant by ID (publicly accessible).
 */
export const getRestaurantById = query({
  args: { restaurantId: v.id("restaurants") },
  returns: v.union(v.null(), restaurantWithImageUrlsValidator),
  handler: async (ctx, args): Promise<Infer<typeof restaurantWithImageUrlsValidator> | null> => {
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      return null;
    }
    const { imageUrl, coverImageUrl } = await getRestaurantImageUrls(ctx, restaurant);
    return {
      ...restaurant,
      imageUrls: [imageUrl, coverImageUrl],
    };
  },
});

/**
 * Action: Updates a restaurant, handling image uploads if new images are provided.
 */
export const updateRestaurant = action({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    // Represent new images by their temporary file path or data URI from the client
    newImageFile: v.optional(v.string()), // We won't actually use the content here
    newCoverImageFile: v.optional(v.string()), // Just use presence to trigger URL generation
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to update a restaurant.");
    }

    // Verify ownership - Reuse the logic from the mutation or a helper
    const existingRestaurant = await ctx.runQuery(api.restaurants.getRestaurantForUser, { restaurantId: args.restaurantId });
    if (!existingRestaurant) {
      throw new Error("Restaurant not found or user does not have permission.");
    }

    let logoUploadUrl: string | undefined = undefined;
    let coverUploadUrl: string | undefined = undefined;

    // 1. Generate Upload URLs if new image files are indicated
    if (args.newImageFile) {
      logoUploadUrl = await ctx.storage.generateUploadUrl();
    }
    if (args.newCoverImageFile) {
      coverUploadUrl = await ctx.storage.generateUploadUrl();
    }

    // 2. Return URLs to the client. The client will upload and then call the mutation.
    //    The action *does not* wait for upload or link the image.
    //    It *could* potentially call the update mutation with non-image fields first,
    //    but let's keep it simple: client calls mutation after getting URLs/uploading.

    console.log("Generated URLs (if any):", { logoUploadUrl, coverUploadUrl });

    // Return the generated URLs so the client can upload
    return {
      logoUploadUrl,
      coverUploadUrl,
      // We don't call the update mutation here anymore
    };

    // --- REMOVED THE FOLLOWING LOGIC ---
    // // 2. Link new images if provided (THIS IS WRONG - Action shouldn't call internal mutation)
    // //    Client should upload using the URL and then call the update *mutation* with storage ID.
    // if (args.newImageId) {
    //   // This logic belongs in the mutation or is handled by client sending ID to mutation
    // }
    // if (args.newCoverImageId) {
    //   // This logic belongs in the mutation or is handled by client sending ID to mutation
    // }

    // // 3. Update other restaurant details (THIS IS ALSO WRONG - should be done in mutation)
    // await ctx.runMutation(api.restaurants.updateRestaurant, {
    //   restaurantId: args.restaurantId,
    //   name: args.name,
    //   description: args.description,
    //   address: args.address,
    //   // Pass undefined for image IDs here, client passes them in separate mutation call
    //   imageId: undefined,
    //   coverImageId: undefined
    // });

  },
});

/**
 * Mutation: Links uploaded image storage IDs and updates other restaurant details.
 * Requires user to be authenticated and own the restaurant.
 */
export const linkRestaurantImagesAndUpdate = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    // Pass storage IDs obtained after uploading via URL from updateRestaurant action
    imageId: v.optional(v.id("_storage")),
    coverImageId: v.optional(v.id("_storage")),
    // Other updatable fields
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    // Add other fields from schema as needed (e.g., latitude, longitude?)
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated.");
    }

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found.");
    }
    if (restaurant.userId !== userId) {
      throw new Error("User does not own this restaurant.");
    }

    const { restaurantId, ...updates } = args;

    // Filter out undefined values explicitly to avoid patching with undefined
    const patchData: Partial<Doc<"restaurants">> = {};
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.description !== undefined) patchData.description = updates.description;
    if (updates.address !== undefined) patchData.address = updates.address;
    if (updates.imageId !== undefined) patchData.imageId = updates.imageId;
    if (updates.coverImageId !== undefined) patchData.coverImageId = updates.coverImageId;
    // Add other fields here...

    if (Object.keys(patchData).length > 0) {
      await ctx.db.patch(restaurantId, patchData);
      console.log(`Patched restaurant ${restaurantId} with new data.`);
    } else {
      console.log(`No updates provided for restaurant ${restaurantId}.`);
    }


    // TODO: Handle deletion of old images if they are replaced?
    // This requires fetching the existing restaurant data before patching.
    // const oldImageId = restaurant.imageId;
    // const oldCoverImageId = restaurant.coverImageId;
    // ... perform patch ...
    // if (patchData.imageId && oldImageId && patchData.imageId !== oldImageId) {
    //   await ctx.storage.delete(oldImageId);
    // }
    // if (patchData.coverImageId && oldCoverImageId && patchData.coverImageId !== oldCoverImageId) {
    //   await ctx.storage.delete(oldCoverImageId);
    // }

    return null;
  },
});

/**
 * Mutation: Delete a restaurant and its associated dishes.
 * Requires user to be authenticated and own the restaurant.
 */
export const deleteRestaurant = mutation({
  args: { restaurantId: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated.");
    }

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found.");
    }
    if (restaurant.userId !== userId) {
      throw new Error("User does not own this restaurant.");
    }

    // 1. Find all dishes associated with the restaurant
    const dishesToDelete = await ctx.db
      .query("dishes")
      .withIndex("by_restaurant", q => q.eq("restaurantId", args.restaurantId))
      .collect();

    // TODO: Consider deleting reviews associated with these dishes?

    // 2. Delete associated dishes (and potentially their images)
    for (const dish of dishesToDelete) {
      // Delete associated images first (optional)
      if (dish.imageIds) {
        for (const imageId of dish.imageIds) {
          try {
            await ctx.storage.delete(imageId);
          } catch (e) {
            console.error(`Failed to delete image ${imageId} for dish ${dish._id}:`, e);
          }
        }
      }
      await ctx.db.delete(dish._id);
    }
    console.log(`Deleted ${dishesToDelete.length} dishes for restaurant ${args.restaurantId}`);

    // 3. Delete restaurant images (optional)
    if (restaurant.imageId) await ctx.storage.delete(restaurant.imageId).catch(e => console.error(`Failed to delete logo image ${restaurant.imageId}:`, e));
    if (restaurant.coverImageId) await ctx.storage.delete(restaurant.coverImageId).catch(e => console.error(`Failed to delete cover image ${restaurant.coverImageId}:`, e));

    // 4. Delete the restaurant document
    await ctx.db.delete(args.restaurantId);
    console.log(`Deleted restaurant ${args.restaurantId}`);

    return null;
  },
});

/**
 * Action: Generate a short-lived upload URL for a restaurant image (logo or cover).
 * Requires authentication and user must own the restaurant.
 */
export const generateRestaurantImageUploadUrl = action({
  args: { restaurantId: v.id("restaurants") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated.");
    }

    // Verify ownership
    const restaurant = await ctx.runQuery(api.restaurants.getMyRestaurants, {}); // Check if it exists in user's list
    const ownedRestaurant = restaurant.find(r => r._id === args.restaurantId);
    if (!ownedRestaurant) {
      throw new Error("User does not own this restaurant or restaurant not found.");
    }

    console.log(`Generating image upload URL for restaurant ${args.restaurantId}`);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
}); 