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
        const isAdmin =
          cred.user.email === "db923342@gmail.com" ||
          cred.user.email?.toLowerCase().includes("admin");
        await setDoc(userRef, {
          id: cred.user.uid,
          email: cred.user.email || "",
          displayName: cred.user.displayName || "مستخدم جديد",
          photoURL: cred.user.photoURL || "",
          role: isAdmin ? "admin" : "user",
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
    const isAdmin =
      cred.user.email === "db923342@gmail.com" || cred.user.email?.toLowerCase().includes("admin");
    await setDoc(doc(db, "users", cred.user.uid), {
      id: cred.user.uid,
      email: cred.user.email || "",
      displayName: name || "مستخدم جديد",
      role: isAdmin ? "admin" : "user",
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
  purpose?: string;
  legalStatus?: string;
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

export async function savePropertyToFirestore(
  data: Partial<FirestoreProperty> & {
    title: string;
    type: string;
    wilaya: string;
    commune: string;
    price: number;
    phone: string;
  },
): Promise<FirestoreProperty> {
  const newRef = data.id ? doc(db, "properties", data.id) : doc(collection(db, "properties"));
  const now = new Date().toISOString();
  // SECURITY: Public property document NEVER stores the plain phone number
  const newProperty: FirestoreProperty = {
    id: newRef.id,
    title: data.title,
    type: data.type,
    purpose: data.purpose || "كراء",
    legalStatus: data.legalStatus || "",
    price: data.price,
    wilaya: data.wilaya,
    commune: data.commune,
    area: data.area ?? 0,
    rooms: data.rooms ?? 0,
    description: data.description ?? "",
    ...(data.images !== undefined ? { images: data.images } : {}),
    phone: "", // Redacted from public document
    userId: data.userId || "user",
    userName: data.userName || "صاحب العقار",
    userEmail: data.userEmail || "",
    status: data.status || "approved",
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  await setDoc(newRef, newProperty);

  // Store contact phone in isolated private collection protected by strict Firestore rules
  if (data.phone) {
    try {
      await setDoc(doc(db, "properties_private", newRef.id), {
        id: newRef.id,
        phone: data.phone,
        userId: data.userId || "user",
        createdAt: now,
      });
    } catch (privErr) {
      console.warn("Could not write private phone record:", privErr);
    }
  }

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
  try {
    const pRef = doc(db, "properties", id);
    await deleteDoc(pRef);
  } catch (err) {
    console.warn("Could not delete property from Firestore:", err);
  }
}

export async function getPropertiesFromFirestore(max = 100): Promise<FirestoreProperty[]> {
  try {
    const q = query(collection(db, "properties"), limit(max));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => {
      const item = d.data() as FirestoreProperty;
      return {
        ...item,
        phone: "", // Redact from public read
      };
    });
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  } catch (err) {
    console.warn("Could not fetch properties from Firestore:", err);
    return [];
  }
}

/**
 * Rental Requests Firestore Operations
 */
export type FirestoreRentalRequest = {
  id: string;
  title: string;
  type: string;
  purpose?: string;
  wilaya: string;
  commune: string;
  budget: number;
  rooms: number;
  duration?: string;
  details: string;
  author: string;
  contactPhone: string;
  date: string;
  createdAt: string;
  status: "approved" | "pending";
};

export async function saveRentalRequestToFirestore(
  data: Partial<FirestoreRentalRequest> & {
    title: string;
    type: string;
    wilaya: string;
    commune: string;
    budget: number;
    contactPhone: string;
  },
): Promise<FirestoreRentalRequest> {
  const newRef = data.id
    ? doc(db, "rental_requests", data.id)
    : doc(collection(db, "rental_requests"));
  const now = new Date().toISOString();
  // SECURITY: Public request document NEVER exposes the plain phone number
  const newRequest: FirestoreRentalRequest = {
    id: newRef.id,
    title: data.title,
    type: data.type,
    purpose: data.purpose || "كراء",
    wilaya: data.wilaya,
    commune: data.commune,
    budget: data.budget,
    rooms: data.rooms ?? 0,
    duration: data.duration ?? "سنة",
    details: data.details ?? "",
    author: data.author || "صاحب الطلب",
    contactPhone: "", // Redacted from public document
    date: data.date || now.slice(0, 10),
    createdAt: data.createdAt || now,
    status: data.status || "approved",
  };
  await setDoc(newRef, newRequest);

  // Store contact phone in isolated private collection
  if (data.contactPhone) {
    try {
      await setDoc(doc(db, "rental_requests_private", newRef.id), {
        id: newRef.id,
        contactPhone: data.contactPhone,
        userId: data.author || "user",
        createdAt: now,
      });
    } catch (privErr) {
      console.warn("Could not write private rental request phone record:", privErr);
    }
  }

  return newRequest;
}

export async function getRentalRequestsFromFirestore(max = 100): Promise<FirestoreRentalRequest[]> {
  try {
    const q = query(collection(db, "rental_requests"), limit(max));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => {
      const item = d.data() as FirestoreRentalRequest;
      return {
        ...item,
        contactPhone: "", // Enforce redaction
      };
    });
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  } catch (err) {
    console.warn("Could not fetch rental requests from Firestore:", err);
    return [];
  }
}

export async function deleteRentalRequestFromFirestore(id: string) {
  try {
    const rRef = doc(db, "rental_requests", id);
    await deleteDoc(rRef);
  } catch (err) {
    console.warn("Could not delete rental request from Firestore:", err);
  }
}

import type { TemporaryBooking } from "./data";

/**
 * Temporary Rental Bookings Firestore Operations
 */
export type FirestoreTemporaryBooking = TemporaryBooking & {
  userId?: string;
};

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

import type { TemporaryRental } from "./data";

export async function saveTemporaryRentalToFirestore(
  rental: Omit<TemporaryRental, "id"> & { id?: string },
): Promise<TemporaryRental> {
  const newRef = rental.id
    ? doc(db, "temporary_rentals", rental.id)
    : doc(collection(db, "temporary_rentals"));
  const item: TemporaryRental = {
    ...rental,
    id: newRef.id,
  };
  await setDoc(newRef, item);
  return item;
}

export async function getTemporaryRentalsFromFirestore(max = 50): Promise<TemporaryRental[]> {
  try {
    const q = query(collection(db, "temporary_rentals"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TemporaryRental);
  } catch (err) {
    console.warn("Could not fetch temporary rentals from Firestore:", err);
    return [];
  }
}

export async function deleteTemporaryRentalFromFirestore(rentalId: string) {
  try {
    const rRef = doc(db, "temporary_rentals", rentalId);
    await deleteDoc(rRef);
  } catch (err) {
    console.warn("Could not delete temporary rental from Firestore:", err);
  }
}

export interface FirestoreUserRecord {
  id: string;
  email?: string;
  displayName?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  wilaya?: string;
  photoURL?: string;
}

export async function getUsersFromFirestore(): Promise<FirestoreUserRecord[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: (data["email"] as string) || "",
        displayName: (data["displayName"] as string) || (data["name"] as string) || "مستخدم مسجل",
        phone: (data["phone"] as string) || "",
        role: (data["role"] as string) || "user",
        createdAt: (data["createdAt"] as string) || "",
        wilaya: (data["wilaya"] as string) || "الجزائر",
        photoURL: (data["photoURL"] as string) || "",
      };
    });
  } catch (err) {
    console.warn("Could not fetch users from Firestore:", err);
    return [];
  }
}

