"use node"; // Required for using Buffer, etc. if needed for validation

import { v } from "convex/values";
import { action } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { z } from "zod"; // Import Zod here as well

// Define the expected structure for an extracted dish (keep for reference/mutation)
const dishSchema = z.object({
    name: z.string().describe("The name of the dish."),
    description: z.string().optional().describe("A brief description of the dish, if available."),
    price: z.number().optional().describe("The price of the dish as a number, if available. Extract only the number."),
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
 * Action: Process an uploaded menu image.
 * Takes the storage ID and the restaurant ID.
 * Uses the AI Agent to extract dishes and saves them.
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

        // 1. Get file URL from storage ID
        const imageUrl = await ctx.storage.getUrl(args.storageId);
        if (!imageUrl) {
            console.error(`Could not get URL for storage ID: ${args.storageId}`);
            // Optionally: delete the storage item or mark the restaurant as needing attention
            throw new Error("Failed to get menu image URL.");
        }

        try {
            // 2. Call the AI agent action with the image URL
            console.log(`Calling AI agent for menu: ${imageUrl}`);
            const extractionResult = await ctx.runAction(internal.ai.runMenuParser, {
                generateObject: {
                    schema: z.array(z.object({ 
                        name: z.string().describe("The name of the dish."),
                        description: z.string().optional().describe("A brief description of the dish, if available."),
                        price: z.number().optional().describe("The price of the dish as a number, if available. Extract only the number."),
                    })),
                    messages: [
                        { role: "user", content: [
                            { type: "text", text: "Please extract dishes from this menu image based on the provided schema." },
                            { type: "image", mimeType: "image/jpeg", image: imageUrl },
                        ] },
                    ]
                }
            });

            // Check if the agent successfully returned an object
            if (extractionResult.object === undefined || extractionResult.object === null) {
                console.error("AI agent did not return an object.", extractionResult);
                throw new Error("Menu processing failed: AI agent did not extract dishes.");
            }

            // Type assertion (consider adding validation if needed)
            const extractedDishes = extractionResult.object as Array<{ name: string; description?: string; price?: number }>;

            console.log(`AI agent extracted ${extractedDishes.length} dishes.`);

            // 3. Save the extracted dishes using the internal mutation
            if (extractedDishes.length > 0) {
                await ctx.runMutation(internal.ai.saveExtractedDishes, {
                    restaurantId: args.restaurantId,
                    dishes: extractedDishes,
                });
                console.log(`Successfully saved extracted dishes for restaurant ${args.restaurantId}`);
            } else {
                console.warn(`AI agent extracted 0 dishes for restaurant ${args.restaurantId}. No dishes saved.`);
                // Optionally, notify the user or log this for review.
            }

        } catch (error) {
            console.error(`Error processing menu ${args.storageId} for restaurant ${args.restaurantId}:`, error);
            // Rethrow or handle error appropriately (e.g., log to an error tracking service)
            throw new Error(`Menu processing failed: ${error instanceof Error ? error.message : "Unknown AI agent error"}`);
        }

        return null;
    }
});

// --- Potential Internal Mutations/Queries needed by processing action ---
// internal mutation saveExtractedDishes(...) is now in ai.ts 