import type React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import type { CartItem as CartItemType } from '@/types';
// import { useUserStore } from '@/store/userStore';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  // const { updateCartItemQuantity, removeFromCart } = useUserStore();

  const handleIncrement = () => {
    // // updateCartItemQuantity(item.dish.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      // updateCartItemQuantity(item.dish.id, item.quantity - 1);
    } else {
      // removeFromCart(item.dish.id);
    }
  };

  const handleRemove = () => {
    // removeFromCart(item.dish.id);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.dish.image }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name}>{item.dish.name}</Text>
        <Text style={styles.price}>${item.dish.price.toFixed(2)}</Text>
        {item.specialInstructions && (
          <Text style={styles.instructions}>{item.specialInstructions}</Text>
        )}
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleDecrement}
          activeOpacity={0.8}
        >
          {item.quantity === 1 ? (
            <Trash2 size={16} color={colors.error} />
          ) : (
            <Minus size={16} color={colors.text} />
          )}
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleIncrement}
          activeOpacity={0.8}
        >
          <Plus size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
});