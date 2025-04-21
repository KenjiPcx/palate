import type React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';

export const CartButton: React.FC = () => {
  const router = useRouter();
  const cart = useUserStore(state => state.cart);
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const handlePress = () => {
    router.push('/cart');
  };
  
  if (totalItems === 0) {
    return null;
  }
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <ShoppingCart size={24} color={colors.white} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{totalItems}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});