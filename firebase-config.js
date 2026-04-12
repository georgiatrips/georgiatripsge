// Firebase Configuration Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ImgBB API Key
const IMGBB_API_KEY = 'a5e4f8277be98927eb525c65da0615bf';

// Admin emails - add your admin email here
const ADMIN_EMAILS = ['georgiatrips5@gmail.com'];

// Check if user is admin
export function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
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
    return [];
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
    return [];
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
    return [];
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
    return [];
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

// Export auth and db for use in other modules
export { db, auth, onAuthStateChanged };
