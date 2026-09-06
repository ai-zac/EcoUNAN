import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeMode } from '../context/ThemeContext';
import { navigationRef } from './navigationRef';
import { theme } from '../theme/theme';

import { UserRewardsScreen } from '../screens/UserRewardsScreen';
import { RewardDetailScreen } from '../screens/RewardDetailScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RedemptionSuccessScreen } from '../screens/RedemptionSuccessScreen';
import { RecycleSuccessScreen } from '../screens/RecycleSuccessScreen';
import { RecycleScreen } from '../screens/RecycleScreen';
import { RecyclePendingScreen } from '../screens/RecyclePendingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PointsScreen } from '../screens/PointsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ConfirmRewardScreen } from '../screens/ConfirmRewardScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { AvailableRewardsScreen } from '../screens/AvailableRewardsScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminRewardsScreen } from '../screens/AdminRewardsScreen';
import { AdminRedemptionsScreen } from '../screens/AdminRedemptionsScreen';
import { AdminRecyclesScreen } from '../screens/AdminRecyclesScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  Perfil: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Points: undefined;
  Puntos: undefined;
  Recycle: undefined;
  Reciclar: undefined;
  RecyclePending: undefined;
  RecycleSuccess: { recycle?: any } | undefined;
  RedemptionSuccess: undefined;
  AvailableRewards: undefined;
  UserRewards: undefined;
  RewardDetail: { reward?: any } | undefined;
  ConfirmReward: { reward: any };
  AdminUsers: undefined;
  AdminRewards: undefined;
  AdminRedemptions: undefined;
  AdminRecycles: undefined;
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
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Perfil" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Points" component={PointsScreen} />
        <Stack.Screen name="Puntos" component={PointsScreen} />
        <Stack.Screen name="Recycle" component={RecycleScreen} />
        <Stack.Screen name="Reciclar" component={RecycleScreen} />
        <Stack.Screen name="RecyclePending" component={RecyclePendingScreen} />
        <Stack.Screen name="RecycleSuccess" component={RecycleSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="RedemptionSuccess" component={RedemptionSuccessScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AvailableRewards" component={AvailableRewardsScreen} />
        <Stack.Screen name="UserRewards" component={UserRewardsScreen} />
        <Stack.Screen name="RewardDetail" component={RewardDetailScreen} />
        <Stack.Screen name="ConfirmReward" component={ConfirmRewardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminRewards" component={AdminRewardsScreen} />
        <Stack.Screen name="AdminRedemptions" component={AdminRedemptionsScreen} />
        <Stack.Screen name="AdminRecycles" component={AdminRecyclesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

