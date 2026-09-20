import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeMode } from '../context/ThemeContext';
import { navigationRef } from './navigationRef';
import { theme } from '../theme/theme';

import { UserRewardsScreen } from '../screens/UserRewardsScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { RewardUnlockedScreen } from '../screens/RewardUnlockedScreen';
import { RewardDetailScreen } from '../screens/RewardDetailScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RedemptionSuccessScreen } from '../screens/RedemptionSuccessScreen';
import { RecycleSuccessScreen } from '../screens/RecycleSuccessScreen';
import { RecycleScreen } from '../screens/RecycleScreen';
import { RecyclePendingScreen } from '../screens/RecyclePendingScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PointsScreen } from '../screens/PointsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MyRewardsScreen } from '../screens/MyRewardsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { LeaguePathScreen } from '../screens/LeaguePathScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ConfirmRewardScreen } from '../screens/ConfirmRewardScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { AvailableRewardsScreen } from '../screens/AvailableRewardsScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminRewardsScreen } from '../screens/AdminRewardsScreen';
import { AdminRedemptionsScreen } from '../screens/AdminRedemptionsScreen';
import { AdminRecyclesScreen } from '../screens/AdminRecyclesScreen';
import { AdminGoalsScreen } from '../screens/AdminGoalsScreen';
import { AdminEditRewardScreen } from '../screens/AdminEditRewardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminCreateStaffScreen } from '../screens/AdminCreateStaffScreen';
import { AdminActivityLogScreen } from '../screens/AdminActivityLogScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Inicio: undefined;
  Profile: undefined;
  Perfil: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Points: undefined;
  Puntos: undefined;
  Goals: undefined;
  Metas: undefined;
  Recycle: undefined;
  Reciclar: undefined;
  RecyclePending: undefined;
  RecycleSuccess: { recycle?: any } | undefined;
  RedemptionSuccess: undefined;
  AvailableRewards: undefined;
  UserRewards: undefined;
  MyRewards: undefined;
  RewardDetail: { reward?: any } | undefined;
  ConfirmReward: { reward: any };
  RewardUnlocked: { reward: any };
  Ranking: undefined;
  LeaguePath: undefined;
  Help: undefined;
  QRScanner: undefined;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminRewards: undefined;
  AdminEditReward: { reward?: any } | undefined;
  AdminRecycles: undefined;
  AdminCreateStaff: undefined;
  AdminGoals: undefined;
  AdminRedemptions: undefined;
  AdminActivityLog: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    <NavigationContainer ref={navigationRef} theme={navTheme}>
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Inicio" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Perfil" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Points" component={PointsScreen} />
        <Stack.Screen name="Puntos" component={PointsScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Metas" component={GoalsScreen} />
        <Stack.Screen name="Recycle" component={RecycleScreen} />
        <Stack.Screen name="Reciclar" component={RecycleScreen} />
        <Stack.Screen name="RecyclePending" component={RecyclePendingScreen} />
        <Stack.Screen name="RecycleSuccess" component={RecycleSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="RedemptionSuccess" component={RedemptionSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AvailableRewards" component={AvailableRewardsScreen} />
        <Stack.Screen name="UserRewards" component={UserRewardsScreen} />
        <Stack.Screen name="MyRewards" component={MyRewardsScreen} />
        <Stack.Screen name="RewardDetail" component={RewardDetailScreen} />
        <Stack.Screen name="ConfirmReward" component={ConfirmRewardScreen} />
        <Stack.Screen name="RewardUnlocked" component={RewardUnlockedScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Ranking" component={RankingScreen} />
        <Stack.Screen name="LeaguePath" component={LeaguePathScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminRewards" component={AdminRewardsScreen} />
        <Stack.Screen name="AdminEditReward" component={AdminEditRewardScreen} />
        <Stack.Screen name="AdminRecycles" component={AdminRecyclesScreen} />
        <Stack.Screen name="AdminCreateStaff" component={AdminCreateStaffScreen} />
        <Stack.Screen name="AdminGoals" component={AdminGoalsScreen} />
        <Stack.Screen name="AdminRedemptions" component={AdminRedemptionsScreen} />
        <Stack.Screen name="AdminActivityLog" component={AdminActivityLogScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
