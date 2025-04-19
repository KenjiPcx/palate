import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Define embedding dimension (e.g., for OpenAI text-embedding-3-small)
const embeddingDimension = 1536;

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    ...authTables.users.validator.fields,
    role: v.optional(v.union(v.literal("consumer"), v.literal("business"))),
    // Add user profile embedding field
    profileEmbedding: v.optional(v.array(v.float64())),
  })
    .index("email", ["email"])
    // Add vector index for user profile
    .vectorIndex("by_profile_embedding", { 
        vectorField: "profileEmbedding", 
        dimensions: embeddingDimension, 
        filterFields: [] // No filters needed for now
    }),

  // Ensure restaurants table is defined
  restaurants: defineTable({
    ownerUserId: v.id("users"),
    name: v.string(),
    address: v.optional(v.string()),
    // Add other metadata as needed (e.g., cuisine type)
  })
    .index("by_owner", ["ownerUserId"]),

  dishes: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    tasteProfile: v.optional(v.object({
      scores: v.object({
        sweet: v.number(),
        sour: v.number(),
        salty: v.number(),
        bitter: v.number(),
        umami: v.number(),
        spicy: v.number(),
      }),
      tags: v.array(v.string()),
    })), // Keep taste profile for future use
    // Add dish embedding field
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_restaurant", ["restaurantId"])
    // Add vector index for dish embeddings
    .vectorIndex("by_embedding", { 
        vectorField: "embedding", 
        dimensions: embeddingDimension, 
        filterFields: ["restaurantId"] // Allow filtering by restaurant
    }),

  // Ensure user dish history table is defined
  userDishHistory: defineTable({
    userId: v.id("users"),
    dishId: v.id("dishes"),
    liked: v.optional(v.boolean()), // Simple like/dislike for MVP
    // removed comments: v.optional(v.string()), // Remove comments for MVP
    timestamp: v.number(), // Record when they logged it
  }).index("by_user", ["userId"])
    .index("by_user_dish", ["userId", "dishId"]),

  // Remove the placeholder tasks table if no longer needed
  // tasks: defineTable({ text: v.string(), isCompleted: v.boolean() }),
});

export default schema;