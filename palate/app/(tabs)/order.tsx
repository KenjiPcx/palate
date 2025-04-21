// import React, { useState } from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, MapPin, ChevronRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

// Define Order type based on Convex query return value
type ConvexOrder = Doc<"orders">;

const OrderItem: React.FC<{ order: ConvexOrder }> = ({ order }) => {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to order details
    // router.push(`/order/${order._id}`); // Use Convex ID
    console.log('Navigate to order:', order._id);
  };

  const getStatusColor = (status: ConvexOrder['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
      case 'preparing':
        return colors.info;
      case 'ready':
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textLight;
    }
  };

  const getStatusText = (status: ConvexOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for pickup'; // Update text if needed
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        {
          const _exhaustiveCheck: never = status;
          return status;
        }
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <Image
          source={{ uri: order.restaurantImage || 'https://via.placeholder.com/40' }} // Use field from Convex
          style={styles.restaurantImage}
        />
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          {/* Use orderTimestamp or _creationTime */}
          <Text style={styles.orderDate}>{new Date(order.orderTimestamp).toLocaleDateString()}</Text>
        </View>
        <ChevronRight size={20} color={colors.textLight} />
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderItems}>
          {/* Map items from Convex order data */}
          {order.items.map(item => `${item.quantity}x ${item.dishName}`).join(', ')}
        </Text>
        <View style={styles.orderFooter}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(order.status) }
              ]}
            />
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Remove delivery info section based on requirements? */}
      {/* {(order.status === 'confirmed' || order.status === 'preparing') && (
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryInfoItem}>
            <Clock size={16} color={colors.textLight} />
            <Text style={styles.deliveryInfoText}>
              Estimated delivery: {order.estimatedDeliveryTime}
            </Text>
          </View>
          <View style={styles.deliveryInfoItem}>
            <MapPin size={16} color={colors.textLight} />
            <Text style={styles.deliveryInfoText} numberOfLines={1}>
              {order.deliveryAddress}
            </Text>
          </View>
        </View>
      )} */}
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Fetch orders from Convex
  const allOrders = useQuery(api.orders.getForUser);

  // Filter orders based on tab state
  // Define active/past statuses
  const activeStatuses: ConvexOrder['status'][] = ['pending', 'confirmed', 'preparing', 'ready'];
  const pastStatuses: ConvexOrder['status'][] = ['delivered', 'cancelled'];

  const activeOrders = allOrders?.filter(order => activeStatuses.includes(order.status)) ?? [];
  const pastOrders = allOrders?.filter(order => pastStatuses.includes(order.status)) ?? [];

  const ordersToDisplay = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Handle loading state */}
      {allOrders === undefined && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Render list once data is loaded */}
      {allOrders !== undefined && (
        <FlatList
          data={ordersToDisplay} // Use filtered orders
          keyExtractor={(item) => item._id.toString()} // Use Convex ID
          renderItem={({ item }) => <OrderItem order={item} />} // Pass ConvexOrder
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'active'
                  ? "You don't have any active orders"
                  : "You don't have any past orders"}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'active'
                  ? "Orders you place will appear here"
                  : "Your order history will appear here"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabText: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Add padding for potential floating buttons
    flexGrow: 1, // Ensure empty component fills space
  },
  orderItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restaurantImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border, // Placeholder background
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  orderDetails: {
    padding: 12,
  },
  orderItems: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  /* // Delivery Info styles removed as section is commented out
  deliveryInfo: {
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deliveryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryInfoText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 6,
  },
  */
  loadingContainer: { // Add loading style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1, // Ensure empty container fills space
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50, // Add margin
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});