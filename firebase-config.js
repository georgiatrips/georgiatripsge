// Firebase Configuration Module
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
  authDomain: "georgiatripsge.firebaseapp.com",
  projectId: "georgiatripsge",
  storageBucket: "georgiatripsge.firebasestorage.app",
  messagingSenderId: "458133209260",
  appId: "1:458133209260:web:884340052c037e6fcd9f09",
  measurementId: "G-KVGPVEVHQ0"
};

// Initialize Firebase (reuse existing default app if already initialized)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Firestore (compat-safe for v10.8.0). Enable persistence when available.
const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// ImgBB API Key
const IMGBB_API_KEY = 'a5e4f8277be98927eb525c65da0615bf';

// Admin emails - add your admin email here
const ADMIN_EMAILS = ['georgiatrips5@gmail.com'];

// Check if user is admin
export async function isAdmin(email) {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  
  // Developer/Owner hardcoded fallback
  const ADMIN_EMAILS = ['georgiatrips5@gmail.com'];
  if (ADMIN_EMAILS.includes(lowerEmail)) {
    console.log('[Firebase Config] isAdmin check (hardcoded):', lowerEmail, '→ true');
    return true;
  }
  
  try {
    const docRef = doc(db, 'users', lowerEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const isUserAdmin = !!docSnap.data().isAdmin;
      console.log('[Firebase Config] isAdmin check (Firestore):', lowerEmail, '→', isUserAdmin);
      return isUserAdmin;
    }
  } catch (error) {
    console.error('[Firebase Config] Error checking isAdmin in Firestore:', error);
  }
  console.log('[Firebase Config] isAdmin check:', lowerEmail, '→ false');
  return false;
}

// Upload image to ImgBB
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);
  
  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Image upload failed');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// ============ TOURS CRUD ============

// Get all tours
export async function getTours() {
  try {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tours:', error);
    throw error;
  }
}

