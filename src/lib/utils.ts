import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, collection, query, where, getDocs } from './firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateUniqueVolckaId(): Promise<string> {
  let isUnique = false;
  let newId = '';

  // Fetch all users once to check for uniqueness locally
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  const existingIds = new Set(querySnapshot.docs.map((d: any) => d.data().volckaId));

  while (!isUnique) {
    // Generate a 10-digit number string
    newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    if (!existingIds.has(newId)) {
      isUnique = true;
    }
  }

  return newId;
}
