import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ForumPost, ForumComment, SavedQuestion, UserStats, AppData } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string) => {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

// Connection test as per instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data Persistence Service
export const dataService = {
  isOnline(): boolean {
    return typeof window !== 'undefined' ? window.navigator.onLine : true;
  },

  async saveAppData(data: AppData) {
    if (!auth.currentUser) return;
    if (!this.isOnline()) return; // Skip if offline, will sync later

    const path = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, path), {
        ...data,
        userId: auth.currentUser.uid,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      // If it's a network error, we ignore it here as local storage is primary
      console.warn('Silent sync failure (likely network):', error);
      if (error instanceof Error && !error.message.includes('offline')) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  },

  async loadAppData(): Promise<AppData | null> {
    if (!auth.currentUser) return null;
    const path = `users/${auth.currentUser.uid}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? snap.data() as AppData : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Helper to merge local and cloud data
  mergeData(local: AppData, cloud: AppData): AppData {
    return {
      stats: {
        ...cloud.stats,
        xp: Math.max(local.stats.xp || 0, cloud.stats.xp || 0),
        level: Math.max(local.stats.level || 1, cloud.stats.level || 1),
        streak: Math.max(local.stats.streak || 0, cloud.stats.streak || 0),
        totalQuestionsAttempted: Math.max(local.stats.totalQuestionsAttempted || 0, cloud.stats.totalQuestionsAttempted || 0),
        correctAnswers: Math.max(local.stats.correctAnswers || 0, cloud.stats.correctAnswers || 0),
        lastActiveDate: cloud.stats.lastActiveDate || local.stats.lastActiveDate,
        testHistory: [...(cloud.stats.testHistory || []), ...(local.stats.testHistory || [])]
          .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        performanceBySubject: { ...cloud.stats.performanceBySubject, ...local.stats.performanceBySubject }
      },
      bookmarks: Array.from(new Set([...(local.bookmarks || []), ...(cloud.bookmarks || [])].map(b => b.questionId))).map(id => {
        return (local.bookmarks || []).find(b => b.questionId === id) || (cloud.bookmarks || []).find(b => b.questionId === id)!;
      }),
      mistakes: Array.from(new Set([...(local.mistakes || []), ...(cloud.mistakes || [])].map(m => m.questionId))).map(id => {
        const l = (local.mistakes || []).find(m => m.questionId === id);
        const c = (cloud.mistakes || []).find(m => m.questionId === id);
        return l && c ? (new Date(l.lastAttempt) > new Date(c.lastAttempt) ? l : c) : (l || c!);
      }),
      syllabus: cloud.syllabus || local.syllabus
    };
  }
};

// Forum Service
export const forumService = {
  async createPost(title: string, content: string, category: string) {
    if (!auth.currentUser) throw new Error('Auth required');
    const path = 'posts';
    try {
      const docRef = await addDoc(collection(db, path), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Aspirant',
        title,
        content,
        category,
        upvotes: [],
        commentCount: 0,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getPosts(category?: string) {
    const path = 'posts';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (category && category !== 'All') {
        q = query(q, where('category', '==', category));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumPost));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async toggleUpvote(postId: string, isUpvoted: boolean) {
    if (!auth.currentUser) return;
    const path = `posts/${postId}`;
    try {
      await updateDoc(doc(db, path), {
        upvotes: isUpvoted ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};

// Saved Questions
export const libraryService = {
  async saveQuestion(subject: string, questionData: any) {
    if (!auth.currentUser) return;
    const path = 'saved_questions';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        subject,
        questionData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getSavedQuestions() {
    if (!auth.currentUser) return [];
    const path = 'saved_questions';
    try {
      const q = query(collection(db, path), where('userId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedQuestion));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};