// Add a tour
export async function addTour(tourData) {
  try {
    const toursRef = collection(db, 'tours');
    const docRef = await addDoc(toursRef, {
      ...tourData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding tour:', error);
    throw error;
  }
}

// Update a tour
export async function updateTour(id, tourData) {
  try {
    const tourRef = doc(db, 'tours', id);
    await updateDoc(tourRef, {
      ...tourData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    throw error;
  }
}

// Delete a tour
export async function deleteTour(id) {
  try {
    const tourRef = doc(db, 'tours', id);
    await deleteDoc(tourRef);
  } catch (error) {
    console.error('Error deleting tour:', error);
    throw error;
  }
}

// ============ CARS CRUD ============

// Get all cars
export async function getCars() {
  try {
    const carsRef = collection(db, 'cars');
    const q = query(carsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting cars:', error);
    throw error;
  }
}

// Add a car
export async function addCar(carData) {
  try {
    const carsRef = collection(db, 'cars');
    const docRef = await addDoc(carsRef, {
      ...carData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding car:', error);
    throw error;
  }
}

// Update a car
export async function updateCar(id, carData) {
  try {
    const carRef = doc(db, 'cars', id);
    await updateDoc(carRef, {
      ...carData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating car:', error);
    throw error;
  }
}

// Delete a car
export async function deleteCar(id) {
  try {
    const carRef = doc(db, 'cars', id);
    await deleteDoc(carRef);
  } catch (error) {
    console.error('Error deleting car:', error);
    throw error;
  }
}

// ============ POSTS CRUD ============

// Get all posts
export async function getPosts() {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
}

// Add a post
export async function addPost(postData) {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
}

// Update a post
export async function updatePost(id, postData) {
  try {
    const postRef = doc(db, 'posts', id);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// Delete a post
export async function deletePost(id) {
  try {
    const postRef = doc(db, 'posts', id);
    await deleteDoc(postRef);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// ============ FEATURED TOURS CRUD ============

// Get all featured tours
export async function getFeaturedTours() {
  try {
    const featuredRef = collection(db, 'featuredTours');
    const q = query(featuredRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting featured tours:', error);
    throw error;
  }
}

// Add a featured tour
export async function addFeaturedTour(featuredData) {
  try {
    const featuredRef = collection(db, 'featuredTours');
    const docRef = await addDoc(featuredRef, {
      ...featuredData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding featured tour:', error);
    throw error;
  }
}

// Update a featured tour
export async function updateFeaturedTour(id, featuredData) {
  try {
    const featuredRef = doc(db, 'featuredTours', id);
    await updateDoc(featuredRef, {
      ...featuredData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating featured tour:', error);
    throw error;
  }
}

// Delete a featured tour
export async function deleteFeaturedTour(id) {
  try {
    const featuredRef = doc(db, 'featuredTours', id);
    await deleteDoc(featuredRef);
  } catch (error) {
    console.error('Error deleting featured tour:', error);
    throw error;
  }
}

// ============ REVIEWS CRUD ============

// Get all reviews
export async function getReviews() {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
}

// Add a review
export async function addReview(reviewData) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}

// Update a review
export async function updateReview(id, reviewData) {
  try {
    const reviewRef = doc(db, 'reviews', id);
    await updateDoc(reviewRef, {
      ...reviewData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(id) {
  try {
    const reviewRef = doc(db, 'reviews', id);
    await deleteDoc(reviewRef);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

// ============ LEADS / INBOX ============

export async function addTourBooking(bookingData) {
  try {
    const ref = collection(db, 'tourBookings');
    const docRef = await addDoc(ref, {
      ...bookingData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding tour booking:', error);
    throw error;
  }
}

export async function getTourBookings() {
  try {
    const ref = collection(db, 'tourBookings');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    if (error && error.code === 'permission-denied') {
      console.warn('No read permission for tourBookings collection.');
      return [];
    }
    console.error('Error getting tour bookings:', error);
    throw error;
  }
}

export async function addCarBooking(bookingData) {
  try {
    const ref = collection(db, 'carBookings');
    const docRef = await addDoc(ref, {
      ...bookingData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding car booking:', error);
    throw error;
  }
}

export async function getCarBookings() {
  try {
    const ref = collection(db, 'carBookings');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    if (error && error.code === 'permission-denied') {
      console.warn('No read permission for carBookings collection.');
      return [];
    }
    console.error('Error getting car bookings:', error);
    throw error;
  }
}

export async function addSubscriber(subscriberData) {
  try {
    const ref = collection(db, 'subscribers');
    const docRef = await addDoc(ref, {
      ...subscriberData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding subscriber:', error);
    throw error;
  }
}

export async function getSubscribers() {
  try {
    const ref = collection(db, 'subscribers');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    if (error && error.code === 'permission-denied') {
      console.warn('No read permission for subscribers collection.');
      return [];
    }
    console.error('Error getting subscribers:', error);
    throw error;
  }
}

export async function addContactMessage(messageData) {
  try {
    const ref = collection(db, 'contactMessages');
    const docRef = await addDoc(ref, {
      ...messageData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contact message:', error);
    throw error;
  }
}

export async function getContactMessages() {
  try {
    const ref = collection(db, 'contactMessages');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    if (error && error.code === 'permission-denied') {
      console.warn('No read permission for contactMessages collection.');
      return [];
    }
    console.error('Error getting contact messages:', error);
    throw error;
  }
}

// ============ TRAFFIC LOGS / ANALYTICS ============

export async function getTrafficLogs() {
  try {
    const ref = collection(db, 'traffic_logs');
    // Fetch last 150 logs to prevent heavy reads and slow loading
    const q = query(ref, orderBy('createdAt', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch (error) {
    if (error && error.code === 'permission-denied') {
      console.warn('No read permission for traffic_logs collection.');
      return [];
    }
    console.error('Error getting traffic logs:', error);
    throw error;
  }
}

// Export app, db, auth, onAuthStateChanged, and other items
export { app, db, auth, onAuthStateChanged };

// Helper to get current user for debugging
export async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
