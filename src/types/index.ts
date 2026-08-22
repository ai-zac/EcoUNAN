export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  ecoPoints: number;
  profilePicture?: string;
}

export interface RecycleItem {
  materialType: string;
  weight: number;
  pointsEarned: number;
}

export interface RecycleRecord {
  _id: string;
  user: string;
  items: RecycleItem[];
  totalWeight: number;
  totalPoints: number;
  status: string;
  createdAt: string;
}

export interface Reward {
  _id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  iconName?: string;
  iconColor?: string;
  iconBg?: string;
  isActive: boolean;
}

export interface Goal {
  _id: string;
  title: string;
  description: string;
  targetRecycles: number;
  rewardPoints: number;
  endDate: string;
  isActive: boolean;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Redemption {
  _id: string;
  user: string;
  reward: Reward | string;
  pointsSpent: number;
  status: string;
  qrCodeData: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
}
