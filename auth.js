// Firebase Auth Module - Handles authentication across all pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged, 
  signOut,
  sendSignInLinkToEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Track if user is logged in
let isLoggedIn = false;

// Track if registration is in progress (to prevent auto-redirect)
let isRegistrationInProgress = false;

// Update navbar with user info
function updateNavbar(user) {
  const userBtn = document.getElementById('nav-user-btn');
  const userDropdown = document.getElementById('nav-user-dropdown');
  const logoutLink = document.querySelector('.user-logout');
  const dropdownMenu = document.querySelector('.user-dropdown-menu');
  
  if (!userBtn) return;
  
  // არ შევცვალოთ navbar რეგისტრაციის დროს
  if (isRegistrationInProgress) {
    userBtn.textContent = 'Login';
    userBtn.classList.remove('logged-in');
    userBtn.disabled = false;
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }
    return;
  }
  
  if (user) {
    isLoggedIn = true;
    const displayName = user.displayName || user.email.split('@')[0];
    userBtn.textContent = displayName;
    userBtn.classList.add('logged-in');
    userBtn.disabled = false;
    
    // Enable dropdown functionality when logged in
    if (dropdownMenu) {
      dropdownMenu.style.display = 'block';
    }
    
    // Add logout functionality
    if (logoutLink) {
      logoutLink.onclick = (e) => {
        e.preventDefault();
        logOut();
      };
    }
  } else {
    isLoggedIn = false;
    userBtn.textContent = 'Login';
    userBtn.classList.remove('logged-in');
    userBtn.disabled = false;
    
    // Hide dropdown menu when not logged in
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }
  }
}

// Handle navbar button click
function setupNavbarClick() {
  const userBtn = document.getElementById('nav-user-btn');
  const dropdownMenu = document.querySelector('.user-dropdown-menu');
  
  if (!userBtn) return;
  
  // Set initial loading state
  userBtn.textContent = 'Loading...';
  userBtn.disabled = true;
  
  userBtn.addEventListener('click', (e) => {
    if (!isLoggedIn) {
      // Not logged in - redirect to login page
      e.preventDefault();
      window.location.href = 'login.html';
    } else {
      // Logged in - toggle dropdown
      e.preventDefault();
      if (dropdownMenu) {
        const isVisible = dropdownMenu.style.opacity === '1';
        dropdownMenu.style.opacity = isVisible ? '0' : '1';
        dropdownMenu.style.visibility = isVisible ? 'hidden' : 'visible';
      }
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (dropdownMenu && !e.target.closest('.nav-user-dropdown')) {
      dropdownMenu.style.opacity = '0';
      dropdownMenu.style.visibility = 'hidden';
    }
  });
}

// Listen for auth state changes on all pages
onAuthStateChanged(auth, (user) => {
  updateNavbar(user);

  // If on login page, update the UI (but NOT during registration)
  if (window.location.pathname.includes('login.html') && !isRegistrationInProgress) {
    updateLoginPageUI(user);
  }
});

// Setup navbar click after DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupNavbarClick);
} else {
  setupNavbarClick();
}

// Update login page UI
function updateLoginPageUI(user) {
  const loginForm = document.getElementById('login-form');
  const userProfile = document.getElementById('user-profile');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  
  if (!loginForm || !userProfile) return;
  
  if (user) {
    loginForm.classList.add('hidden');
    userProfile.classList.add('active');
    if (userAvatar) {
      userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=2EC4B6&color=fff';
    }
    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email;
  } else {
    loginForm.classList.remove('hidden');
    userProfile.classList.remove('active');
  }
}

// Redirect to home page after login
function redirectAfterLogin() {
  if (window.location.pathname.includes('login.html')) {
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  if (!errorMessage) return;
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 5000);
}

// Show success message
function showSuccess(message) {
  const successMessage = document.getElementById('success-message');
  if (!successMessage) return;
  successMessage.textContent = message;
  successMessage.classList.add('show');
  setTimeout(() => {
    successMessage.classList.remove('show');
  }, 5000);
}

