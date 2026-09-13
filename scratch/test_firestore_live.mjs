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

async function checkCollections() {
  const collections = ["tours", "places", "hotels", "posts", "reviews", "settings", "coupons"];
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\n=== Collection: ${colName} (Count: ${snap.docs.length}) ===`);
      snap.docs.slice(0, 3).forEach((d) => {
        console.log(`- Doc ID: ${d.id}`, JSON.stringify(d.data()).slice(0, 150));
      });
    } catch (err) {
      console.error(`Error querying ${colName}:`, err.message);
    }
  }
}

checkCollections().catch(console.error);
