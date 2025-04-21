export type TasteProfile = {
  sweet: number;
  salty: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
};

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tasteProfile: TasteProfile;
  category: string;
  reviews: Review[];
  averageRating: number;
  restaurantId: string;
};

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  image: string;
  coverImage: string;
  address: string;
  distance: string;
  deliveryTime: string;
  deliveryFee: number;
  rating: number;
  reviewCount: number;
  categories: string[];
  dishes: Dish[];
  isOpen: boolean;
  ownerId?: string;
};

export type CartItem = {
  dish: Dish;
  quantity: number;
  specialInstructions?: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: CartItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  date: string;
  deliveryAddress: string;
  deliveryFee: number;
  estimatedDeliveryTime: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  tasteProfile: TasteProfile;
  favoriteRestaurants: string[];
  favoriteDishes: string[];
  recentlyViewed: string[];
  addresses: Address[];
  orders: Order[];
  isBusinessOwner: boolean;
  ownedRestaurants?: string[];
  pendingRatings: PendingRating[];
  reviews?: Review[];
  friends?: Friend[];
};

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  tasteProfile: TasteProfile;
  similarityScore: number;
};

export type Address = {
  id: string;
  title: string;
  address: string;
  isDefault: boolean;
};

export type PendingRating = {
  id: string;
  orderId: string;
  dishId: string;
  dishName: string;
  dishImage: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
};