import type React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import colors from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  editable = false,
  onRatingChange,
}) => {
  const handlePress = (selectedRating: number) => {
    if (editable && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= rating;
        const halfFilled = !filled && starValue <= rating + 0.5;
        
        return (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(starValue)}
            disabled={!editable}
            activeOpacity={editable ? 0.7 : 1}
            style={{ padding: 2 }}
          >
            <Star
              size={size}
              color={colors.rating}
              fill={filled ? colors.rating : 'none'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});