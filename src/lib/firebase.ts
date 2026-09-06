import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
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
import { User, Prompt, Category, CustomPromptRequest, MonthlyUsage } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
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

const OWNER_SUPERADMIN_EMAIL = 'usagiptiktok@gmail.com';

/**
 * Sign In with Google via Firebase Auth popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const isOwner = fbUser.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase();
    const userDocRef = doc(db, 'users', fbUser.uid);

    let existingData: User | null = null;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data() as User;
      }
    } catch (err) {
      // Non-blocking catch on initial read, will handle on write
    }

    if (existingData) {
      const updatedUser: User = {
        ...existingData,
        name: fbUser.displayName || existingData.name,
        photoURL: fbUser.photoURL || existingData.photoURL,
        role: isOwner ? 'superadmin' : existingData.role,
        plan: isOwner ? 'STUDIO' : existingData.plan,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      try {
        await setDoc(userDocRef, updatedUser, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
      }
      return updatedUser;
    } else {
      const newUser: User = {
        uid: fbUser.uid,
        name: fbUser.displayName || 'Prompt Vault Creator',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        role: isOwner ? 'superadmin' : 'user',
        plan: isOwner ? 'STUDIO' : 'FREE',
        subscriptionStatus: 'active',
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

