// ─── LoginScreen.jsx (MOCK AUTH - PROPER LOGIN) ───────────
import { useState } from "react";
import { storage } from "../utils/storage";
import { auth } from '../firebase';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        if (!name) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        const result = await auth.createUserWithEmailAndPassword(
          email,
          password,
        );
        if (result.user && name) {
          await auth.updateProfile(result.user, { displayName: name });
        }
        const user = {
          uid: result.user.uid,
          email: result.user.email,
          name: name || result.user.displayName,
        };
        onLogin(user, true); // needs onboarding
      } else {
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
        };
        const profile = localStorage.getItem("ns_profile");
        onLogin(user, !profile);
      }
    } catch (e) {
      const errorMessages = {
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/email-already-in-use":
          "Email already registered. Please sign in.",
      };
      setError(errorMessages[e.code] || e.message || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "60px 28px 28px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, animation: "slideUp 0.5s ease both" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(182,245,66,0.1)",
            border: "1px solid rgba(182,245,66,0.2)",
            borderRadius: 100,
            padding: "6px 14px",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 16 }}>🥗</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            NutriSync AI
          </span>
        </div>
        <div
          style={{
            fontSize: 30,
            fontFamily: "var(--font-head)",
            fontWeight: 800,
            lineHeight: 1.15,
            whiteSpace: "pre-line",
          }}
        >
          {mode === "login" ? "Welcome\nback 👋" : "Create your\naccount ✨"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 8,
            fontWeight: 300,
          }}
        >
          {mode === "login"
            ? "Sign in to continue your journey."
            : "Your AI nutritionist awaits."}
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1 }}>
        {mode === "signup" && (
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              className="input-field"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="input-field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255,94,94,0.08)",
              border: "1px solid rgba(255,94,94,0.25)",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 12,
              color: "var(--red)",
              marginBottom: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div className="spinner" /> Please wait…
            </>
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
        <button
          className="btn-outline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 20,
        }}
      >
        Mock Mode 🔓 (No Firebase required)
      </div>
    </div>
  );
}
