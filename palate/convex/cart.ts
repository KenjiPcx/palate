import { v, type Infer } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { dishWithImageUrlsValidator } from "./schema";

// Helper type for cart items stored in the user document
type CartItem = {
    dishId: Id<"dishes">;
    quantity: number;
};

// Helper type for the return value of getUserCart
const cartItemWithDetailsValidator = v.object({
    // From CartItem
    dishId: v.id("dishes"),
    quantity: v.number(),
    // From Dish (with URLs)
    dish: dishWithImageUrlsValidator,
    // From Restaurant
    restaurant: v.object({
        _id: v.id("restaurants"),
        name: v.string(),
        // Add other restaurant fields if needed for cart display
    }),
});

/**
 * Get the current user's cart items, enriching them with dish and restaurant details.
 */
export const getUserCart = query({
    args: {},
    returns: v.array(cartItemWithDetailsValidator),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return []; // Not logged in, empty cart
        }

        const user = await ctx.db.get(userId);
        if (!user || !user.cartItems || user.cartItems.length === 0) {
            return []; // No user or empty cart
        }

        const cartItems = user.cartItems;

        // Fetch all required dishes in parallel
        const dishIds = cartItems.map(item => item.dishId);
        const dishes = await ctx.runQuery(api.dishes.getDishesByIds, { dishIds });

        // Create a map for easy lookup
        const dishMap = new Map<Id<"dishes">, Doc<"dishes"> & { imageUrls: (string | null)[] }>();
        for (const dish of dishes) {
            if (dish) {
                dishMap.set(dish._id, dish);
            }
        }

        // Fetch all required restaurants (derive IDs from fetched dishes)
        const restaurantIds = [...new Set(
            dishes
                .filter((d): d is Doc<"dishes"> & { imageUrls: (string | null)[] } => d !== null)
                .map(d => d.restaurantId)
        )];

        // Fetch restaurant details (assuming a getRestaurantsByIds query exists or fetching individually)
        // For simplicity, fetch individually here. Consider batching for performance.
        const restaurantMap = new Map<Id<"restaurants">, Doc<"restaurants">>();
        await Promise.all(restaurantIds.map(async (id) => {
            const restaurant = await ctx.db.get(id);
            if (restaurant) {
                restaurantMap.set(id, restaurant);
            }
        }));

        // Combine data
        const detailedCart = cartItems.map(item => {
            const dishDetails = dishMap.get(item.dishId);
            if (!dishDetails) return null; // Dish might have been deleted

            const restaurantDetails = restaurantMap.get(dishDetails.restaurantId);
            if (!restaurantDetails) return null; // Restaurant might have been deleted

            return {
                dishId: item.dishId,
                quantity: item.quantity,
                dish: dishDetails,
                restaurant: {
                    _id: restaurantDetails._id,
                    name: restaurantDetails.name,
                },
            };
        }).filter(item => item !== null) as Infer<typeof cartItemWithDetailsValidator>[]; // Filter out nulls and assert type

        return detailedCart;
    },
});

/**
 * Add a dish to the user's cart or increment its quantity.
 */
export const addItem = mutation({
    args: { dishId: v.id("dishes") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        // Ensure dish exists before adding
        const dish = await ctx.db.get(args.dishId);
        if (!dish) {
            throw new Error("Dish not found.");
        }

        const currentCart = user.cartItems ?? [];
        const existingItemIndex = currentCart.findIndex(item => item.dishId === args.dishId);

        let updatedCart: CartItem[];
        if (existingItemIndex > -1) {
            // Increment quantity
            updatedCart = currentCart.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            // Add new item
            updatedCart = [...currentCart, { dishId: args.dishId, quantity: 1 }];
        }

        await ctx.db.patch(userId, { cartItems: updatedCart });
        console.log(`Cart updated for user ${userId}. Item: ${args.dishId}`);
        return null;
    },
});

/**
 * Update the quantity of a specific item in the user's cart.
 */
export const updateItemQuantity = mutation({
    args: {
        dishId: v.id("dishes"),
        quantity: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }
        if (args.quantity <= 0) {
            // If quantity is zero or less, remove the item directly within this mutation
            const user = await ctx.db.get(userId);
            if (!user) {
                throw new Error("User not found.");
            }
            const currentCart = user.cartItems ?? [];
            const updatedCart = currentCart.filter(item => item.dishId !== args.dishId);
            if (updatedCart.length !== currentCart.length) {
                await ctx.db.patch(userId, { cartItems: updatedCart });
                console.log(`Cart item removed (quantity <= 0) for user ${userId}. Item: ${args.dishId}`);
            }
            return null;
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        const currentCart = user.cartItems ?? [];
        const itemIndex = currentCart.findIndex(item => item.dishId === args.dishId);

        if (itemIndex === -1) {
            // Item not found, maybe add it?
            // For now, do nothing or throw error
            console.warn(`Item ${args.dishId} not found in cart for update.`);
            return null;
        }

        const updatedCart = currentCart.map((item, index) =>
            index === itemIndex
                ? { ...item, quantity: args.quantity }
                : item
        );

        await ctx.db.patch(userId, { cartItems: updatedCart });
        console.log(`Cart quantity updated for user ${userId}. Item: ${args.dishId}, Quantity: ${args.quantity}`);
        return null;
    },
});

/**
 * Remove a specific item entirely from the user's cart.
 */
export const removeItem = mutation({
    args: { dishId: v.id("dishes") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        const currentCart = user.cartItems ?? [];
        const updatedCart = currentCart.filter(item => item.dishId !== args.dishId);

        // Only patch if the cart actually changed
        if (updatedCart.length !== currentCart.length) {
            await ctx.db.patch(userId, { cartItems: updatedCart });
            console.log(`Cart item removed for user ${userId}. Item: ${args.dishId}`);
        } else {
            console.log(`Item ${args.dishId} not found in cart for removal.`);
        }

        return null;
    },
});

/**
 * Clear all items from the user's cart.
 */
export const clearCart = mutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User must be authenticated.");
        }

        // Patch with empty array
        await ctx.db.patch(userId, { cartItems: [] });
        console.log(`Cart cleared for user ${userId}.`);
        return null;
    },
});

// TODO: Add createOrder mutation (likely in orders.ts) 