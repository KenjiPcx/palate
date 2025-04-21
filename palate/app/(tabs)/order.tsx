import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, MapPin, ChevronRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { Order } from '@/types';
import { CartButton } from '@/components/CartButton';

const OrderItem: React.FC<{ order: Order }> = ({ order }) => {
  const router = useRouter();
  
  const handlePress = () => {
    // Navigate to order details
    // router.push(`/order/${order.id}`);
  };
  
  const getStatusColor = (status: Order['status']) => {
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
  
  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for pickup';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
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
          source={{ uri: order.restaurantImage }} 
          style={styles.restaurantImage} 
        />
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>
        <ChevronRight size={20} color={colors.textLight} />
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderItems}>
          {order.items.map(item => `${item.quantity}x ${item.dish.name}`).join(', ')}
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
      
      {(order.status === 'confirmed' || order.status === 'preparing') && (
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
      )}
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const user = useUserStore(state => state.user);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  
  const activeOrders = user?.orders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
  ) || [];
  
  const pastOrders = user?.orders.filter(order => 
    ['delivered', 'cancelled'].includes(order.status)
  ) || [];
  
  const orders = activeTab === 'active' ? activeOrders : pastOrders;
  
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
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderItem order={item} />}
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
      
      <CartButton />
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
    paddingBottom: 80,
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
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});