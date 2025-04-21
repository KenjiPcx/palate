import type React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import type { TasteProfile } from '@/types';

interface MappedDishData {
  id: string;
  name: string;
  description: string;
  image: string;
  restaurantName: string;
  tasteProfile: TasteProfile;
  price: number;
  category: string;
  reviews: unknown[];
  averageRating: number;
  restaurantId: string;
}

interface DishCardProps {
  dish: MappedDishData;
  onPress: () => void;
  horizontal?: boolean;
  showAddButton?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({ 
  dish,
  onPress,
  horizontal = false,
  showAddButton = true,
}) => {
  const handleAddToCart = () => {
    console.log('Add to cart clicked for:', dish.name);
  };
  
  if (horizontal) {
    return (
      <TouchableOpacity 
        style={styles.horizontalContainer} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: dish.image }} 
          style={styles.horizontalImage} 
          resizeMode="cover"
        />
        <View style={styles.horizontalContent}>
          <Text style={styles.name} numberOfLines={1}>{dish.name}</Text>
          <Text style={styles.description} numberOfLines={2}>{dish.description}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>${dish.price.toFixed(2)}</Text>
            {dish.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.rating} fill={colors.rating} />
                <Text style={styles.rating}>{dish.averageRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
        {showAddButton && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: dish.image }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{dish.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{dish.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>${dish.price.toFixed(2)}</Text>
          {dish.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={14} color={colors.rating} fill={colors.rating} />
              <Text style={styles.rating}>{dish.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      {showAddButton && (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: '1%',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.border,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
    minHeight: 32,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 4,
  },
  addButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  horizontalContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    marginBottom: 12,
  },
  horizontalImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.border,
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 4,
  }
});