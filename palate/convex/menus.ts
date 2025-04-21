"use node"; // Required for using Buffer, etc. if needed for validation

import { v } from "convex/values";
import { action } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { z } from "zod"; // Import Zod here as well
// Import AI SDK components
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Expanded Zod schema to include optional AI-guessed taste scores
const tasteScoreSchema = z.object({
    sweet: z.number().min(1).max(5).optional(),
    sour: z.number().min(1).max(5).optional(),
    salty: z.number().min(1).max(5).optional(),
    bitter: z.number().min(1).max(5).optional(),
    umami: z.number().min(1).max(5).optional(),
    spicy: z.number().min(1).max(5).optional(),
});

// Define the expected structure for an extracted dish (keep for reference/mutation)
const dishSchema = z.object({
    dishes: z.array(
        z.object({ 
            name: z.string().describe("The name of the dish."),
            description: z.string().optional().describe("A brief description of the dish, if available."),
            price: z.number().optional().describe("The price of the dish as a number, if available. Extract only the number."),
            // Add taste profile scores (optional, as AI might not always guess)
            tasteProfileScores: tasteScoreSchema.optional().describe("Estimated taste profile scores (1-5) based on description/name. Guess if possible, omit if unsure."),
        })
    )
});

/**
 * Action: Generate a short-lived upload URL for a menu image.
 * Requires authentication.
 */
export const generateMenuUploadUrl = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to upload a menu.");
    }

    // Check if user is a business user (optional but recommended)
    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (user?.role !== "business") {
        throw new Error("Only business users can upload menus.");
    }

    console.log(`Generating menu upload URL for user ${userId}`);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    console.log(`Upload URL generated for user ${userId}`);
    return uploadUrl;
  },
});

/**
 * Action: Process an uploaded menu image using AI SDK directly.
 */
export const processUploadedMenu = action({
    args: {
        storageId: v.id("_storage"),
        restaurantId: v.id("restaurants"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
          throw new Error("User must be authenticated.");
        }

        console.log(`Processing menu ${args.storageId} for restaurant ${args.restaurantId}`);

        // 1. Get image buffer
        const imageArrayBuffer = await ctx.storage.get(args.storageId);
        if (!imageArrayBuffer) {
            console.error(`Could not get content for storage ID: ${args.storageId}`);
            throw new Error("Failed to get menu image content.");
        }
        const arrayBuffer = await imageArrayBuffer.arrayBuffer();
        
        try {
            // Updated prompt to request taste profile guesses
            const promptText = 
                `Please extract dishes from this menu image based on the provided schema. 
                 For each dish, also try to estimate taste profile scores (sweet, sour, salty, bitter, umami, spicy) 
                 on a scale of 1 to 5 based on the name and description. Only include scores you can reasonably estimate. 
                 Return the data structured according to the schema.`;

            console.log(`Calling AI SDK generateObject for menu stored at ${args.storageId}`);
            const { object: parsedResultUnknown } = await generateObject({
                model: openai.chat("gpt-4o-mini"), 
                schema: dishSchema, 
                messages: [
                    { role: "user", content: [
                        { type: "text", text: promptText }, 
                        { type: "image", mimeType: "image/png", image: arrayBuffer }, 
                    ] },
                ]
            });

            // Cast the unknown result to the schema type
            const parsedResult = parsedResultUnknown as z.infer<typeof dishSchema>; 

            // Check if dishes property exists (optional safety check)
            if (!parsedResult || !Array.isArray(parsedResult.dishes)) {
                 console.error("AI SDK result did not contain a dishes array:", parsedResult);
                 throw new Error("Menu processing failed: Invalid format from AI.");
            }

            const extractedDishes = parsedResult.dishes;

            console.log(`AI SDK extracted ${extractedDishes.length} dishes.`);

            // 3. Save the extracted dishes (including potential taste scores)
            if (extractedDishes.length > 0) {
                await ctx.runMutation(internal.ai.saveExtractedDishes, {
                    restaurantId: args.restaurantId,
                    // Pass the full dish data including optional taste scores
                    dishes: extractedDishes, 
                });
                console.log(`Saved extracted dishes for restaurant ${args.restaurantId}`);
            } else {
                 console.warn(`AI SDK extracted 0 dishes for restaurant ${args.restaurantId}. No dishes saved.`);
            }

        } catch (error) {
             console.error(`Error processing menu ${args.storageId} for restaurant ${args.restaurantId}:`, error);
            throw new Error(`Menu processing failed: ${error instanceof Error ? error.message : "Unknown AI SDK error"}`);
        }

        return null;
    }
});

// --- Potential Internal Mutations/Queries needed by processing action ---
// internal mutation saveExtractedDishes(...) is now in ai.ts 