import { db, collection, addDoc } from './firebase';
import { Notification } from '../types';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  icon?: string
) => {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 3); // Default 3 days expiration

    await addDoc(collection(db, 'notifications'), {
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ...(icon ? { icon } : {})
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
