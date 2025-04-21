import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { type Infer, v } from "convex/values";

// Define embedding dimension (e.g., for OpenAI text-embedding-3-small)
const embeddingDimension = 1536;

// Define TasteProfile validator based on frontend type
const tasteProfileValidator = v.object({
  sweet: v.number(),
  salty: v.number(),
  sour: v.number(),
  bitter: v.number(),
  umami: v.number(),
  spicy: v.number(),
});

const dishValidator = v.object({
  restaurantId: v.id("restaurants"),
  name: v.string(),
  description: v.optional(v.string()),
  price: v.optional(v.number()), // Keep optional, handle default in frontend?
  category: v.optional(v.string()),
  // Use correct validator based on frontend type
  tasteProfile: v.optional(tasteProfileValidator),
  averageRating: v.optional(v.number()), // Add average rating
  // reviews are linked via reviews.dishId
  dietaryFlags: v.optional(v.array(v.string())), // Keep from previous schema
  isAvailable: v.optional(v.boolean()), // Keep from previous schema
  embedding: v.optional(v.array(v.float64())), // Keep embedding
  imageIds: v.optional(v.array(v.id("_storage"))), // Keep multiple image IDs
})


export const dishWithImageUrlsValidator = v.object({
  ...dishValidator.fields,
  imageUrls: v.array(v.union(v.string(), v.null())),
})

export const restaurantValidator = v.object({
  userId: v.id("users"),
  name: v.string(),
  description: v.string(),
  address: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  // Add optional image fields
  imageId: v.optional(v.id("_storage")),
  coverImageId: v.optional(v.id("_storage")),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  isOpen: v.optional(v.boolean()),
})

export const restaurantWithImageUrlsValidator = v.object({
  ...restaurantValidator.fields,
  imageUrls: v.array(v.union(v.string(), v.null())),
})

export type FullDishReturn = Infer<typeof dishWithImageUrlsValidator>;

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    ...authTables.users.validator.fields, // includes name, email from auth
    // Fields from frontend User type
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()), // Assuming URL or identifier
    tasteProfile: v.optional(tasteProfileValidator),
    favoriteRestaurants: v.optional(v.array(v.id("restaurants"))),
    favoriteDishes: v.optional(v.array(v.id("dishes"))),
    recentlyViewed: v.optional(v.array(v.id("dishes"))), // Assuming dish IDs
    // addresses: v.optional(v.array(v.id("addresses"))), // Add if addresses table is created
    // orders: v.optional(v.array(v.id("orders"))), // Add if orders table is created
    isBusinessOwner: v.optional(v.boolean()),
    // ownedRestaurants: v.optional(v.array(v.id("restaurants"))), // Redundant? Use restaurants.ownerUserId index
    // pendingRatings: v.optional(v.array(v.id("pendingRatings"))), // Add if pendingRatings table is created
    // reviews: v.optional(v.array(v.id("reviews"))), // Relation handled via reviews table
    // friends: v.optional(v.array(v.id("friends"))), // Add if friends table/relation is created
    role: v.optional(v.union(v.literal("consumer"), v.literal("business"))), // Kept from previous schema
    // image: v.optional(v.string()), // Replaced by avatar?
    profileEmbedding: v.optional(v.array(v.float64())), // Keep embedding
    // Add cart items directly to user document for simplicity
    cartItems: v.optional(v.array(v.object({
      dishId: v.id("dishes"),
      quantity: v.number(),
      // Add other item-specific details if needed later (e.g., special instructions)
    }))),
  })
    .index("email", ["email"])
    // Add vector index for user profile
    .vectorIndex("by_profile_embedding", {
      vectorField: "profileEmbedding",
      dimensions: embeddingDimension,
      filterFields: [] // No filters needed for now
    }),

  // Ensure restaurants table is defined
  restaurants: defineTable(restaurantValidator).index("by_userId", ["userId"]),

  dishes: defineTable(dishValidator)
    .index("by_restaurant", ["restaurantId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: embeddingDimension,
      filterFields: ["restaurantId", "category", "dietaryFlags", "isAvailable"], // Keep filters
    }),

  // Add reviews table based on frontend type
  reviews: defineTable({
    userId: v.id("users"),
    dishId: v.id("dishes"), // Assuming reviews are per-dish
    // restaurantId: v.optional(v.id("restaurants")), // Or per-restaurant?
    rating: v.number(),
    comment: v.optional(v.string()),
    // userName: v.string(), // Denormalized? Fetch from user
    // userAvatar: v.string(), // Denormalized? Fetch from user
    timestamp: v.number(), // Use Convex creation time or explicit timestamp?
  })
    .index("by_dish", ["dishId"])
    .index("by_user", ["userId"])
    .index("by_user_dish", ["userId", "dishId"]),

  // Keep userDishHistory for tracking likes/logs?
  userDishHistory: defineTable({
    userId: v.id("users"),
    dishId: v.id("dishes"),
    liked: v.optional(v.boolean()),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_dish", ["userId", "dishId"]),

  // Define other tables like orders, addresses, pendingRatings, friends if needed
  // Basic Orders table definition based on types/index.ts Order type
  orders: defineTable({
    userId: v.id("users"), // Link to user
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    restaurantImage: v.optional(v.string()), // URL or storage ID?
    items: v.array(v.object({ // Define CartItem structure
      dishId: v.id("dishes"), // Link to dish
      // Denormalize dish details needed for display?
      dishName: v.string(),
      dishPrice: v.number(),
      dishImage: v.optional(v.string()),
      quantity: v.number(),
      specialInstructions: v.optional(v.string()),
    })),
    status: v.union( // Use union for status literals
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    total: v.number(),
    orderTimestamp: v.number(), // Use a specific field instead of relying only on _creationTime?
    deliveryAddress: v.optional(v.string()), // Keep address optional if not always delivery
    deliveryFee: v.optional(v.number()),
    // estimatedDeliveryTime: v.optional(v.string()), // Likely dynamic
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]), // Index for filtering by status

  // Remove the placeholder tasks table if no longer needed
  // tasks: defineTable({ text: v.string(), isCompleted: v.boolean() }),
});

export default schema;