// Show success message with countdown
function showSuccessWithCountdown(message, seconds) {
  const successMessage = document.getElementById('success-message');
  if (!successMessage) return;
  
  let remaining = seconds;
  successMessage.innerHTML = `${message} <strong>(${remaining}s)</strong>`;
  successMessage.classList.add('show');
  
  const countdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      successMessage.innerHTML = `${message} <strong>(${remaining}s)</strong>`;
    } else {
      clearInterval(countdownInterval);
      successMessage.classList.remove('show');
      
      // გადავიყვანოთ Sign In ტაბზე და გავასუფთაოთ ფორმა
      if (window.location.pathname.includes('login.html')) {
        // გავასუფთაოთ Sign Up ფორმა
        const signupForm = document.getElementById('email-signup-form');
        if (signupForm) {
          signupForm.reset();
          const btn = signupForm.querySelector('button');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Account';
          }
        }
        // გადავიყვანოთ Sign In ტაბზე
        document.querySelector('.auth-tab[data-tab="signin"]').click();
      }
    }
  }, 1000);
}

// Google Sign In
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    showSuccess('Welcome! Redirecting...');
    redirectAfterLogin();
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error.code, error.message);
    let errorText = 'Failed to sign in with Google. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorText = 'Sign in was cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorText = 'Pop-up was blocked. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/network-request-failed') {
      errorText = 'Network error. Please check your connection.';
    }
    
    showError(errorText);
    throw error;
  }
}

// Facebook Sign In
async function signInWithFacebook() {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    showSuccess('Welcome! Redirecting...');
    redirectAfterLogin();
    return result.user;
  } catch (error) {
    console.error('Facebook sign in error:', error);
    let errorText = 'Failed to sign in with Facebook. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorText = 'Sign in was cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorText = 'Pop-up was blocked. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorText = 'An account already exists with the same email. Try signing in with a different method.';
    }
    
    showError(errorText);
    throw error;
  }
}

// Get the base URL for redirects
function getBaseUrl() {
  // Use current origin (works for both localhost and production)
  return window.location.origin;
}

// Email/Password Sign Up
async function signUpWithEmail(email, password, displayName) {
  // დავაყენოთ ფლაგი რომ რეგისტრაცია მიმდინარეობს
  isRegistrationInProgress = true;
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(result.user, {
      displayName: displayName
    });
    
    // Action code settings for email verification
    const actionCodeSettings = {
      url: `${getBaseUrl()}/login.html`,
      handleCodeInApp: false
    };
    
    // გაგზავნოს ვერიფიკაცია და მაშინვე გამოვიდეს სისტემიდან
    await sendEmailVerification(result.user, actionCodeSettings);
    await signOut(auth); 

    // აჩვენე წარმატების შეტყობინება და დარჩი ამ გვერდზე
    showSuccessWithCountdown('Account created! Verification link sent to your email. Redirecting to Sign In...', 12);
    
    // ფლაგის გაუქმება countdown-ის შემდეგ
    setTimeout(() => {
      isRegistrationInProgress = false;
    }, 13000);
    
    return { success: true, email: email };
  } catch (error) {
    // შეცდომის შემთხვევაში გავაუქმოთ ფლაგი
    isRegistrationInProgress = false;
    
    console.error('Email sign up error:', error);
    let errorText = 'Failed to create account. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorText = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorText = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorText = 'Password should be at least 6 characters.';
    }
    
    showError(errorText);
    throw error;
  }
}

// Send Password Reset Email
async function resetPassword(email) {
  if (!email || email.trim() === "") {
    showError('Please enter your email in the login field first.');
    return false;
  }
  try {
    // Action code settings for password reset
    const actionCodeSettings = {
      url: `${getBaseUrl()}/login.html`,
      handleCodeInApp: false
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    showSuccess('Password reset link sent to your email!');
    return true;
  } catch (error) {
    console.error('Reset password error:', error.code);
    showError('Could not send reset link. Make sure the email is registered.');
    return false;
  }
}

// Email/Password Sign In
async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // შემოწმება: არის თუ არა იმეილი დადასტურებული
    if (!result.user.emailVerified) {
      showError('Please verify your email address before logging in. Check your inbox.');
      await signOut(auth);
      return null;
    }

    showSuccess('Welcome back! Redirecting...');
    redirectAfterLogin();
    return result.user;
  } catch (error) {
    console.error('Email sign in error:', error);
    let errorText = 'Failed to sign in. Please try again.';
    
    if (error.code === 'auth/user-not-found') {
      errorText = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorText = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorText = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorText = 'Too many failed attempts. Please try again later.';
    }
    
    showError(errorText);
    throw error;
  }
}

// Sign Out
async function logOut() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Sign out error:', error);
    showError('Failed to sign out. Please try again.');
    throw error;
  }
}

// Export functions for use in login page
window.firebaseAuth = {
  signInWithGoogle,
  signInWithFacebook,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  logOut,
  auth
};
