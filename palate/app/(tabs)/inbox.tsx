import React from 'react';
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
import { Clock, ChevronRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export default function InboxScreen() {
  const router = useRouter();
  const pendingRatings = useQuery(api.users.getUnratedDishes);

  const handleRatingPress = (dishId: Id<"dishes">) => {
    router.push(`/rate-dish/${dishId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Ratings</Text>
        <Text style={styles.headerSubtitle}>
          Rate dishes you've ordered to help others discover great food
        </Text>
      </View>

      {pendingRatings === undefined && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {pendingRatings !== undefined && (
        <FlatList
          data={pendingRatings}
          keyExtractor={(item) => item.historyId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ratingItem}
              onPress={() => handleRatingPress(item.dishId)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.dishImage || 'https://via.placeholder.com/60' }}
                style={styles.dishImage}
              />
              <View style={styles.ratingContent}>
                <Text style={styles.dishName}>{item.dishName}</Text>
                <Text style={styles.restaurantName}>{item.restaurantName}</Text>
                <View style={styles.dateContainer}>
                  <Clock size={14} color={colors.textLight} />
                  <Text style={styles.dateText}>Ordered on {new Date(item.timestamp).toLocaleDateString()}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Pending Ratings</Text>
              <Text style={styles.emptySubtitle}>
                Your pending ratings will appear here after you order food
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
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
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  ratingContent: {
    flex: 1,
    marginLeft: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});