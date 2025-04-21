# Palate - Dish-Level Food Recommendation App Idea

## 1. Overall Goal

To create a personalized food recommendation system that suggests specific dishes to users based on their taste preferences, discovered through rating dishes they've eaten. The platform also aims to provide valuable taste preference insights to restaurants.

## 2. Core Components

* **Unified Mobile App (Expo + React Native + Convex):**
* Single application serving both consumers and business users (restaurants).
* Handles user onboarding and role selection (Consumer vs. Business).
* **Consumer Flow:** Browse restaurants/dishes, log eaten dishes, rate/comment, receive recommendations.
* **Business Flow:** Register restaurant details, upload menus (image-based), view dish/taste insights (future).
* Interface to define and manage dish details, including taste profiles (potentially initiated by AI agent, refined by user).

## 3. Key Features

* **Restaurant & Menu Management:**
* Restaurants as entities.
* Ability to upload/parse menus (initially manual entry, potential for OCR/parsing later).
* CRUD operations for dishes linked to restaurants.
* **Dish Taste Profiling:**
* **Hybrid Approach:**
  * **Core Flavors:** Assign scores (1-5) for basic tastes: Sweet, Sour, Salty, Bitter, Umami, Spicy.
  * **Descriptive Tags:** Allow adding relevant tags (e.g., "creamy", "smoky", "herbal", "garlicky", prominent ingredients, texture notes).
* Metadata extraction (description, ingredients if available, price).
* **User Interaction:**
* Browse restaurants and their dishes.
* Log eaten dishes ("Add to Collection/History").
* Simple rating system (e.g., Like/Dislike).
* Optional text comments/feedback on dishes.
* Chat interface for logging/rating dishes.
* **Recommendation System:**
* **Dish Embeddings:** Generate vector embeddings for each dish based on:
  * Numeric taste profile scores.
  * Embedded descriptive tags.
  * Embedded dish description text.
  * Other relevant metadata (cuisine type, etc.).
* **User Profile Embedding:** Dynamically generate a vector embedding for each user representing their taste preferences, derived from the embeddings of dishes they have rated (positively weighted for likes, potentially negatively for dislikes).
* **Recommendation Generation:** Use Convex vector search to find dishes with embeddings closest (cosine similarity) to the user's profile embedding, excluding already rated dishes.
* **Search:**
* Users can search for dishes using keywords (leveraging Convex full-text search).
* Potentially filter search by taste profile elements.
* **AI Chat Agent:**
* A higher-level chat endpoint that can interact with the core app functions (finding dishes, adding ratings, getting recommendations) for a more conversational user experience.

## 4. Data Model (Conceptual - Convex Tables)

* `restaurants`: (name, address, metadata)
* `dishes`: (restaurantId, name, description, price, tasteProfile: { scores: {...}, tags: [...] }, embedding: Vector)
* `users`: (authId, profileEmbedding: Vector)
* `userDishHistory`: (userId, dishId, liked: boolean, comments: string, timestamp)
* *Alternatively, reviews could be a separate table.*

## 5. Technology Stack

* **Backend & Database:** Convex
* **Frontend:** React Native (Expo)
* **Authentication:** Convex Auth
* **AI/ML:**
* Convex Agent Component (for menu processing, chat)
* Embedding Models (e.g., OpenAI via API)
* Convex Vector Search
* Convex Full-Text Search

## 6. API Endpoints (Conceptual - Convex Functions)

* **Admin/Dish Management:**
* `restaurants:create`, `restaurants:get`
* `dishes:uploadMenu` (Action to process menu data)
* `dishes:create`, `dishes:update` (updates taste profiles, triggers embedding recalculation), `dishes:delete`, `dishes:get`
* `dishes:generateEmbedding` (Internal Action)
* **User:**
* `users:logDish` (Mutation: adds to `userDishHistory`, triggers user profile update)
* `users:updateProfileEmbedding` (Internal Action)
* `users:getHistory` (Query)
* `users:getRecommendations` (Query: performs vector search)
* `search:dishes` (Query: uses full-text and/or vector search)
* **General:**
* `chat:handleMessage` (Action: interacts with other functions based on intent)

## 7. Potential Value

* **For Users:** Discover new dishes and restaurants aligned with their specific taste preferences.
* **For Restaurants:** Gain insights into popular taste profiles, dish performance, and customer preferences to optimize menus and ingredients.

## 8. Design / Theme

* **Color Palette:** Lush Pink and Orange.


Key features requested:
1. Food ordering app with taste profiles for dishes
2. Rating system for users to rate dishes
3. Recommendation system based on taste profiles
4. Dual mode: consumer view and business view
5. Remove delivery distance focus (not a delivery app)
6. Add restaurant creation feature
7. Filter food by taste profiles
8. Social aspect showing what friends with similar taste profiles are eating/liking
9. Inbox for pending dish ratings after orders

The most important files to modify would be:

1. app/(tabs)/inbox.tsx - For the rating todos/inbox feature
2. app/(tabs)/explore.tsx - For adding taste profile filters to food search
3. app/(tabs)/index.tsx - For the home feed showing recommendations and friends' activities
4. app/business/add-restaurant.tsx - For adding restaurants in business mode
5. app/business/add-dish.tsx - For adding dishes with taste profiles
6. app/rate-dish/[id].tsx - For rating dishes after orders
7. store/userStore.ts - For managing user taste profiles and pending ratings
8. components/TasteProfileRadar.tsx - For visualizing taste profiles
9. app/(tabs)/profile.tsx - For the combined profile/settings screen
10. app/dish/[id].tsx - For dish details with taste profile display
- app/(tabs)/inbox.tsx
- app/(tabs)/explore.tsx
- app/(tabs)/index.tsx
- app/business/add-restaurant.tsx
- app/business/add-dish.tsx
- app/rate-dish/[id].tsx
- store/userStore.ts
- components/TasteProfileRadar.tsx
- app/(tabs)/profile.tsx
- app/dish/[id].tsx