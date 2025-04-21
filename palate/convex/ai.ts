import { v, type Infer } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, internalAction } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Define the structure for taste scores matching the schema
const tasteScoresValidator = v.object({
    sweet: v.optional(v.number()),
    sour: v.optional(v.number()),
    salty: v.optional(v.number()),
    bitter: v.optional(v.number()),
    umami: v.optional(v.number()),
    spicy: v.optional(v.number()),
});

// Manually define the type for saved dish data to pass to the trigger
type SavedDishForEmbedding = {
    dishId: Id<"dishes">;
    name: string;
    description?: string;
    tasteProfileScores?: Infer<typeof tasteScoresValidator> | undefined;
};

/**
 * Internal mutation to save the extracted dishes to the database
 * and schedule embedding generation for each.
 */
export const saveExtractedDishes = internalMutation({
    args: {
        restaurantId: v.id("restaurants"),
        dishes: v.array(v.object({
            name: v.string(),
            description: v.optional(v.string()),
            price: v.optional(v.number()),
            tasteProfileScores: v.optional(tasteScoresValidator),
        })),
    },
    returns: v.null(), // Keep return type as null
    handler: async (ctx, { restaurantId, dishes }) => { // Handler returns void/null
        console.log(`Saving ${dishes.length} dishes for restaurant ${restaurantId}`);
        // Explicitly type the array being collected
        const savedDishesData: SavedDishForEmbedding[] = [];

        for (const dish of dishes) {
            // Provide default scores if tasteProfileScores exists but specific scores are missing
            const scoresToSave = dish.tasteProfileScores ? {
                sweet: dish.tasteProfileScores.sweet ?? 0,
                sour: dish.tasteProfileScores.sour ?? 0,
                salty: dish.tasteProfileScores.salty ?? 0,
                bitter: dish.tasteProfileScores.bitter ?? 0,
                umami: dish.tasteProfileScores.umami ?? 0,
                spicy: dish.tasteProfileScores.spicy ?? 0,
            } : undefined;

            const newDishId = await ctx.db.insert("dishes", {
                restaurantId: restaurantId,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                tasteProfile: scoresToSave,
            });
            savedDishesData.push({
                dishId: newDishId,
                name: dish.name,
                description: dish.description,
                // Pass the original optional scores object to the trigger
                tasteProfileScores: dish.tasteProfileScores
            });
        }
        console.log(`Finished saving ${savedDishesData.length} dishes for restaurant ${restaurantId}`);

        // Schedule the next step (embedding generation) if dishes were saved
        if (savedDishesData.length > 0) {
            await ctx.scheduler.runAfter(0, internal.ai.triggerDishEmbeddingGeneration, {
                savedDishes: savedDishesData, // Pass the collected data
            });
        }
        return null; // Explicitly return null
    },
});

/**
 * Internal Action: Trigger embedding generation for newly saved dishes.
 */
export const triggerDishEmbeddingGeneration = internalAction({
    args: {
        // Match the SavedDishForEmbedding type structure
        savedDishes: v.array(v.object({
            dishId: v.id("dishes"),
            name: v.string(),
            description: v.optional(v.string()),
            tasteProfileScores: v.optional(tasteScoresValidator),
        }))
    },
    returns: v.null(),
    handler: async (ctx, { savedDishes }) => {
        console.log(`Triggering embedding generation for ${savedDishes.length} dishes.`);
        for (const dish of savedDishes) {
            // Pass taste scores to embedding action
            await ctx.runAction(internal.embedding.generateDishEmbedding, {
                dishId: dish.dishId,
                name: dish.name,
                description: dish.description,
                tasteProfileScores: dish.tasteProfileScores, // Pass scores
            });
        }
        // Use plain string
        console.log("Finished triggering embedding generation.");
        return null;
    }
}); 