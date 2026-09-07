import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocFromServer 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Prompt, Category, CustomPromptRequest, MonthlyUsage, SubscriptionPlan } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Explicitly configure browserLocalPersistence to preserve auth state across restarts and page reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set browserLocalPersistence on Firebase Auth:', err);
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Operational Types for Audit & Error Monitoring
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on application boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const OWNER_SUPERADMIN_EMAIL = 'usagiptiktok@gmail.com';

/**
 * Get user profile directly from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore', err);
    return null;
  }
}

/**
 * Ensures an Anonymous Guest Account exists with Free plan
 */
export async function ensureAnonymousGuest(): Promise<User> {
  let fbUser = auth.currentUser;
  if (!fbUser) {
    const cred = await signInAnonymously(auth);
    fbUser = cred.user;
  }

  const userDocRef = doc(db, 'users', fbUser.uid);
  let existing: User | null = null;
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      existing = snap.data() as User;
    }
  } catch (e) {
    // ignore
  }

  if (existing) {
    return existing;
  }

  const guestUser: User = {
    uid: fbUser.uid,
    name: 'Guest Creator',
    email: '',
    photoURL: undefined,
    role: 'user',
    isSuperAdmin: false,
    isAnonymous: true,
    plan: 'FREE',
    subscriptionStatus: 'none',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };

  try {
    await setDoc(userDocRef, guestUser);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
  }

  return guestUser;
}

/**
 * Sign In with Google via Firebase Auth popup.
 * If user is currently an anonymous guest, links the account to preserve their favorites and vault data.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    let fbUser: FirebaseUser;
    const isAnonymous = auth.currentUser?.isAnonymous;

    if (isAnonymous && auth.currentUser) {
      try {
        const linkResult = await linkWithPopup(auth.currentUser, googleProvider);
        fbUser = linkResult.user;
      } catch (linkError: any) {
        // If the Google credential is already linked to another account, sign in to that account directly
        if (linkError.code === 'auth/credential-already-in-use') {
          const signInResult = await signInWithPopup(auth, googleProvider);
          fbUser = signInResult.user;
        } else {
          throw linkError;
        }
      }
    } else {
      const signInResult = await signInWithPopup(auth, googleProvider);
      fbUser = signInResult.user;
    }

    const isOwner = fbUser.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase();
    const userDocRef = doc(db, 'users', fbUser.uid);

    let existingData: User | null = null;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data() as User;
      }
    } catch (err) {
      // Non-blocking catch on initial read
    }

    if (existingData) {
      const updatedUser: User = {
        ...existingData,
        name: fbUser.displayName || existingData.name,
        email: fbUser.email || existingData.email,
        photoURL: fbUser.photoURL || existingData.photoURL,
        isAnonymous: false,
        role: isOwner ? 'superadmin' : existingData.role,
        isSuperAdmin: isOwner,
        // The $20 Studio plan is ONLY given to the owner or if already assigned by admin in Firestore!
        plan: isOwner ? 'STUDIO' : (existingData.plan || 'FREE'),
        subscriptionStatus: isOwner ? 'active' : (existingData.subscriptionStatus || 'none'),
        updatedAt: new Date().toISOString().split('T')[0]
      };
      try {
        await setDoc(userDocRef, updatedUser, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
      }
      return updatedUser;
    } else {
      // Brand new user: Always Free tier by default, never Studio/Pro unless owner
      const newUser: User = {
        uid: fbUser.uid,
        name: fbUser.displayName || 'Prompt Vault Creator',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        role: isOwner ? 'superadmin' : 'user',
        isSuperAdmin: isOwner,
        isAnonymous: false,
        plan: isOwner ? 'STUDIO' : 'FREE',
        subscriptionStatus: isOwner ? 'active' : 'none',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      try {
        await setDoc(userDocRef, newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
      }
      return newUser;
    }
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, name: string): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = cred.user;
    
    if (name) {
      await updateProfile(fbUser, { displayName: name }).catch(() => {});
    }

    const isOwner = fbUser.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase();
    const newUser: User = {
      uid: fbUser.uid,
      name: name || fbUser.email?.split('@')[0] || 'Creator',
      email: fbUser.email || email,
      role: isOwner ? 'superadmin' : 'user',
      isSuperAdmin: isOwner,
      isAnonymous: false,
      plan: isOwner ? 'STUDIO' : 'FREE',
      subscriptionStatus: isOwner ? 'active' : 'none',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      await setDoc(userDocRef, newUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
    }

    return newUser;
  } catch (err) {
    console.error('Email sign up error:', err);
    throw err;
  }
}

/**
 * Sign In with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = cred.user;
    const isOwner = fbUser.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase();

    const userDocRef = doc(db, 'users', fbUser.uid);
    let userData: User | null = null;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        userData = snap.data() as User;
      }
    } catch (e) {
      // ignore
    }

    if (userData) {
      if (isOwner && userData.role !== 'superadmin') {
        userData = { ...userData, role: 'superadmin', isSuperAdmin: true, plan: 'STUDIO' };
        await setDoc(userDocRef, userData, { merge: true }).catch(() => {});
      }
      return userData;
    }

    const defaultUser: User = {
      uid: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0] || 'Creator',
      email: fbUser.email || email,
      role: isOwner ? 'superadmin' : 'user',
      isSuperAdmin: isOwner,
      isAnonymous: false,
      plan: isOwner ? 'STUDIO' : 'FREE',
      subscriptionStatus: isOwner ? 'active' : 'none',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    await setDoc(userDocRef, defaultUser, { merge: true }).catch(() => {});
    return defaultUser;
  } catch (err) {
    console.error('Email login error:', err);
    throw err;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function logOutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Firebase Sign Out Error:', err);
  }
}

/**
 * Request a subscription upgrade in Firestore (e.g. STUDIO $20/month)
 */
