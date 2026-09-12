import { db } from "../app/lib/firebase.js";
import { ALL_TOURS } from "../app/lib/toursData.js";
import { getDoc, doc } from "firebase/firestore";

console.log("Static tours:", ALL_TOURS.length);
getDoc(doc(db, "tours", "kazbegi-gergeti")).then(snap => {
  console.log("Firestore kazbegi-gergeti exists:", snap.exists());
  process.exit(0);
}).catch(err => {
  console.error("Firestore err:", err);
  process.exit(1);
});
