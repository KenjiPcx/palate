import { v } from "convex/values";
import { Agent } from "@convex-dev/agent";
import { api, internal, components } from "./_generated/api";
import { action, internalAction, internalMutation } from "./_generated/server";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Doc, Id } from "./_generated/dataModel";

// Define the expected structure for an extracted dish
const dishSchema = z.object({
    name: z.string().describe("The name of the dish."),
    description: z.string().optional().describe("A brief description of the dish, if available."),
    price: z.number().optional().describe("The price of the dish as a number, if available. Extract only the number."),
    // We won't ask the AI to guess taste profiles initially, just extract core info.
});

// Define the agent for parsing menus
const menuParserAgent = new Agent(components.agent, {
    // Use a vision-capable model
    chat: openai.chat("gpt-4o-mini"), 
    // No embedding needed for this specific task
    // Instructions to the model
    instructions: 
        `You are an expert menu analysis assistant. Given an image of a restaurant menu, 
         extract all the individual dishes listed. For each dish, provide its name, 
         description (if available), and price (if listed, as a numeric value). 
         Focus only on extracting the information directly visible on the menu. 
         Do not invent descriptions or prices. Ignore categories, headers, or non-dish text. 
         Return the extracted dishes as an array of objects.`, 
    // Define the expected output format using the Zod schema
    // Removed the 'output' property
});

/**
 * Public action to trigger menu parsing using the agent.
 * Takes a storage ID for the menu image.
 * Returns the extracted dish data.
 */
export const runMenuParser = menuParserAgent.asAction({});

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
        })),
    },
    returns: v.null(), // Keep return type as null
    handler: async (ctx, { restaurantId, dishes }) => { // Handler returns void/null
        console.log(`Saving ${dishes.length} dishes for restaurant ${restaurantId}`);
        const savedDishesData: { dishId: Id<"dishes">; name: string; description?: string }[] = [];
        for (const dish of dishes) {
            const newDishId = await ctx.db.insert("dishes", {
                restaurantId: restaurantId,
                name: dish.name,
                description: dish.description,
                price: dish.price,
            });
            // Collect data needed for embedding generation
            savedDishesData.push({ dishId: newDishId, name: dish.name, description: dish.description });
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
 * Takes minimal dish data needed for embedding.
 */
export const triggerDishEmbeddingGeneration = internalAction({
    args: {
        // Adjust args to match data passed from scheduler
        savedDishes: v.array(v.object({ 
             dishId: v.id("dishes"),
             name: v.string(),
             description: v.optional(v.string()),
        }))
    },
    returns: v.null(),
    handler: async (ctx, { savedDishes }) => {
        console.log(`Triggering embedding generation for ${savedDishes.length} dishes.`);
        for (const dish of savedDishes) {
            // Use correct internal path
            await ctx.runAction(internal.embedding.generateDishEmbedding, {
                dishId: dish.dishId,
                name: dish.name,
                description: dish.description,
            });
        }
        // Use plain string
        console.log("Finished triggering embedding generation.");
        return null;
    }
}); 