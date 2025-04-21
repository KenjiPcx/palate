import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Query: Get all orders for the currently authenticated user.
 * Orders are returned most recent first.
 */
export const getForUser = query({
    args: {},
    // Return type should match the orders table structure
    returns: v.array(v.object({
        _id: v.id("orders"),
        _creationTime: v.number(),
        userId: v.id("users"),
        restaurantId: v.id("restaurants"),
        restaurantName: v.string(),
        restaurantImage: v.optional(v.string()),
        items: v.array(v.object({
            dishId: v.id("dishes"),
            dishName: v.string(),
            dishPrice: v.number(),
            dishImage: v.optional(v.string()),
            quantity: v.number(),
            specialInstructions: v.optional(v.string()),
        })),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("ready"),
            v.literal("delivered"),
            v.literal("cancelled")
        ),
        total: v.number(),
        orderTimestamp: v.number(),
        deliveryAddress: v.optional(v.string()),
        deliveryFee: v.optional(v.number()),
    })),
    handler: async (ctx): Promise<Doc<"orders">[]> => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            return []; // Return empty array if not logged in
        }

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc") // Order by creation time descending (most recent first)
            .collect();

        return orders;
    },
}); 