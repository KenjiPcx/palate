import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Users, Heart, MessageSquare, Share2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import type { FeedItem } from '@/convex/feed';
import type { TasteProfile } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const getFeedAction = useAction(api.feed.getFeed);
  const [feed, setFeed] = useState<FeedItem[] | undefined>(undefined);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoadingFeed(true);
      try {
        const result = await getFeedAction({});
        setFeed(result);
      } catch (error) {
        console.error("Error fetching feed:", error);
        setFeed([]);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    loadFeed();
  }, [getFeedAction]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await getFeedAction({});
      setFeed(result);
    } catch (error) {
      console.error("Error refreshing feed:", error);
    }
    setRefreshing(false);
  };

  const handleDishPress = (dishId: string | Doc<"dishes">['_id']) => {
    router.push(`/dish/${dishId.toString()}`);
  };

  const handleRestaurantPress = (restaurantId: string | Doc<"restaurants">['_id']) => {
    router.push(`/restaurant/${restaurantId.toString()}`);
  };

  const handleUserPress = (userId: string | Doc<"users">['_id']) => {
    console.log(`Navigate to user ${userId.toString()}`);
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const { type, data } = item;

    switch (type) {
      case 'dish_review': {
        const reviewData = data as any;
        const { user: reviewUser, dish: reviewDish, restaurant: reviewRestaurant, comment } = reviewData;

        if (!reviewUser || !reviewDish || !reviewRestaurant) {
          console.warn('Skipping rendering review item due to missing data:', item.id);
          return null;
        }

        return (
          <View style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => handleUserPress(reviewUser._id)}
              >
                <Image
                  source={{ uri: reviewUser.avatar || 'https://via.placeholder.com/40' }}
                  style={styles.userAvatar}
                />
                <View>
                  <Text style={styles.userName}>{reviewUser.name}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDishPress(reviewDish._id)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: reviewDish.image || 'https://via.placeholder.com/300' }}
                style={styles.dishImage}
              />

              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{reviewDish.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRestaurantPress(reviewRestaurant._id)}
                >
                  <Text style={styles.restaurantName}>{reviewRestaurant.name}</Text>
                </TouchableOpacity>
              </View>

              {comment && <Text style={styles.reviewComment}>{comment}</Text>}
            </TouchableOpacity>

            <View style={styles.feedActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageSquare size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      case 'similar_users':
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Similar Users (TODO)</Text>
          </View>
        );

      case 'taste_recommendation':
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recommendations (TODO)</Text>
          </View>
        );

      default:
        console.warn('Unknown feed item type:', type);
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>TasteConnect</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/36' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingFeed && feed === undefined && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {!isLoadingFeed && feed !== undefined && (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFeedItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Feed is empty</Text>
              <Text style={styles.emptySubtext}>Explore dishes and rate them to build your feed!</Text>
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
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  feedContainer: {
    paddingBottom: 20,
  },
  feedCard: {
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tasteMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tasteMatchText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
  dishImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.border,
  },
  dishInfo: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dishName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.primary,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: colors.white,
    marginBottom: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  similarUsersContainer: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  similarUserCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
  },
  similarUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    alignSelf: 'center',
    backgroundColor: colors.border,
  },
  similarUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  similarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  similarityText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  recentLikeContainer: {
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  recentLikeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  recentLikeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  recentLikeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  recentLikeName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  recentLikeRestaurant: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.9,
  },
  recommendedDishesContainer: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  recommendedDishCard: {
    width: 180,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  recommendedDishImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
  },
  recommendedDishInfo: {
    padding: 12,
  },
  recommendedDishName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  recommendedDishRestaurant: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 8,
  },
  tasteMatchBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tasteMatchBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 50,
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