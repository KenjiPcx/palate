import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';

interface CategoryPillProps {
  category: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ 
  category, 
  isSelected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected ? styles.selectedContainer : null,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          isSelected ? styles.selectedText : null,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  selectedContainer: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: 14,
    color: colors.text,
  },
  selectedText: {
    color: colors.white,
    fontWeight: '500',
  },
});