"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import {
  signInWithGoogle,
  signInWithFacebook,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
} from "../lib/firebase";

// ── Icons ─────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ── Error codes → Localized messages ──────────────────────────
function getErrorMessage(code, t) {
  const map = {
    "auth/email-already-in-use": t("loginPage.authErrors.alreadyInUse"),
    "auth/invalid-email": t("loginPage.authErrors.invalidEmail"),
    "auth/weak-password": t("loginPage.authErrors.weakPassword"),
    "auth/user-not-found": t("loginPage.authErrors.userNotFound"),
    "auth/wrong-password": t("loginPage.authErrors.wrongPassword"),
    "auth/too-many-requests": t("loginPage.authErrors.tooManyRequests"),
    "auth/popup-closed-by-user": t("loginPage.authErrors.popupClosed"),
    "auth/popup-blocked": t("loginPage.authErrors.popupBlocked"),
    "auth/account-exists-with-different-credential": t("loginPage.authErrors.accountDifferentCredential"),
    "auth/email-not-verified": t("loginPage.authErrors.emailNotVerified"),
    "auth/invalid-credential": t("loginPage.authErrors.invalidCredential"),
  };
  return map[code] || t("loginPage.authErrors.defaultError");
}

// ── Main Component ────────────────────────────────────────────
export default function LoginPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("signin"); // "signin" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sign In fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign Up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  const { user } = useAuth() ?? {};
  const router = useRouter();

  // If already logged in, show profile view (handled below)
  const isLoggedIn = !!user;

  const showError = (msg) => { setError(msg); setSuccess(""); };
  const showSuccess = (msg) => { setSuccess(msg); setError(""); };

  // ── Social ──────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      showSuccess(t("loginPage.welcomeRedirect"));
      setTimeout(() => router.push("/"), 900);
    } catch (e) {
      showError(getErrorMessage(e.code, t));
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebook() {
    setLoading(true);
    setError("");
    try {
      await signInWithFacebook();
      showSuccess(t("loginPage.welcomeRedirect"));
      setTimeout(() => router.push("/"), 900);
    } catch (e) {
      showError(getErrorMessage(e.code, t));
    } finally {
      setLoading(false);
    }
  }

  // ── Sign In ─────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(siEmail, siPassword);
      showSuccess(t("loginPage.welcomeRedirect"));
      setTimeout(() => router.push("/"), 900);
    } catch (e) {
      showError(getErrorMessage(e.code, t));
    } finally {
      setLoading(false);
    }
  }

  // ── Sign Up ─────────────────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(suEmail, suPassword, suName);
      showSuccess(t("loginPage.accountCreatedVerify"));
      setTimeout(() => setTab("signin"), 3000);
    } catch (e) {
      showError(getErrorMessage(e.code, t));
    } finally {
      setLoading(false);
    }
  }

  // ── Password Reset ──────────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault();
    if (!siEmail.trim()) { showError(t("loginPage.enterEmailFirst")); return; }
    setLoading(true);
    try {
      await resetPassword(siEmail);
      showSuccess(t("loginPage.resetEmailSent"));
    } catch (e) {
      showError(t("loginPage.resetEmailFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="login-page-wrap">
        <div className="login-card">

          {/* ── Logged-in profile view ── */}
          {isLoggedIn ? (
            <div className="lp-profile">
              <div className="lp-signed-badge">{t("loginPage.signedInBadge")}</div>
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=29b2b7&color=fff&size=80`
                }
                alt={t("loginPage.profile")}
                className="lp-avatar"
                width={80}
                height={80}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=29b2b7&color=fff&size=80`;
                }}
              />
              <div className="lp-username">{user.displayName || user.email?.split("@")[0]}</div>
              <div className="lp-useremail">{user.email}</div>
              <Link href="/" className="lp-btn-primary" style={{ marginTop: "1.25rem", display: "inline-flex", justifyContent: "center" }}>
                {t("loginPage.exploreTours")}
              </Link>
            </div>
          ) : (
            <>
              {/* ── Logo + headline ── */}
              <div className="lp-logo">
                <Image src="/logo.webp" alt="GeorgiaTrips" width={64} height={64} style={{ objectFit: "contain" }} />
              </div>
              <h1 className="lp-title">{t("loginPage.welcomeTitle")}</h1>
              <p className="lp-subtitle">{t("loginPage.welcomeSubtitle")}</p>

              {/* ── Alerts ── */}
              {error && <div className="lp-alert lp-alert-error" role="alert">{error}</div>}
              {success && <div className="lp-alert lp-alert-success" role="status">{success}</div>}

              {/* ── Tabs ── */}
              <div className="lp-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={tab === "signin"}
                  className={`lp-tab ${tab === "signin" ? "active" : ""}`}
                  onClick={() => { setTab("signin"); setError(""); setSuccess(""); }}
                >
                  {t("loginPage.tabSignIn")}
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "signup"}
                  className={`lp-tab ${tab === "signup" ? "active" : ""}`}
                  onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}
                >
                  {t("loginPage.tabSignUp")}
                </button>
              </div>

              {/* ── SIGN IN panel ── */}
              {tab === "signin" && (
                <div className="lp-panel">
                  <button className="lp-social-btn" onClick={handleGoogle} disabled={loading}>
                    <GoogleIcon /> {t("loginPage.googleSignIn")}
                  </button>
                  <button className="lp-social-btn lp-social-fb" onClick={handleFacebook} disabled={loading}>
                    <FacebookIcon /> {t("loginPage.facebookSignIn")}
                  </button>

                  <div className="lp-divider"><span>{t("loginPage.orWithEmail")}</span></div>

                  <form onSubmit={handleSignIn} className="lp-form">
                    <div className="lp-field">
                      <label htmlFor="si-email">{t("loginPage.emailLabel")}</label>
                      <input
                        id="si-email"
                        type="email"
                        placeholder={t("loginPage.emailPlaceholder")}
                        value={siEmail}
                        onChange={(e) => setSiEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="si-password">{t("loginPage.passwordLabel")}</label>
                      <input
                        id="si-password"
                        type="password"
                        placeholder={t("loginPage.passwordPlaceholder")}
                        value={siPassword}
                        onChange={(e) => setSiPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <button type="submit" className="lp-btn-primary" disabled={loading}>
                      {loading ? t("common.loading") : t("loginPage.signInBtn")}
                    </button>
                  </form>

                  <div className="lp-forgot">
                    <button onClick={handleForgot} disabled={loading} type="button">
                      {t("loginPage.forgotPassword")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SIGN UP panel ── */}
              {tab === "signup" && (
                <div className="lp-panel">
                  <button className="lp-social-btn" onClick={handleGoogle} disabled={loading}>
                    <GoogleIcon /> {t("loginPage.googleSignUp")}
                  </button>
                  <button className="lp-social-btn lp-social-fb" onClick={handleFacebook} disabled={loading}>
                    <FacebookIcon /> {t("loginPage.facebookSignUp")}
                  </button>

                  <div className="lp-divider"><span>{t("loginPage.orWithEmail")}</span></div>

                  <form onSubmit={handleSignUp} className="lp-form">
                    <div className="lp-field">
                      <label htmlFor="su-name">{t("loginPage.fullNameLabel")}</label>
                      <input
                        id="su-name"
                        type="text"
                        placeholder={t("loginPage.fullNamePlaceholder")}
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="su-email">{t("loginPage.emailLabel")}</label>
                      <input
                        id="su-email"
                        type="email"
                        placeholder={t("loginPage.emailPlaceholder")}
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="su-password">{t("loginPage.passwordLabel")}</label>
                      <input
                        id="su-password"
                        type="password"
                        placeholder={t("loginPage.passwordMinPlaceholder")}
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                    <button type="submit" className="lp-btn-primary" disabled={loading}>
                      {loading ? t("common.loading") : t("loginPage.signUpBtn")}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Footer note ── */}
              <p className="lp-footer-note">
                {t("loginPage.termsNoticePre")}
                <Link href="/terms">{t("loginPage.terms")}</Link>
                {t("loginPage.termsAnd")}
                <Link href="/privacy-policy">{t("loginPage.privacy")}</Link>.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        /* ── Page wrapper ── */
        .login-page-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 1.25rem 4rem;
          background: var(--bg-main);
        }

        /* ── Card ── */
        .login-card {
          background: var(--bg-card);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--border);
          padding: 2.75rem 2.5rem;
          width: 100%;
          max-width: 460px;
          text-align: center;
        }

        /* ── Logo ── */
        .lp-logo {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          overflow: hidden;
          margin: 0 auto 1.5rem;
          background: rgba(16, 109, 164, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Headline ── */
        .lp-title {
          font-family: var(--font-head);
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .lp-subtitle {
          color: var(--text-mute);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        /* ── Alerts ── */
        .lp-alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          text-align: left;
          line-height: 1.5;
        }
        .lp-alert-error {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .lp-alert-success {
          background: rgba(34, 197, 94, 0.08);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        /* ── Tabs ── */
        .lp-tabs {
          display: flex;
          background: rgba(15, 23, 42, 0.05);
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 1.5rem;
          gap: 2px;
        }
        .lp-tab {
          flex: 1;
          padding: 0.6rem 1rem;
          background: transparent;
          border: none;
          border-radius: 50px;
          font-family: var(--font-main);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-mute);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .lp-tab.active {
          background: var(--bg-card);
          color: var(--text-dark);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* ── Social buttons ── */
        .lp-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 0.8rem 1.25rem;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 50px;
          font-family: var(--font-main);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.18s, box-shadow 0.18s;
          margin-bottom: 0.65rem;
        }
        .lp-social-btn:hover:not(:disabled) {
          border-color: var(--teal);
          background: rgba(41, 178, 183, 0.04);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
        }
        .lp-social-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .lp-social-fb {
          background: #1877f2;
          border-color: #1877f2;
          color: #fff;
        }
        .lp-social-fb:hover:not(:disabled) {
          background: #166fe5;
          border-color: #166fe5;
        }

        /* ── Divider ── */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.1rem 0;
          color: var(--text-mute);
          font-size: 0.8rem;
        }
        .lp-divider::before,
        .lp-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* ── Form ── */
        .lp-form {
          text-align: left;
        }
        .lp-field {
          margin-bottom: 0.9rem;
        }
        .lp-field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 0.35rem;
        }
        .lp-field input {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: var(--font-main);
          background: var(--bg-main);
          color: var(--text-dark);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .lp-field input:focus {
          border-color: var(--teal);
          box-shadow: 0 0 0 3px rgba(41, 178, 183, 0.12);
          background: var(--bg-card);
        }
        .lp-field input::placeholder {
          color: var(--text-mute);
          opacity: 0.7;
        }

        /* ── Primary button ── */
        .lp-btn-primary {
          display: block;
          width: 100%;
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, var(--blue), var(--teal));
          color: var(--white);
          border: none;
          border-radius: 50px;
          font-family: var(--font-main);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.18s;
          margin-top: 0.5rem;
          text-align: center;
        }
        .lp-btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(16, 109, 164, 0.35);
          transform: translateY(-1px);
        }
        .lp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Forgot password ── */
        .lp-forgot {
          text-align: center;
          margin-top: 0.9rem;
        }
        .lp-forgot button {
          background: none;
          border: none;
          color: var(--teal);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-main);
          padding: 0;
          transition: opacity 0.2s;
        }
        .lp-forgot button:hover {
          opacity: 0.75;
        }
        .lp-forgot button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Footer note ── */
        .lp-footer-note {
          font-size: 0.75rem;
          color: var(--text-mute);
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
          line-height: 1.6;
        }
        .lp-footer-note a {
          color: var(--teal);
          font-weight: 600;
        }

        /* ── Logged-in profile ── */
        .lp-profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
        }
        .lp-signed-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(41, 178, 183, 0.1);
          color: var(--teal);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.3rem 0.9rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
        }
        .lp-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid var(--teal);
          object-fit: cover;
        }
        .lp-username {
          font-family: var(--font-head);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
        }
        .lp-useremail {
          font-size: 0.88rem;
          color: var(--text-mute);
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .login-page-wrap {
            padding: 5rem 0.75rem 3rem;
            align-items: flex-start;
            min-height: 100dvh;
          }

          .login-card {
            padding: 1.75rem 1.1rem 2rem;
            border-radius: 18px;
            max-width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.07);
          }

          .lp-logo {
            width: 58px;
            height: 58px;
            margin-bottom: 1.1rem;
          }

          .lp-title {
            font-size: 1.3rem;
            margin-bottom: 0.4rem;
          }

          .lp-subtitle {
            font-size: 0.82rem;
            margin-bottom: 1.2rem;
          }

          .lp-tabs {
            margin-bottom: 1.2rem;
          }

          .lp-tab {
            font-size: 0.8rem;
            padding: 0.55rem 0.75rem;
          }

          .lp-social-btn {
            font-size: 0.82rem;
            padding: 0.72rem 1rem;
            gap: 8px;
          }

          .lp-divider {
            margin: 0.85rem 0;
            font-size: 0.75rem;
          }

          .lp-field {
            margin-bottom: 0.75rem;
          }

          .lp-field label {
            font-size: 0.75rem;
          }

          .lp-field input {
            padding: 0.72rem 0.875rem;
            font-size: 0.88rem;
            border-radius: 10px;
          }

          .lp-btn-primary {
            padding: 0.78rem 1.25rem;
            font-size: 0.88rem;
          }

          .lp-forgot {
            margin-top: 0.7rem;
          }

          .lp-forgot button {
            font-size: 0.78rem;
          }

          .lp-footer-note {
            font-size: 0.7rem;
            margin-top: 1.1rem;
            padding-top: 1rem;
          }

          .lp-alert {
            font-size: 0.8rem;
            padding: 0.65rem 0.85rem;
          }

          /* Profile view on mobile */
          .lp-avatar {
            width: 68px;
            height: 68px;
          }

          .lp-username {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 380px) {
          .login-page-wrap {
            padding: 4.5rem 0.5rem 2.5rem;
          }

          .login-card {
            padding: 1.5rem 0.9rem 1.75rem;
            border-radius: 14px;
          }

          .lp-title {
            font-size: 1.15rem;
          }

          .lp-social-btn {
            font-size: 0.78rem;
            padding: 0.65rem 0.75rem;
          }
        }
      `}</style>
    </>
  );
}