export async function requestSubscriptionFirestore(userId: string, requestedPlan: SubscriptionPlan): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      subscriptionRequested: requestedPlan,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    const subDocRef = doc(db, 'subscriptions', `${userId}_${Date.now()}`);
    await setDoc(subDocRef, {
      userId,
      requestedPlan,
      status: 'pending',
      requestedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `subscriptions/${userId}`);
  }
}

/**
 * Admin action: Approve and assign subscription plan in Firestore
 */
export async function approveSubscriptionFirestore(userId: string, plan: SubscriptionPlan): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      plan,
      subscriptionStatus: 'active',
      subscriptionRequested: null,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    const subDocRef = doc(db, 'subscriptions', `${userId}_active`);
    await setDoc(subDocRef, {
      userId,
      plan,
      status: 'active',
      approvedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}

/**
 * Fetch or sync user profile in Firestore
 */
export async function syncUserProfile(user: User): Promise<User> {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, user, { merge: true });
    return user;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Save / unsave favorite prompt in Firestore
 */
export async function toggleFavoriteFirestore(userId: string, promptId: string): Promise<boolean> {
  const favDocId = `${userId}_${promptId}`;
  const favDocRef = doc(db, 'favorites', favDocId);
  try {
    const snap = await getDoc(favDocRef);
    if (snap.exists()) {
      await deleteDoc(favDocRef);
      return false;
    } else {
      await setDoc(favDocRef, {
        userId,
        promptId,
        savedAt: new Date().toISOString()
      });
      return true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `favorites/${favDocId}`);
  }
}

/**
 * Load favorites for a user from Firestore
 */
export async function getFavoritesFromFirestore(userId: string): Promise<string[]> {
  try {
    const q = query(collection(db, 'favorites'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data().promptId as string);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'favorites');
  }
}

/**
 * Submit custom prompt request to Firestore
 */
export async function createCustomRequestFirestore(request: Omit<CustomPromptRequest, 'id' | 'createdAt'>): Promise<CustomPromptRequest> {
  const reqId = `req-${Date.now()}`;
  const newReq: CustomPromptRequest = {
    ...request,
    id: reqId,
    createdAt: new Date().toISOString().split('T')[0]
  };
  try {
    await setDoc(doc(db, 'customPromptRequests', reqId), newReq);
    return newReq;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `customPromptRequests/${reqId}`);
  }
}

/**
 * Upload Master Prompt Thumbnail to Firebase Storage
 * Strictly restricted to authorized Admins.
 */
export async function uploadPromptThumbnail(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Image Type Validation
  const validMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'image/avif'
  ];
  if (!validMimeTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Allowed formats: PNG, JPG, WEBP, GIF, AVIF.');
  }

  // 2. File Size Validation (Max 10MB)
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size (${sizeInMb}MB) exceeds the maximum allowed 10MB limit.`);
  }

  // 3. Generate sanitized path in Firebase Storage
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `prompt_thumbnails/${cleanId}.${extension}`;
  const fileRef = storageRef(storage, filePath);

  try {
    return await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(Math.min(100, Math.round(percent)));
            }
          }
        },
        (error) => {
          console.error('Firebase Storage Upload Error:', error);
          reject(new Error(`Firebase Storage upload failed: ${error.message || 'Unknown error'}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err: any) {
            console.error('Failed to retrieve download URL:', err);
            reject(new Error(`Failed to retrieve uploaded image URL: ${err.message || 'Storage error'}`));
          }
        }
      );
    });
  } catch (err: any) {
    // If Firebase Storage encounters network/bucket errors, provide clear error message
    console.error('Upload Prompt Thumbnail execution failed:', err);
    throw err;
  }
}

/**
 * Save Master Prompt with its Thumbnail URL directly to Cloud Firestore
 */
export async function savePromptToFirestore(promptData: Partial<Prompt>): Promise<Prompt> {
  const promptId = promptData.id || `prompt-${Date.now()}`;
  const promptRef = doc(db, 'prompts', promptId);

  const formattedPrompt: Prompt = {
    id: promptId,
    title: promptData.title || 'Untitled Master Prompt',
    description: promptData.description || '',
    category: promptData.category || 'Cinematic',
    tags: Array.isArray(promptData.tags) 
      ? promptData.tags 
      : typeof promptData.tags === 'string'
        ? (promptData.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : ['AI Video'],
    thumbnail: promptData.thumbnail || '',
    previewMedia: promptData.previewMedia || promptData.thumbnail || '',
    fullPrompt: promptData.fullPrompt || '',
    exampleOutput: promptData.exampleOutput || '',
    recommendedUse: promptData.recommendedUse || 'Midjourney v6 / Runway Gen-3',
    creationDate: promptData.creationDate || new Date().toISOString().split('T')[0],
    updatedDate: new Date().toISOString().split('T')[0],
    featuredStatus: !!promptData.featuredStatus,
    accessLevel: promptData.accessLevel || 'FREE',
    customizableVariables: promptData.customizableVariables || [],
    copiesCount: promptData.copiesCount || 0,
    savesCount: promptData.savesCount || 0,
    isPublished: promptData.isPublished !== false
  };

  try {
    await setDoc(promptRef, formattedPrompt, { merge: true });
    return formattedPrompt;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `prompts/${promptId}`);
  }
}

/**
 * Delete Master Prompt from Cloud Firestore
 */
export async function deletePromptFromFirestore(promptId: string): Promise<void> {
  const promptRef = doc(db, 'prompts', promptId);
  try {
    await deleteDoc(promptRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `prompts/${promptId}`);
  }
}

