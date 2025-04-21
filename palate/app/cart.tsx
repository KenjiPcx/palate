import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { CartItem as CartItemComponent } from '@/components/CartItem';
import { Button } from '@/components/Button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

// Define CartItemWithDetails type inline using ReturnType
// (Alternatively, export it from convex/cart.ts)
type CartItemWithDetails = NonNullable<ReturnType<typeof useQuery<typeof api.cart.getUserCart>>>[number];

// Define Restaurant type based on cart query return
type CartRestaurant = CartItemWithDetails['restaurant'];

export default function CartScreen() {
  const router = useRouter();
  // Remove Zustand hooks
  // const { cart, clearCart } = useUserStore();
  // const { getRestaurantById } = useRestaurantStore();

  // --- Convex Hooks ---
  const cartData = useQuery(api.cart.getUserCart);
  const clearCartMutation = useMutation(api.cart.clearCart);
  // We'll need mutations for updating/removing items later in CartItemComponent
  // --- End Convex Hooks ---

  const [isLoading, setIsLoading] = useState(false); // Keep for checkout simulation

  // --- Data Processing with useMemo for efficiency ---
  const { groupedItemsByRestaurant, uniqueRestaurants, subtotal } = useMemo(() => {
    if (!cartData) {
      return { groupedItemsByRestaurant: {}, uniqueRestaurants: [], subtotal: 0 };
    }

    const grouped: Record<Id<"restaurants">, CartItemWithDetails[]> = {};
    const restaurantsMap = new Map<Id<"restaurants">, CartRestaurant>();
    let currentSubtotal = 0;

    for (const item of cartData) {
      const restaurantId = item.restaurant._id;
      if (!grouped[restaurantId]) {
        grouped[restaurantId] = [];
        restaurantsMap.set(restaurantId, item.restaurant); // Store unique restaurant details
      }
      grouped[restaurantId].push(item);
      currentSubtotal += (item.dish.price ?? 0) * item.quantity; // Use nullish coalescing for price
    }

    const restaurants = Array.from(restaurantsMap.values());

    return {
      groupedItemsByRestaurant: grouped,
      uniqueRestaurants: restaurants,
      subtotal: currentSubtotal
    };
  }, [cartData]); // Recalculate when cartData changes

  // --- Calculations ---
  const deliveryFee = uniqueRestaurants.length > 0 ? 2.99 : 0; // Example fee logic
  const serviceFee = subtotal * 0.05; // Example fee logic
  const tax = subtotal * 0.08; // Example tax logic
  const total = subtotal + deliveryFee + serviceFee + tax;
  // --- End Calculations ---

  // --- Loading and Empty States ---
  if (cartData === undefined) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading Cart...</Text>
      </SafeAreaView>
    );
  }

  if (!cartData || cartData.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items to get started</Text>
        <Button
          title="Browse Restaurants"
          onPress={() => router.push('/(tabs)/explore')} // Ensure path is correct
          style={styles.browseButton}
        />
      </SafeAreaView>
    );
  }
  // --- End Loading and Empty States ---

  // --- Handlers ---
  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => { // Make async
            try {
              await clearCartMutation({});
              // Optional: Add success feedback
            } catch (error) {
              console.error("Failed to clear cart:", error);
              Alert.alert("Error", "Could not clear cart.");
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    // TODO: Replace simulation with actual order creation logic
    // This would likely involve a mutation like `api.orders.createOrder`
    // passing the cart contents (or relevant IDs) and total.
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to a checkout confirmation or payment screen
      // For now, just navigate back or to a placeholder
      // router.push('/checkout-success'); // Example route
      Alert.alert("Checkout Simulated", "Order creation not implemented yet.");
    }, 1000);
  };
  // --- End Handlers ---

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cartData.length > 0 && ( // Only show clear if cart is not empty
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}
          >
            <Trash2 size={16} color={colors.error} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={uniqueRestaurants} // Iterate through unique restaurants
        keyExtractor={(item) => item._id} // Use restaurant ID as key
        renderItem={({ item: restaurant }) => (
          <View style={styles.restaurantSection}>
            <View style={styles.restaurantHeader}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
            </View>

            {/* Render items for this specific restaurant */}
            {groupedItemsByRestaurant[restaurant._id]?.map((item) => (
              // Map Convex data structure to props expected by CartItemComponent
              // NOTE: CartItemComponent still needs refactoring for Convex mutations
              <CartItemComponent
                key={item.dishId}
                // Pass props expected by the current CartItemComponent structure
                item={{
                  // Map fields from Convex `item` (CartItemWithDetails) 
                  // to the structure CartItemComponent likely expects (based on old store)
                  dish: {
                    id: item.dishId, // Map dishId to id for the component
                    name: item.dish.name,
                    price: item.dish.price ?? 0, // Provide default price
                    image: item.dish.imageUrls?.[0] ?? '', // Map first imageUrl, default to empty string
                    restaurantId: item.restaurant._id,
                    // Add other dish fields CartItemComponent might need, mapping with defaults
                    description: item.dish.description ?? '', // Default to empty string
                    category: item.dish.category ?? 'Unknown', // Default to 'Unknown' or empty string
                    tasteProfile: item.dish.tasteProfile ?? { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 0, spicy: 0 }, // Default profile
                    averageRating: item.dish.averageRating ?? 0, // Default to 0
                    // dietaryFlags: item.dish.dietaryFlags ?? [], // Removed - Not expected by CartItemComponent
                    // isAvailable: item.dish.isAvailable ?? true, // Removed - Not expected by CartItemComponent
                    // Missing reviews - pass empty array or null if needed by component
                    reviews: [],
                  },
                  quantity: item.quantity,
                }}
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Summary Section (uses calculated values) */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Fee</Text>
          <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          loading={isLoading}
          style={styles.checkoutButton}
          disabled={isLoading || cartData.length === 0} // Disable if loading or empty
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.error,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  restaurantSection: {
    marginBottom: 24,
  },
  restaurantHeader: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkoutButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
  },
  browseButton: {
    width: '80%',
    marginTop: 20,
  },
});