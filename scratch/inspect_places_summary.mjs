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

async function inspectPlaces() {
  const snap = await getDocs(collection(db, "places"));
  console.log(`Total Places: ${snap.docs.length}`);
  snap.docs.forEach((doc, idx) => {
    const d = doc.data();
    console.log(`[${idx+1}] ID: ${doc.id} | title.ka: ${d.title?.ka || d.title} | region: ${d.region} | hasImg: ${Boolean(d.img)} | isPopular: ${d.isPopular}`);
  });
}

inspectPlaces().catch(console.error);
