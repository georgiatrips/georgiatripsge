let currentPost = null;
const POST_RETRY_MS = 1000;
let _postRetryTimer = null;
let _postFirebaseStarted = false;

function _getPostIdFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('post') || null;
  } catch (e) { return null; }
}

function _L(val, fallback = '') {
  if (window.localize) return window.localize(val, fallback);
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ka || val.en || fallback;
  return String(val);
}

function _translateCommonValue(str) {
  if (window.translateCommonValue) return window.translateCommonValue(str);
  return _L(str);
}

function _tryGetPostFromAnySource(postId) {
  try {
    const stored = sessionStorage.getItem('selectedPostData');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && postId && parsed.id === postId) return parsed;
      if (parsed && !postId) return parsed;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('gt_data_cache_v1');
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache && Array.isArray(cache.posts)) {
        const hit = postId ? cache.posts.find(p => p && p.id === postId) : cache.posts[0];
        if (hit) return hit;
      }
    }
  } catch (e) {}

  return null;
}

async function _firebaseFetchPostById(postId) {
  if (!postId) return null;
  try {
    const [{ initializeApp, getApps, getApp }, { getFirestore, doc, getDoc, collection, getDocs }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
    ]);
    const cfg = {
      apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
      authDomain: "georgiatripsge.firebaseapp.com",
      projectId: "georgiatripsge",
      storageBucket: "georgiatripsge.firebasestorage.app",
      messagingSenderId: "458133209260",
      appId: "1:458133209260:web:884340052c037e6fcd9f09"
    };
    const app = getApps().length ? getApp() : initializeApp(cfg);
    const db = getFirestore(app);

    try {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    } catch (e) {}

    const snapshot = await getDocs(collection(db, 'posts'));
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    try {
      const raw = localStorage.getItem('gt_data_cache_v1');
      const cache = raw ? JSON.parse(raw) : {};
      cache.posts = list;
      cache.timestamp = Date.now();
      localStorage.setItem('gt_data_cache_v1', JSON.stringify(cache));
    } catch (e) {}
    return list.find(p => p.id === postId) || null;
  } catch (err) {
    console.error('[posts-detail] Firebase lookup failed:', err);
    return null;
  }
}

function populatePostDetail() {
  if (!currentPost) return;
  const title = _L(currentPost.title, '');
  const body = _L(currentPost.text || currentPost.content, '');
  const category = _translateCommonValue(_L(currentPost.category, 'Story'));
  const date = _L(currentPost.date, '');

  document.title = `${title || 'Post'} – Georgia Trips`;

  const heroImg = document.getElementById('post-hero-img');
  if (heroImg) heroImg.src = currentPost.img || '';
  const titleEl = document.getElementById('post-title');
  if (titleEl) titleEl.textContent = title || '';
  const bodyEl = document.getElementById('post-body');
  if (bodyEl) bodyEl.textContent = body || '';
  const catEl = document.getElementById('post-category');
  if (catEl) catEl.textContent = category || 'Story';
  const dateEl = document.getElementById('post-date');
  if (dateEl) dateEl.textContent = date || '';

  try {
    sessionStorage.removeItem('selectedPostId');
    sessionStorage.removeItem('selectedPostData');
  } catch (e) {}
}

function loadPostDetail() {
  const urlId = _getPostIdFromURL();
  const storedId = sessionStorage.getItem('selectedPostId');
  const postId = urlId || storedId;

  if (urlId && storedId && urlId !== storedId) {
    try {
      sessionStorage.removeItem('selectedPostData');
      sessionStorage.setItem('selectedPostId', urlId);
    } catch (e) {}
  } else if (urlId && !storedId) {
    try { sessionStorage.setItem('selectedPostId', urlId); } catch (e) {}
  }

  const hit = _tryGetPostFromAnySource(postId);
  if (hit) {
    currentPost = hit;
    populatePostDetail();
    if (_postRetryTimer) {
      clearTimeout(_postRetryTimer);
      _postRetryTimer = null;
    }
    return;
  }

  if (postId && !_postFirebaseStarted) {
    _postFirebaseStarted = true;
    _firebaseFetchPostById(postId)
      .then((post) => {
        if (post) {
          try {
            sessionStorage.setItem('selectedPostId', post.id);
            sessionStorage.setItem('selectedPostData', JSON.stringify(post));
          } catch (e) {}
        } else {
          _postFirebaseStarted = false;
        }
        loadPostDetail();
      })
      .catch(() => { _postFirebaseStarted = false; });
  }

  if (_postRetryTimer) clearTimeout(_postRetryTimer);
  _postRetryTimer = setTimeout(() => {
    _postRetryTimer = null;
    if (!currentPost) loadPostDetail();
  }, POST_RETRY_MS);
}

window.shareCurrentPost = function(event) {
  if (event) event.preventDefault();
  if (!currentPost) return;
  const title = _L(currentPost.title, 'Post');
  const url = `${window.location.origin}/posts-detail.html?id=${encodeURIComponent(currentPost.id)}`;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      if (window.showToast) window.showToast('Link copied to clipboard!', 'info');
      else alert('Link copied: ' + url);
    });
  }
};

document.addEventListener('DOMContentLoaded', loadPostDetail);
window.addEventListener('languageChanged', () => {
  if (currentPost) populatePostDetail();
});
