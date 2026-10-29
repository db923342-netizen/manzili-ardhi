import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import firebaseConfig from "@/../firebase-applet-config.json";

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connection verification as mandated by Firebase skill
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore running in offline cache mode or initial connection pending.");
    }
  }
}

if (typeof window !== "undefined") {
  testFirestoreConnection();
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      // Sync user profile to Firestore
      const userRef = doc(db, "users", cred.user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: cred.user.uid,
          email: cred.user.email || "",
          displayName: cred.user.displayName || "مستخدم جديد",
          photoURL: cred.user.photoURL || "",
          role: "user",
          createdAt: new Date().toISOString(),
        });
      }
    }
    return cred.user;
  } catch (err: unknown) {
    console.error("Firebase Google sign-in failed:", err);
    throw err;
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithFirebaseEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

/**
 * Register with Email and Password
 */
export async function registerWithFirebaseEmail(email: string, pass: string, name?: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (cred.user) {
    await setDoc(doc(db, "users", cred.user.uid), {
      id: cred.user.uid,
      email: cred.user.email || "",
      displayName: name || "مستخدم جديد",
      role: "user",
      createdAt: new Date().toISOString(),
    });
  }
  return cred.user;
}

/**
 * Log out
 */
export async function logoutFirebase() {
  await signOut(auth);
}

/**
 * Firestore Properties CRUD helpers
 */
export interface FirestoreProperty {
  id: string;
  title: string;
  type: string;
  price: number;
  wilaya: string;
  commune: string;
  area: number;
  rooms: number;
  description: string;
  images?: string;
  phone: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  updatedAt?: string;
}

export async function savePropertyToFirestore(data: Omit<FirestoreProperty, "id" | "createdAt">) {
  const newRef = doc(collection(db, "properties"));
  const newProperty: FirestoreProperty = {
    ...data,
    id: newRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newRef, newProperty);
  return newProperty;
}

export async function approvePropertyInFirestore(id: string) {
  const pRef = doc(db, "properties", id);
  await updateDoc(pRef, {
    status: "approved",
    updatedAt: new Date().toISOString(),
  });
}

export async function deletePropertyFromFirestore(id: string) {
  const pRef = doc(db, "properties", id);
  await deleteDoc(pRef);
}

export async function getPropertiesFromFirestore(max = 50): Promise<FirestoreProperty[]> {
  try {
    const q = query(collection(db, "properties"), orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirestoreProperty);
  } catch (err) {
    console.warn("Could not fetch properties from Firestore:", err);
    return [];
  }
}

/**
 * Temporary Rental Bookings Firestore Operations
 */
export interface FirestoreTemporaryBooking {
  id: string;
  rentalId: string;
  rentalTitle: string;
  wilaya: string;
  commune: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | undefined;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  nightlyPrice: number;
  totalPrice: number;
  serviceFee: number;
  grandTotal: number;
  status: "قيد التأكيد" | "مؤكد" | "مكتمل" | "ملغى";
  specialNotes?: string | undefined;
  userId?: string | undefined;
  createdAt: string;
}

export async function saveTemporaryBookingToFirestore(
  booking: Omit<FirestoreTemporaryBooking, "id" | "createdAt">,
): Promise<FirestoreTemporaryBooking> {
  const newRef = doc(collection(db, "temporary_bookings"));
  const newBooking: FirestoreTemporaryBooking = {
    ...booking,
    id: newRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newRef, newBooking);
  return newBooking;
}

export async function getTemporaryBookingsFromFirestore(
  max = 50,
): Promise<FirestoreTemporaryBooking[]> {
  try {
    const q = query(collection(db, "temporary_bookings"), orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirestoreTemporaryBooking);
  } catch (err) {
    console.warn("Could not fetch temporary bookings from Firestore:", err);
    return [];
  }
}

export async function updateTemporaryBookingStatusInFirestore(
  bookingId: string,
  status: FirestoreTemporaryBooking["status"],
) {
  const bRef = doc(db, "temporary_bookings", bookingId);
  await updateDoc(bRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTemporaryBookingFromFirestore(bookingId: string) {
  try {
    const bRef = doc(db, "temporary_bookings", bookingId);
    await deleteDoc(bRef);
  } catch (err) {
    console.warn("Could not delete temporary booking from Firestore:", err);
  }
}

export type { FirebaseUser };
