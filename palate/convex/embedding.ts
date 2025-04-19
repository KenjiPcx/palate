"use node";
import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { embed } from "ai"; 
import { openai } from "@ai-sdk/openai";
import type { Doc, Id } from "./_generated/dataModel";

// Define embedding dimension (ensure consistency with schema)
const embeddingDimension = 1536;

/**
 * Internal Action: Generate embedding for a single dish.
 */
export const generateDishEmbedding = internalAction({
  args: {
    dishId: v.id("dishes"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const textToEmbed = `${args.name}${args.description ? `: ${args.description}` : ''}`;
    
    console.log(`Generating embedding for dish ${args.dishId}: "${textToEmbed.substring(0, 50)}..."`);

    try {
        const { embedding } = await embed({
            model: openai.embedding("text-embedding-3-small"),
            value: textToEmbed,
        });

        // Validate embedding dimension (optional but good practice)
        if (embedding.length !== embeddingDimension) {
            throw new Error(`Generated embedding has incorrect dimension: ${embedding.length}`);
        }

        // Save the embedding to the dish document using the mutation in dishes.ts
        await ctx.runMutation(internal.dishes.saveDishEmbedding, {
            dishId: args.dishId,
            embedding: embedding,
        });

        console.log(`Successfully generated and saved embedding for dish ${args.dishId}`);

    } catch (error) {
        console.error(`Failed to generate/save embedding for dish ${args.dishId}:`, error);
        // Decide how to handle failures: retry, log, mark dish?
        // For now, just log the error.
    }

    return null;
  },
});

/**
 * Internal Action: Update the user's profile embedding based on their dish history.
 */
export const updateUserProfileEmbedding = internalAction({
    args: {
        userId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        console.log(`Updating profile embedding for user ${args.userId}`);

        // 1. Get user's dish history
        const history = await ctx.runQuery(api.history.getUserHistory, { userId: args.userId });
        if (history.length === 0) {
            console.log(`User ${args.userId} has no history, skipping profile update.`);
            // Optionally clear existing profile embedding?
            // await ctx.runMutation(internal.embedding.saveUserProfileEmbedding, { userId: args.userId, embedding: null });
            return null;
        }

        // 2. Get embeddings for rated dishes
        const dishIds = history.map((entry: Doc<"userDishHistory">) => entry.dishId);
        const dishDocs = await ctx.runQuery(api.dishes.getDishesByIds, { dishIds });

        const dishEmbeddings = new Map<Id<"dishes">, number[]>();
        for (const dish of dishDocs) {
            if (dish?.embedding) { 
                dishEmbeddings.set(dish._id, dish.embedding);
            }
        }

        if (dishEmbeddings.size === 0) {
             console.log(`No valid embeddings found for dishes rated by user ${args.userId}. Skipping profile update.`);
             return null;
        }

        // 3. Calculate average embedding
        const avgEmbedding = new Array(embeddingDimension).fill(0);
        let validRatingsCount = 0;

        for (const entry of history) {
            const embedding = dishEmbeddings.get(entry.dishId);
            if (embedding) {
                const weight = entry.liked ? 1.0 : -0.5;
                for (let i = 0; i < embeddingDimension; i++) {
                    avgEmbedding[i] += embedding[i] * weight;
                }
                validRatingsCount++;
            }
        }

        if (validRatingsCount === 0) {
             console.log(`No ratings with valid embeddings found for user ${args.userId}. Skipping profile update.`);
             return null;
        }

        // Normalize the average embedding
        for (let i = 0; i < embeddingDimension; i++) {
            avgEmbedding[i] /= validRatingsCount;
        }

        // 4. Save the new profile embedding using the mutation in users.ts
        await ctx.runMutation(internal.users.saveUserProfileEmbedding, {
            userId: args.userId,
            embedding: avgEmbedding,
        });

        console.log(`Successfully updated profile embedding for user ${args.userId}`);
        return null;
    }
});

// Helper Query to get dish history (used by updateUserProfileEmbedding)
// Moved to history.ts where it makes more sense

// Helper Query to get multiple dishes by ID (used by updateUserProfileEmbedding)
// Moved to dishes.ts where it makes more sense 