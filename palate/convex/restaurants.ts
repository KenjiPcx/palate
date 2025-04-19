import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Creates a new restaurant entry linked to the authenticated user.
 * Throws an error if the user is not authenticated or if they already own a restaurant.
 */
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
  },
  returns: v.id("restaurants"), // Return the ID of the newly created restaurant
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to create a restaurant.");
    }

    // Optional: Check if the user already owns a restaurant
    const existingRestaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .unique();

    if (existingRestaurant) {
      throw new Error("User already owns a restaurant.");
      // Or return existingRestaurant._id if we want to allow viewing it
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
 * Retrieves the restaurant owned by the currently authenticated user.
 * Returns null if the user is not authenticated or does not own a restaurant.
 */
export const getMyRestaurant = query({
  args: {},
  returns: v.union(v.null(), v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      ownerUserId: v.id("users"),
      name: v.string(),
      address: v.optional(v.string()),
  })),
  handler: async (ctx): Promise<Doc<"restaurants"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .unique(); // Use unique() as a user should only own one restaurant

    return restaurant;
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