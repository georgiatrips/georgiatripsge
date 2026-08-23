import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const postsCollection = collection(db, "posts");

const asText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return value.ka || value.en || value.ru || Object.values(value).find((item) => typeof item === "string") || fallback;
  }
  return fallback;
};

const normalizeComment = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    author: asText(data.authorName, "მომხმარებელი"),
    avatar: data.authorPhoto || "",
    text: asText(data.text),
    createdAt: data.createdAt?.toDate?.()?.toLocaleDateString("ka-GE") || "ახლახან",
  };
};

export async function listPosts(userId = "", maxPosts = 0) {
  const constraints = [orderBy("createdAt", "desc")];
  if (Number.isInteger(maxPosts) && maxPosts > 0) constraints.push(limit(maxPosts));
  const snapshot = await getDocs(query(postsCollection, ...constraints));

  return Promise.all(snapshot.docs.map(async (postDoc) => {
    const data = postDoc.data();
    const likesSnapshot = await getDocs(collection(postDoc.ref, "likes"));
    const commentsSnapshot = await getDocs(query(collection(postDoc.ref, "comments"), orderBy("createdAt", "asc")));
    const comments = commentsSnapshot.docs.map(normalizeComment);

    let poll = null;
    if (data.poll) {
      const options = Array.isArray(data.poll.options) ? data.poll.options.map((option) => asText(option)).filter(Boolean) : [];
      const votesSnapshot = await getDocs(collection(postDoc.ref, "votes"));
      const voteCounts = options.map(() => 0);
      let userVoteIndex = null;
      votesSnapshot.docs.forEach((voteDoc) => {
        const voteData = voteDoc.data();
        const index = Number(voteData.optionIndex);
        if (Number.isInteger(index) && index >= 0 && index < options.length) {
          voteCounts[index] += 1;
        }
        if (userId && voteDoc.id === userId) {
          userVoteIndex = index;
        }
      });
      const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
      poll = {
        question: asText(data.poll.question),
        options,
        voteCounts,
        totalVotes,
        userVoteIndex,
      };
    }

    return {
      id: postDoc.id,
      category: data.category || "article",
      author: asText(data.authorName, "მომხმარებელი"),
      avatar: data.authorPhoto || "/logo.webp",
      timeTag: data.createdAt?.toDate?.()?.toLocaleDateString("ka-GE") || "ახლახან",
      location: data.location ? "📍 " + asText(data.location) : "📍 საქართველო",
      title: asText(data.title, asText(data.text).slice(0, 80) || "ახალი პოსტი"),
      content: asText(data.text),
      hashtags: data.activity ? "#" + asText(data.activity).replace(/s+/g, "") : "",
      img: typeof data.image === "string" ? data.image : "",
      initialLikes: likesSnapshot.size,
      initialComments: comments.length,
      sharesCount: 0,
      comments,
      isLikedByUser: !!userId && likesSnapshot.docs.some((like) => like.id === userId),
      poll,
      feeling: asText(data.feeling),
      authorId: data.authorId,
    };
  }));
}

// Lightweight feed for pages that only need to render post cards or generate
// sitemap URLs. It deliberately avoids one Firestore subcollection read per
// post (likes, comments and poll votes), which keeps the homepage fast.
export async function listPostSummaries(maxPosts = 0) {
  const constraints = [orderBy("createdAt", "desc")];
  if (Number.isInteger(maxPosts) && maxPosts > 0) constraints.push(limit(maxPosts));
  const snapshot = await getDocs(query(postsCollection, ...constraints));

  return snapshot.docs.map((postDoc) => {
    const data = postDoc.data();
    return {
      id: postDoc.id,
      author: asText(data.authorName, "User"),
      avatar: data.authorPhoto || "",
      timeTag: data.createdAt?.toDate?.()?.toLocaleDateString("ka-GE") || "ახლახან",
      location: data.location ? `📍 ${asText(data.location)}` : "📍 საქართველო",
      title: asText(data.title, asText(data.text).slice(0, 80) || "ახალი პოსტი"),
      content: asText(data.text),
      hashtags: data.activity ? `#${asText(data.activity).replace(/\s+/g, "")}` : "",
      img: typeof data.image === "string" ? data.image : "",
      initialLikes: Number(data.likesCount) || 0,
      comments: [],
      sharesCount: Number(data.sharesCount) || 0,
      feeling: asText(data.feeling),
    };
  });
}

export async function createPost({ user, text, feeling, image, poll }) {
  const payload = {
    authorId: user.uid,
    authorName: user.displayName || user.email?.split("@")[0] || "მომხმარებელი",
    authorPhoto: user.photoURL || "",
    text: text.trim(),
    feeling: feeling || "",
    image: image || "",
    poll: poll || null,
    category: "article",
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(postsCollection, payload);
  return ref.id;
}

export async function togglePostLike(postId, user) {
  const likeRef = doc(db, "posts", postId, "likes", user.uid);
  const existing = await getDoc(likeRef);

  if (existing.exists()) {
    await deleteDoc(likeRef);
    return false;
  }

  await setDoc(likeRef, {
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function voteOnPoll(postId, user, optionIndex) {
  const voteRef = doc(db, "posts", postId, "votes", user.uid);
  const existing = await getDoc(voteRef);

  if (existing.exists()) {
    await deleteDoc(voteRef);
    return null;
  }

  await setDoc(voteRef, {
    userId: user.uid,
    optionIndex,
    createdAt: serverTimestamp(),
  });
  return optionIndex;
}

export async function addPostComment(postId, user, text) {
  const ref = await addDoc(collection(db, "posts", postId, "comments"), {
    authorId: user.uid,
    authorName: user.displayName || user.email?.split("@")[0] || "მომხმარებელი",
    authorPhoto: user.photoURL || "",
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updatePost(postId, user, text, image) {
  await updateDoc(doc(db, "posts", postId), {
    text: text.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}
