import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, collection, query, where, getDocs } from './firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateUniqueVolckaId(): Promise<string> {
  let isUnique = false;
  let newId = '';

  while (!isUnique) {
    // Generate a 10-digit number string
    newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Check if it exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('volckaId', '==', newId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      isUnique = true;
    }
  }

  return newId;
}
