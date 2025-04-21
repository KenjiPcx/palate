import React from 'react';
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
import { useUserStore } from '@/store/userStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import { DishCard } from '@/components/DishCard';
import { SectionHeader } from '@/components/SectionHeader';
import { CartButton } from '@/components/CartButton';
import { ModeToggle } from '@/components/ModeToggle';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const { isBusinessMode } = useUserStore();
  const { getDishById } = useRestaurantStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  const favoriteDishes = user?.favoriteDishes.map(id => getDishById(id)).filter(Boolean) || [];
  
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
          onPress: () => {
            // Implement logout
          },
        },
      ]
    );
  };

  const handleAddRestaurant = () => {
    router.push('/business/add-restaurant');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: user?.avatar }} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {}}
            >
              <Edit2 size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.orders.length || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.favoriteRestaurants.length || 0}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.reviews?.length || 0}</Text>
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
            {isBusinessMode 
              ? 'Business mode allows you to manage your restaurants and menus' 
              : 'Consumer mode allows you to browse and order food'}
          </Text>
          
          {isBusinessMode && (
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
              tasteProfile={user?.tasteProfile || {
                sweet: 0.5,
                salty: 0.5,
                sour: 0.5,
                bitter: 0.5,
                umami: 0.5,
                spicy: 0.5,
              }} 
              showValues
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <SectionHeader 
            title="Favorite Dishes" 
            onSeeAll={() => {}}
          />
          {favoriteDishes.length > 0 ? (
            <FlatList
              data={favoriteDishes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.dishCardContainer}>
                  <DishCard dish={item} />
                </View>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
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
      
      <CartButton />
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
    paddingRight: 16,
  },
  dishCardContainer: {
    width: 200,
    marginRight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: colors.textLight,
  },
  spacer: {
    height: 80,
  },
});