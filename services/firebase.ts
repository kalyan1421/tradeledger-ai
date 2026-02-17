import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { ExtractedData } from '../types';

// Safe access to process.env
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY") || "YOUR_API_KEY_HERE",
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || "YOUR_PROJECT.firebaseapp.com",
  projectId: getEnv("FIREBASE_PROJECT_ID") || "YOUR_PROJECT_ID",
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || "YOUR_PROJECT.appspot.com",
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || "YOUR_MESSAGING_SENDER_ID",
  appId: getEnv("FIREBASE_APP_ID") || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// -- Authentication --

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// -- Data Operations --

export const saveContractNoteData = async (userId: string, data: ExtractedData, fileName: string) => {
  try {
    const batch = writeBatch(firestore);
    
    // 1. Create a Contract Note Summary Record
    const summaryRef = doc(collection(firestore, 'users', userId, 'contract_notes'));
    
    batch.set(summaryRef, {
      fileName,
      uploadDate: Timestamp.now(),
      gross_pnl: data.summary?.gross_pnl || 0,
      net_pnl: data.summary?.net_pnl || 0,
      total_charges: data.charges?.total_charges || 0,
      trade_count: data.trades?.length || 0,
      processed: true
    });

    // 2. Save Individual Trades
    if (data.trades && data.trades.length > 0) {
      data.trades.forEach((trade) => {
        const tradeRef = doc(collection(firestore, 'users', userId, 'trades'));
        batch.set(tradeRef, {
          ...trade,
          contract_note_id: summaryRef.id,
          date: Timestamp.now(), 
        });
      });
    }

    // 3. Save Charges Breakdown if charges exist
    if (data.charges) {
      const chargesRef = doc(collection(firestore, 'users', userId, 'charges'));
      batch.set(chargesRef, {
        ...data.charges,
        contract_note_id: summaryRef.id,
        date: Timestamp.now()
      });
    }

    await batch.commit();
    return summaryRef.id;
  } catch (error) {
    console.error("Error saving contract note data:", error);
    throw error;
  }
};

export const subscribeToTrades = (userId: string, callback: (trades: any[]) => void) => {
  const q = query(
    collection(firestore, "users", userId, "trades"),
    orderBy("date", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const trades = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(trades);
  });
};

export const subscribeToSummaries = (userId: string, callback: (notes: any[]) => void) => {
  const q = query(
    collection(firestore, "users", userId, "contract_notes"),
    orderBy("uploadDate", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(notes);
  });
};

export const uploadPDF = async (userId: string, file: File) => {
  const storageRef = ref(storage, `users/${userId}/contract-notes/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};