import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Creates a new restaurant entry linked to the authenticated user.
 */
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to create a restaurant.");
    }

    console.log(`Creating restaurant '${args.name}' for user ${userId}`);
    const restaurantId = await ctx.db.insert("restaurants", {
      ownerUserId: userId,
      name: args.name,
      address: args.address,
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
  returns: v.array(v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      ownerUserId: v.id("users"),
      name: v.string(),
      address: v.optional(v.string()),
  })),
  handler: async (ctx): Promise<Doc<"restaurants">[]> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return []; // Return empty array if not logged in
    }

    const restaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
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
  returns: v.array(
    v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      ownerUserId: v.id("users"),
      name: v.string(),
      address: v.optional(v.string()),
    })
  ),
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
  returns: v.union(v.null(), v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      ownerUserId: v.id("users"),
      name: v.string(),
      address: v.optional(v.string()),
      menuImageUrl: v.optional(v.string()), // Keep fields consistent
      menuImageId: v.optional(v.id("_storage")), // Keep fields consistent
  })),
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
    if (restaurant.ownerUserId !== userId) {
      return null;
    }

    // Return the full restaurant object if owned by the user
    return restaurant;
  },
}); 