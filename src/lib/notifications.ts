import { db, collection, addDoc } from './firebase';
import { Notification } from '../types';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type']
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
