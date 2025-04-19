import { v } from "convex/values";
import { internalQuery, mutation, query, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Retrieves the full user document for the currently authenticated user.
 * Returns null if the user is not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  // Explicitly define the return type including the optional role
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    // Include other fields from authTables.users if necessary
    role: v.optional(v.union(v.literal("consumer"), v.literal("business"))),
  })),
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      // This should not happen if getAuthUserId returns an ID, but handle defensively
      console.error(`User document not found for authenticated userId: ${userId}`);
      return null;
    }
    return user;
  },
});

/**
 * Updates the role for the currently authenticated user.
 * Throws an error if the user is not authenticated.
 */
export const updateRole = mutation({
  args: {
    role: v.union(v.literal("consumer"), v.literal("business")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to update role.");
    }

    console.log(`Updating role for user ${userId} to ${args.role}`);
    await ctx.db.patch(userId, { role: args.role });
    console.log(`Role updated successfully for user ${userId}`);
    return null;
  },
});

/**
 * Internal Mutation: Save the generated profile embedding to a user document.
 */
export const saveUserProfileEmbedding = internalMutation({
    args: {
        userId: v.id("users"),
        embedding: v.optional(v.array(v.float64())), // Match schema: T | undefined
    },
    returns: v.null(),
    handler: async (ctx, { userId, embedding }) => {
        await ctx.db.patch(userId, { profileEmbedding: embedding });
        console.log(`Patched user ${userId} profile embedding.`);
        return null;
    },
}); 