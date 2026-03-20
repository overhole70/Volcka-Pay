export interface UserProfile {
  uid: string;
  volckaId: string;
  email: string;
  fullName?: string;
  balance: number;
  createdAt: string;
  role?: 'admin' | 'user';
  isBanned?: boolean;
  requiresOtpOnLogin?: boolean;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'transfer' | 'deposit' | 'withdrawal' | 'earning';
  description?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  binanceName: string;
  transferTime: string;
  orderId: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userVolckaId: string;
  userName: string;
  binanceId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AppSettings {
  binanceId: string;
  adminEmail: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'transfer' | 'deposit' | 'security' | 'admin' | 'system';
  read: boolean;
  created_at: string;
  icon?: string;
  expiresAt?: string;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  active: boolean;
}

export interface Earning {
  id: string;
  userId: string;
  amount: number;
  source: string;
  timestamp: string;
}
