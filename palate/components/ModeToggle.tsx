import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Store } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';

export const ModeToggle: React.FC = () => {
  const { isBusinessMode, toggleBusinessMode } = useUserStore();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          !isBusinessMode && styles.activeButton,
        ]}
        onPress={() => !isBusinessMode || toggleBusinessMode()}
        activeOpacity={0.8}
      >
        <User 
          size={20} 
          color={!isBusinessMode ? colors.white : colors.text} 
        />
        <Text
          style={[
            styles.buttonText,
            !isBusinessMode && styles.activeButtonText,
          ]}
        >
          Consumer
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          isBusinessMode && styles.activeButton,
        ]}
        onPress={() => isBusinessMode || toggleBusinessMode()}
        activeOpacity={0.8}
      >
        <Store 
          size={20} 
          color={isBusinessMode ? colors.white : colors.text} 
        />
        <Text
          style={[
            styles.buttonText,
            isBusinessMode && styles.activeButtonText,
          ]}
        >
          Business
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: colors.text,
  },
  activeButtonText: {
    color: colors.white,
  },
});