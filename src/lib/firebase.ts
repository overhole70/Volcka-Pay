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

const API_URL = import.meta.env.VITE_API_URL || '';

export const getDoc = async (docRef: any) => {
  const res = await fetch(`${API_URL}/api/firestore/${docRef.collection}/${docRef.id}`);
  if (res.status === 404) return { exists: () => false, data: () => null };
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch document');
  }
  return { exists: () => true, data: () => data };
};

export const getDocs = async (queryRef: any) => {
  const collName = queryRef.collection?.name || queryRef.name || queryRef.collName;
  const res = await fetch(`${API_URL}/api/firestore/${collName}`);
  let data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch documents');
  }

  // Apply client-side filtering if constraints exist
  if (queryRef.constraints) {
    for (const constraint of queryRef.constraints) {
      if (constraint.type === 'where') {
        data = data.filter((d: any) => {
          const val = d[constraint.field];
          if (constraint.op === '==') return val === constraint.value;
          if (constraint.op === '>') return val > constraint.value;
          if (constraint.op === '<') return val < constraint.value;
          if (constraint.op === '>=') return val >= constraint.value;
          if (constraint.op === '<=') return val <= constraint.value;
          if (constraint.op === '!=') return val !== constraint.value;
          return true;
        });
      } else if (constraint.type === 'orderBy') {
        data = data.sort((a: any, b: any) => {
          const valA = a[constraint.field];
          const valB = b[constraint.field];
          if (valA < valB) return constraint.dir === 'asc' ? -1 : 1;
          if (valA > valB) return constraint.dir === 'asc' ? 1 : -1;
          return 0;
        });
      } else if (constraint.type === 'limit') {
        data = data.slice(0, constraint.n);
      }
    }
  }

  return {
    empty: data.length === 0,
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    }))
  };
};

export const setDoc = async (docRef: any, data: any) => {
  await fetch(`${API_URL}/api/firestore/${docRef.collection}/${docRef.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const addDoc = async (collRef: any, data: any) => {
  const res = await fetch(`${API_URL}/api/firestore/${collRef.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateDoc = async (docRef: any, data: any) => {
  await fetch(`${API_URL}/api/firestore/${docRef.collection}/${docRef.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const query = (collRef: any, ...constraints: any[]) => {
  return { collName: collRef.name || collRef, constraints };
};

export const where = (field: string, op: string, value: any) => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, dir: string) => {
  return { type: 'orderBy', field, dir };
};

export const limit = (n: number) => {
  return { type: 'limit', n };
};

export const onSnapshot = (ref: any, callback: any, errorCallback?: any) => {
  // Mock onSnapshot with a single fetch for now
  if (ref.type === 'doc') {
    getDoc(ref).then(callback).catch(errorCallback || console.error);
  } else {
    getDocs(ref).then(callback).catch(errorCallback || console.error);
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
