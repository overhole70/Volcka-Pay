// Proxy for Firestore operations that calls the backend
// This ensures no sensitive keys are in the frontend.

export const db = {
  type: 'proxy'
} as any;

export const collection = (db: any, name: string) => {
  return { type: 'collection', name };
};

export const doc = (dbOrColl: any, nameOrId?: string, id?: string) => {
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  if (dbOrColl.type === 'collection') {
    return { type: 'doc', collection: dbOrColl.name, id: nameOrId || generateId() };
  }
  return { type: 'doc', collection: nameOrId, id: id || generateId() };
};

export const getDoc = async (docRef: any) => {
  const res = await fetch(`/api/firestore/${docRef.collection}/${docRef.id}`);
  if (res.status === 404) return { exists: () => false, data: () => null };
  const data = await res.json();
  return { exists: () => true, data: () => data };
};

export const getDocs = async (queryRef: any) => {
  const collName = queryRef.collection?.name || queryRef.name;
  const res = await fetch(`/api/firestore/${collName}`);
  const data = await res.json();
  return {
    empty: data.length === 0,
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    }))
  };
};

export const setDoc = async (docRef: any, data: any) => {
  await fetch(`/api/firestore/${docRef.collection}/${docRef.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const addDoc = async (collRef: any, data: any) => {
  const res = await fetch(`/api/firestore/${collRef.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateDoc = async (docRef: any, data: any) => {
  await fetch(`/api/firestore/${docRef.collection}/${docRef.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const query = (collRef: any, ...constraints: any[]) => {
  return collRef; // Simplified for now
};

export const where = (field: string, op: string, value: any) => {
  return { field, op, value };
};

export const orderBy = (field: string, dir: string) => {
  return { field, dir };
};

export const limit = (n: number) => {
  return { limit: n };
};

export const onSnapshot = (ref: any, callback: any) => {
  // Mock onSnapshot with a single fetch for now
  if (ref.type === 'doc') {
    getDoc(ref).then(callback);
  } else {
    getDocs(ref).then(callback);
  }
  return () => {}; // Unsubscribe mock
};

export const runTransaction = async (db: any, updateFunction: any) => {
  // Mock transaction
  return await updateFunction({
    get: getDoc,
    set: setDoc,
    update: updateDoc,
    delete: async () => {}
  });
};

export const serverTimestamp = () => new Date().toISOString();

export const auth = {
  currentUser: null
} as any;
