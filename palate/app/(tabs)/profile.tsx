import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Heart,
  Star,
  ChevronRight,
  Edit2,
  User,
  CreditCard,
  MapPin,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import { DishCard } from '@/components/DishCard';
import { SectionHeader } from '@/components/SectionHeader';
import { ModeToggle } from '@/components/ModeToggle';
import type { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import type { FullDishReturn } from '@/convex/schema';
import type { TasteProfile } from '@/types';

const defaultTasteProfile: TasteProfile = {
  sweet: 0.5,
  salty: 0.5,
  sour: 0.5,
  bitter: 0.5,
  umami: 0.5,
  spicy: 0.5,
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const { signOut } = useAuthActions();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const favoriteDishIds = user?.favoriteDishes ?? [];
  const favoriteDishesQuery = useQuery(
    api.dishes.getDishesByIds,
    favoriteDishIds.length > 0 ? { dishIds: favoriteDishIds } : 'skip'
  );

  const favoriteDishes = favoriteDishesQuery?.filter(d => d !== null) ?? [];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('User signed out');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Logout Failed', 'Could not log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAddRestaurant = () => {
    router.push('/business/add-restaurant');
  };

  if (user === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>Please log in.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: user.avatar || 'https://via.placeholder.com/70' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => { }}
            >
              <Edit2 size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.favoriteRestaurants?.length || 0}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="App Mode" />
          <View style={styles.modeToggleContainer}>
            <ModeToggle />
          </View>
          <Text style={styles.sectionDescription}>
            {user.role === 'business'
              ? 'Business mode allows you to manage your restaurants and menus'
              : 'Consumer mode allows you to browse and order food'}
          </Text>

          {user.role === 'business' && (
            <TouchableOpacity
              style={styles.addRestaurantButton}
              onPress={handleAddRestaurant}
            >
              <Text style={styles.addRestaurantText}>Add New Restaurant</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Your Taste Profile" />
          <View style={styles.tasteProfileContainer}>
            <TasteProfileRadar
              tasteProfile={user.tasteProfile || defaultTasteProfile}
              showValues
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Favorite Dishes"
            onSeeAll={() => { /* TODO: Navigate to favorites screen */ }}
          />
          {favoriteDishesQuery === undefined && favoriteDishIds.length > 0 && (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          )}
          {favoriteDishesQuery !== undefined && favoriteDishes.length > 0 && (
            <FlatList
              data={favoriteDishes}
              keyExtractor={(item) => item?._id.toString() ?? Math.random().toString()}
              renderItem={({ item }) => {
                if (!item) {
                  return null;
                }

                const mappedDishData = {
                  id: item._id.toString(),
                  name: item.name,
                  description: item.description ?? '',
                  image: item.imageUrls?.[0] || 'https://via.placeholder.com/150',
                  restaurantName: 'Restaurant Name',
                  tasteProfile: item.tasteProfile ?? defaultTasteProfile,
                  price: item.price ?? 0,
                  category: item.category ?? 'Unknown',
                  reviews: [],
                  averageRating: item.averageRating ?? 0,
                  restaurantId: item.restaurantId.toString(),
                };
                return (
                  <View style={styles.dishCardContainer}>
                    <DishCard
                      dish={mappedDishData}
                      onPress={() => router.push(`/dish/${item._id}`)}
                    />
                  </View>
                );
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
          {(favoriteDishesQuery !== undefined && favoriteDishes.length === 0) || favoriteDishIds.length === 0 && (
            <View style={styles.emptyContainer}>
              <Heart size={40} color={colors.primary} />
              <Text style={styles.emptyText}>No favorite dishes yet</Text>
              <Text style={styles.emptySubtext}>
                Heart the dishes you love to see them here
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Account" />
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <User size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Personal Information</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Payment Methods</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MapPin size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Addresses</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: `${colors.primary}80` }}
              thumbColor={notificationsEnabled ? colors.primary : colors.card}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Support" />
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <HelpCircle size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help Center</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.white,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.border,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textLight,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  section: {
    padding: 16,
    marginTop: 8,
    backgroundColor: colors.white,
  },
  modeToggleContainer: {
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  addRestaurantButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addRestaurantText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tasteProfileContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 0,
    marginTop: 8,
  },
  dishCardContainer: {
    width: 200,
    marginRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    minHeight: 150,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: colors.textLight,
  },
  spacer: {
  },
});