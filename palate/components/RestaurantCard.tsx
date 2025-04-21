import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Clock } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  horizontal?: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant,
  horizontal = false,
}) => {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/restaurant/${restaurant.id}`);
  };
  
  if (horizontal) {
    return (
      <TouchableOpacity 
        style={styles.horizontalContainer} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: restaurant.image }} 
          style={styles.horizontalImage} 
          resizeMode="cover"
        />
        <View style={styles.horizontalContent}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color={colors.rating} fill={colors.rating} />
            <Text style={styles.rating}>{restaurant.rating}</Text>
            <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
          </View>
          <Text style={styles.categories} numberOfLines={1}>
            {restaurant.categories.join(' • ')}
          </Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Clock size={12} color={colors.textLight} />
              <Text style={styles.infoText}>{restaurant.deliveryTime}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: restaurant.image }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.ratingContainer}>
          <Star size={14} color={colors.rating} fill={colors.rating} />
          <Text style={styles.rating}>{restaurant.rating}</Text>
          <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
        </View>
        <Text style={styles.categories} numberOfLines={1}>
          {restaurant.categories.join(' • ')}
        </Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Clock size={12} color={colors.textLight} />
            <Text style={styles.infoText}>{restaurant.deliveryTime}</Text>
          </View>
        </View>
      </View>
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
    width: '100%',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 2,
  },
  categories: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
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
    height: 100,
  },
  horizontalImage: {
    width: 100,
    height: '100%',
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
});