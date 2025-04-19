import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Retrieves all dishes for a given restaurant ID.
 */
export const getForRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  // Define the return type as an array of dish documents
  returns: v.array(
    v.object({
      _id: v.id("dishes"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      // Add tasteProfile later if needed
    })
  ),
  handler: async (ctx, args): Promise<Doc<"dishes">[]> => {
    const dishes = await ctx.db
      .query("dishes")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("desc") // Or order by name, etc.
      .collect();

    return dishes;
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
  returns: v.array(v.union(v.null(), v.object({ // Match dish schema
    _id: v.id("dishes"),
    _creationTime: v.number(),
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    embedding: v.optional(v.array(v.float64())),
    // Add tasteProfile later if needed
  }))),
  handler: async (ctx, args): Promise<(Doc<"dishes"> | null)[]> => {
    // Use Promise.all for efficient parallel fetching
    const dishes = await Promise.all(
      args.dishIds.map(dishId => ctx.db.get(dishId))
    );
    return dishes;
  },
});

// TODO: Add mutations/actions for creating/updating/deleting dishes manually if needed
// TODO: Add action for generating embeddings and taste profiles 