import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reward } from '../../types';

const TARGET_REWARD_ID_KEY = '@ecounan_target_reward_id';
const TARGET_REWARD_DATA_KEY = '@ecounan_target_reward_data';

export interface PinnedRewardInfo {
  _id: string;
  title: string;
  pointsCost: number;
  description?: string;
  iconName?: string;
  iconColor?: string;
  iconBg?: string;
}

export const targetRewardService = {

  getTargetRewardId: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TARGET_REWARD_ID_KEY);
    } catch (e) {
      console.error('[TargetRewardService] Error al leer targetRewardId:', e);
      return null;
    }
  },

  getTargetReward: async (): Promise<PinnedRewardInfo | null> => {
    try {
      const data = await AsyncStorage.getItem(TARGET_REWARD_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[TargetRewardService] Error al leer targetReward:', e);
      return null;
    }
  },

  setTargetReward: async (reward: Reward | PinnedRewardInfo): Promise<void> => {
    try {
      await AsyncStorage.setItem(TARGET_REWARD_ID_KEY, reward._id);
      const info: PinnedRewardInfo = {
        _id: reward._id,
        title: reward.title,
        pointsCost: reward.pointsCost,
        description: reward.description,
        iconName: reward.iconName,
        iconColor: reward.iconColor,
        iconBg: reward.iconBg,
      };
      await AsyncStorage.setItem(TARGET_REWARD_DATA_KEY, JSON.stringify(info));
    } catch (e) {
      console.error('[TargetRewardService] Error al guardar targetReward:', e);
      throw e;
    }
  },

  clearTargetReward: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TARGET_REWARD_ID_KEY);
      await AsyncStorage.removeItem(TARGET_REWARD_DATA_KEY);
    } catch (e) {
      console.error('[TargetRewardService] Error al limpiar targetReward:', e);
    }
  },

  checkAndClearIfRedeemed: async (myRedemptions: any[]): Promise<boolean> => {
    try {
      const currentPinnedId = await AsyncStorage.getItem(TARGET_REWARD_ID_KEY);
      if (!currentPinnedId) return false;

      const wasRedeemed = (myRedemptions || []).some(
        (r: any) =>
          String(r.reward?._id || r.reward || r.rewardId) === String(currentPinnedId)
      );

      if (wasRedeemed) {
        await AsyncStorage.removeItem(TARGET_REWARD_ID_KEY);
        await AsyncStorage.removeItem(TARGET_REWARD_DATA_KEY);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[TargetRewardService] Error en checkAndClearIfRedeemed:', e);
      return false;
    }
  },
};
