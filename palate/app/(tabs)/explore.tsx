import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Filter, Sliders, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import colors from '@/constants/colors';
import { SearchBar } from '@/components/SearchBar';
import { CategoryPill } from '@/components/CategoryPill';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DishCard } from '@/components/DishCard';
import type { TasteProfile } from '@/types';

// --- Convex Imports ---
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
// Define the type for a dish coming from Convex query
type ConvexDish = Doc<"dishes"> & { imageUrls: (string | null)[] };
// ---------------------

const categories = [
  'All',
  'Pizza',
  'Sushi',
  'Burgers',
  'Italian',
  'Mexican',
  'Chinese',
  'Indian',
  'Thai',
  'Desserts',
];

const tasteFilters: { name: string, profile: keyof TasteProfile }[] = [
  { name: 'Sweet', profile: 'sweet' },
  { name: 'Salty', profile: 'salty' },
  { name: 'Sour', profile: 'sour' },
  { name: 'Bitter', profile: 'bitter' },
  { name: 'Umami', profile: 'umami' },
  { name: 'Spicy', profile: 'spicy' },
];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTasteFilters, setSelectedTasteFilters] = useState<string[]>([]);
  const [showTasteFilters, setShowTasteFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'restaurants' | 'dishes'>('dishes');
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

  // Fetch dishes using Convex
  const {
    results: dishes, // dishes: ConvexDish[] | undefined
    status: dishesStatus,
    loadMore: loadMoreDishes,
  } = usePaginatedQuery(
    api.dishes.getAll,
    {}, // TODO: Pass filters/search as args later
    { initialNumItems: 10 }
  );

  // Filter dishes fetched from Convex on the client-side
  const filteredDishes = useMemo(() => {
    if (!dishes) return [];

    return dishes.filter((dish: ConvexDish) => { // Add type annotation
      // Search filter (name, description)
      const matchesSearch = searchQuery === '' ||
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Use optional chaining for conciseness
        (dish.description?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter (assuming dish.category exists)
      const matchesCategory = selectedCategory === 'All' ||
        (dish.category && dish.category === selectedCategory);

      // Taste filter
      const matchesTasteProfile = selectedTasteFilters.length === 0 ||
        (dish.tasteProfile && selectedTasteFilters.every(filter => {
          const tasteKey = tasteFilters.find(t => t.name === filter)?.profile;
          // Use optional chaining for safety, default score to 0
          return tasteKey ? (dish.tasteProfile?.[tasteKey] ?? 0) >= 3 : false; // Use threshold like 3 (adjust as needed)
        }));

      return matchesSearch && matchesCategory && matchesTasteProfile;
    });
  }, [dishes, searchQuery, selectedCategory, selectedTasteFilters]);

  const toggleTasteFilter = (filter: string) => {
    setSelectedTasteFilters(prev => {
      // Simplify toggle logic
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      }
      return [...prev, filter];
    });
  };

  const applyTasteFilters = () => {
    // Now just closes the modal, filtering is reactive
    setShowTasteFilters(false);
  };

  const toggleRestaurantExpansion = (restaurantId: string) => {
    setExpandedRestaurant(prev => prev === restaurantId ? null : restaurantId);
  };

  const renderHeader = () => (
    <>
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'dishes' && styles.viewToggleButtonActive
          ]}
          onPress={() => setViewMode('dishes')}
        >
          <Text style={[
            styles.viewToggleText,
            viewMode === 'dishes' && styles.viewToggleTextActive
          ]}>
            Dishes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'restaurants' && styles.viewToggleButtonActive
          ]}
          onPress={() => setViewMode('restaurants')}
        >
          <Text style={[
            styles.viewToggleText,
            viewMode === 'restaurants' && styles.viewToggleTextActive
          ]}>
            Restaurants
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryPill
              category={item}
              isSelected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {viewMode === 'dishes'
            ? `${filteredDishes.length} ${filteredDishes.length === 1 ? 'dish' : 'dishes'} found`
            : 'Restaurant view data pending'}
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTasteFilters(!showTasteFilters)}
        >
          <Sliders size={18} color={colors.text} />
          <Text style={styles.filterText}>Taste Filters</Text>
          {selectedTasteFilters.length > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{selectedTasteFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showTasteFilters && (
        <View style={styles.tasteFiltersContainer}>
          <Text style={styles.tasteFiltersTitle}>Filter by Taste Profile</Text>
          <View style={styles.tasteFiltersList}>
            {tasteFilters.map((filter) => (
              <TouchableOpacity
                key={filter.name}
                style={[
                  styles.tasteFilterPill,
                  selectedTasteFilters.includes(filter.name) && styles.selectedTasteFilterPill
                ]}
                onPress={() => toggleTasteFilter(filter.name)}
              >
                <Text
                  style={[
                    styles.tasteFilterText,
                    selectedTasteFilters.includes(filter.name) && styles.selectedTasteFilterText
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={applyTasteFilters}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderDishesView = () => {
    if (dishesStatus === 'LoadingFirstPage' && filteredDishes.length === 0) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />;
    }

    if (filteredDishes.length === 0 && dishesStatus !== 'LoadingFirstPage') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Dishes Found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }: { item: ConvexDish }) => {
          // Map Convex data to an object structure potentially expected by DishCard
          const mappedDishData = {
            id: item._id.toString(), // Convert Id to string if needed by DishCard
            name: item.name,
            description: item.description ?? '',
            image: item.imageUrls?.[0] || 'https://via.placeholder.com/150',
            restaurantName: `Restaurant ID: ${item.restaurantId.substring(0, 5)}...`, // Placeholder
            tasteProfile: item.tasteProfile ?? { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, spicy: 0 },
            // Add any other fields DishCard might expect within its 'dish' prop
            price: item.price ?? 0, // Use price from Convex or default to 0
            category: item.category ?? 'Unknown', // Use category or default
            reviews: [], // Pass empty array for reviews (not available)
            averageRating: 0, // Pass default for averageRating (not available)
            restaurantId: item.restaurantId.toString(), // Pass restaurantId as string
          };

          return (
            <DishCard
              // Pass the mapped data object as the 'dish' prop
              dish={mappedDishData}
              // Keep onPress separate as it's likely expected directly on DishCard
              onPress={() => router.push(`/dish/${item._id}`)}
            />
          );
        }}
        numColumns={2}
        contentContainerStyle={styles.dishesGrid}
        ListFooterComponent={() =>
          dishesStatus === 'LoadingMore' ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
        onEndReached={() => {
          if (dishesStatus === 'CanLoadMore') {
            loadMoreDishes(10);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    );
  };

  const renderRestaurantsView = () => {
    return (
      <View style={styles.placeholder}>
        <Text>Restaurant view not yet implemented with Convex.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {renderHeader()}

      {viewMode === 'dishes' ? renderDishesView() : renderRestaurantsView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.white,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  viewToggleTextActive: {
    color: colors.primary,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textLight,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  filterCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
    minWidth: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tasteFiltersContainer: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tasteFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tasteFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tasteFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTasteFilterPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tasteFilterText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedTasteFilterText: {
    color: colors.white,
    fontWeight: '500',
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  restaurantContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantDishes: {
    marginTop: 8,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  restaurantDishItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantDishImage: {
    width: 80,
    height: 80,
  },
  restaurantDishContent: {
    flex: 1,
    padding: 10,
  },
  restaurantDishName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  restaurantDishDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  restaurantDishTasteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dishItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImage: {
    width: 100,
    height: 100,
  },
  dishContent: {
    flex: 1,
    padding: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dishRestaurant: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  dishTasteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tasteBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tasteBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishesGrid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
});