export async function deleteUserFromFirestore(userId: string) {
  try {
    const uRef = doc(db, "users", userId);
    await deleteDoc(uRef);
  } catch (err) {
    console.warn("Could not delete user from Firestore:", err);
  }
}

/**
 * Temporary Rental Requests Firestore Operations
 */
export type FirestoreTemporaryRequest = {
  id: string;
  title: string;
  type: string;
  wilaya: string;
  commune: string;
  checkInDate: string;
  durationDays: number;
  guestsCount: number;
  budgetPerNight: number;
  author: string;
  contactPhone: string;
  details: string;
  createdAt: string;
  status: string;
};

export async function saveTemporaryRequestToFirestore(
  data: Partial<FirestoreTemporaryRequest> & {
    title: string;
    wilaya: string;
    commune: string;
    budgetPerNight: number;
    contactPhone: string;
  },
): Promise<FirestoreTemporaryRequest> {
  const newRef = data.id
    ? doc(db, "temporary_requests", data.id)
    : doc(collection(db, "temporary_requests"));
  const now = new Date().toISOString();
  const item: FirestoreTemporaryRequest = {
    id: newRef.id,
    title: data.title,
    type: data.type || "شقة",
    wilaya: data.wilaya,
    commune: data.commune,
    checkInDate: data.checkInDate || now.slice(0, 10),
    durationDays: data.durationDays || 1,
    guestsCount: data.guestsCount || 2,
    budgetPerNight: data.budgetPerNight,
    author: data.author || "زائر مسجل",
    contactPhone: data.contactPhone,
    details: data.details || "",
    createdAt: data.createdAt || now,
    status: data.status || "منشور",
  };
  await setDoc(newRef, item);
  return item;
}

export async function getTemporaryRequestsFromFirestore(
  max = 100,
): Promise<FirestoreTemporaryRequest[]> {
  try {
    const q = query(collection(db, "temporary_requests"), limit(max));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as FirestoreTemporaryRequest);
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  } catch (err) {
    console.warn("Could not fetch temporary requests from Firestore:", err);
    return [];
  }
}

export async function deleteTemporaryRequestFromFirestore(id: string) {
  try {
    const rRef = doc(db, "temporary_requests", id);
    await deleteDoc(rRef);
  } catch (err) {
    console.warn("Could not delete temporary request from Firestore:", err);
  }
}

export type { FirebaseUser };
