import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
  authDomain: "georgiatripsge.firebaseapp.com",
  projectId: "georgiatripsge",
  storageBucket: "georgiatripsge.firebasestorage.app",
  messagingSenderId: "458133209260",
  appId: "1:458133209260:web:884340052c037e6fcd9f09",
  measurementId: "G-KVGPVEVHQ0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectData() {
  const toursSnap = await getDocs(collection(db, "tours"));
  console.log("=== TOURS IN FIRESTORE ===");
  toursSnap.docs.forEach((doc) => {
    console.log(`\nID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  const placesSnap = await getDocs(collection(db, "places"));
  console.log("\n=== PLACES IN FIRESTORE (First 3) ===");
  placesSnap.docs.slice(0, 3).forEach((doc) => {
    console.log(`\nID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

inspectData().catch(console.error);
