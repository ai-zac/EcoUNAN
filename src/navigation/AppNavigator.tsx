import React from 'react';
import { NavigationContainer, NavigatorScreenParams, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Recycle, Medal, Target, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useThemeMode } from '../context/ThemeContext';
import { navigationRef } from './navigationRef';

import { theme } from '../theme/theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecycleScreen } from '../screens/RecycleScreen';
import { RecyclePendingScreen } from '../screens/RecyclePendingScreen';
import { PointsScreen } from '../screens/PointsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';


import { RecycleSuccessScreen } from '../screens/RecycleSuccessScreen';
import { RedemptionSuccessScreen } from '../screens/RedemptionSuccessScreen';
import { LeaguePathScreen } from '../screens/LeaguePathScreen';
import { RewardDetailScreen } from '../screens/RewardDetailScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AvailableRewardsScreen } from '../screens/AvailableRewardsScreen';
import { UserRewardsScreen } from '../screens/UserRewardsScreen';
import { ConfirmRewardScreen } from '../screens/ConfirmRewardScreen';
import { RewardUnlockedScreen } from '../screens/RewardUnlockedScreen';
import { MyRewardsScreen } from '../screens/MyRewardsScreen';


import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminRewardsScreen } from '../screens/AdminRewardsScreen';
import { AdminEditRewardScreen } from '../screens/AdminEditRewardScreen';
import { AdminRecyclesScreen } from '../screens/AdminRecyclesScreen';
import { AdminCreateStaffScreen } from '../screens/AdminCreateStaffScreen';
import { AdminGoalsScreen } from '../screens/AdminGoalsScreen';
import { AdminRedemptionsScreen } from '../screens/AdminRedemptionsScreen';
import { AdminActivityLogScreen } from '../screens/AdminActivityLogScreen';


import { RankingScreen } from '../screens/RankingScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { HelpScreen } from '../screens/HelpScreen';


export type MainTabParamList = {
  Inicio: undefined;
  Reciclar: undefined;
  Puntos: undefined;
  Metas: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminRewards: undefined;
  AdminRecycles: undefined;
  AdminCreateStaff: undefined;
  AdminGoals: undefined;
  AdminRedemptions: undefined;
  AdminActivityLog: undefined;
  RecyclePending: undefined;
  RecycleSuccess: undefined;
  RedemptionSuccess: undefined;
  LeaguePath: undefined;
  RewardDetail: undefined;
  QRScanner: undefined;
  EditProfile: undefined;
  AvailableRewards: undefined;
  UserRewards: undefined;
  ConfirmReward: { reward: any };
  RewardUnlocked: { reward: any };
  MyRewards: undefined;
  Ranking: undefined;
  Notifications: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Help: undefined;
};


declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const [token, setToken] = React.useState<string | undefined>();
  const unreadCount = useUnreadCount();

  React.useEffect(() => {
    AsyncStorage.getItem('@auth_token').then(t => setToken(t || undefined));
  }, []);

  usePushNotifications(token);
  
  return (
    <Tab.Navigator id="MainTabs" screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color, focused }) => <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> }} 
      />
      <Tab.Screen 
        name="Reciclar" 
        component={RecycleScreen} 
        options={{ tabBarIcon: ({ color, focused }) => <Recycle size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> }} 
      />
      <Tab.Screen 
        name="Puntos" 
        component={PointsScreen} 
        options={{ tabBarIcon: ({ color, focused }) => <Medal size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> }} 
      />
      <Tab.Screen 
        name="Metas" 
        component={GoalsScreen} 
        options={{ tabBarIcon: ({ color, focused }) => <Target size={24} color={color} strokeWidth={focused ? 2.5 : 2} /> }} 
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />,
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isDark } = useThemeMode();
  
  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: theme.colors.accent,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
        },
      }
    : DefaultTheme;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}>
      <Stack.Navigator 
        id="RootStack"
        initialRouteName="Splash"
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right', 
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminRewards" component={AdminRewardsScreen} />
        <Stack.Screen name="AdminEditReward" component={AdminEditRewardScreen} />
        <Stack.Screen name="AdminRecycles" component={AdminRecyclesScreen} />
        <Stack.Screen name="AdminCreateStaff" component={AdminCreateStaffScreen} />
        <Stack.Screen name="AdminGoals" component={AdminGoalsScreen} />
        <Stack.Screen name="AdminRedemptions" component={AdminRedemptionsScreen} />
        <Stack.Screen name="AdminActivityLog" component={AdminActivityLogScreen} />
        
        {}
        <Stack.Screen name="Ranking" component={RankingScreen} />
        <Stack.Screen name="RecyclePending" component={RecyclePendingScreen} />
        <Stack.Screen name="RecycleSuccess" component={RecycleSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="RedemptionSuccess" component={RedemptionSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="LeaguePath" component={LeaguePathScreen} />
        <Stack.Screen name="RewardDetail" component={RewardDetailScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="AvailableRewards" component={AvailableRewardsScreen} />
        <Stack.Screen name="UserRewards" component={UserRewardsScreen} />
        <Stack.Screen name="ConfirmReward" component={ConfirmRewardScreen} />
        <Stack.Screen name="RewardUnlocked" component={RewardUnlockedScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MyRewards" component={MyRewardsScreen} />

        {}
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
