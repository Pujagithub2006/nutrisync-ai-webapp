// ─── firebase.js (MOCK VERSION - REQUIRES ACTUAL LOGIN) ──────────

// Mock auth object that requires actual login
const mockAuth = {
  currentUser: null, // Start with no user
  onAuthStateChanged: (callback) => {
    // Check for stored session (but don't auto-login, just check)
    const storedUser = localStorage.getItem("ns_user");
    const sessionToken = localStorage.getItem("ns_session_token");

    if (storedUser && sessionToken === "authenticated") {
      try {
        const user = JSON.parse(storedUser);
        mockAuth.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.name,
        };
        callback(mockAuth.currentUser);
      } catch {
        callback(null);
      }
    } else {
      // Clear any stale data
      mockAuth.currentUser = null;
      callback(null);
    }
    return () => {};
  },

  // Simulate sign in with email/password
  signInWithEmailAndPassword: async (email, password) => {
    // Simple validation - email must be valid format, password not empty
    if (!email || !email.includes("@")) {
      throw { code: "auth/invalid-email", message: "Invalid email address" };
    }
    if (!password || password.length < 3) {
      throw {
        code: "auth/weak-password",
        message: "Password must be at least 3 characters",
      };
    }

    // Create user object
    const user = {
      uid: "user_" + Date.now(),
      email: email,
      displayName: email.split("@")[0],
    };

    // Store session
    localStorage.setItem("ns_user", JSON.stringify(user));
    localStorage.setItem("ns_session_token", "authenticated");

    mockAuth.currentUser = user;
    return { user };
  },

  // Simulate create account
  createUserWithEmailAndPassword: async (email, password) => {
    if (!email || !email.includes("@")) {
      throw { code: "auth/invalid-email", message: "Invalid email address" };
    }
    if (!password || password.length < 6) {
      throw {
        code: "auth/weak-password",
        message: "Password must be at least 6 characters",
      };
    }

    const user = {
      uid: "user_" + Date.now(),
      email: email,
      displayName: email.split("@")[0],
    };

    localStorage.setItem("ns_user", JSON.stringify(user));
    localStorage.setItem("ns_session_token", "authenticated");

    mockAuth.currentUser = user;
    return { user };
  },

  // Simulate update profile
  updateProfile: async (user, { displayName }) => {
    const storedUser = localStorage.getItem("ns_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.name = displayName;
      user.displayName = displayName;
      localStorage.setItem("ns_user", JSON.stringify(userData));
    }
    return Promise.resolve();
  },

  // Sign out - clear everything
  signOut: async () => {
    console.log("Mock sign out");
    mockAuth.currentUser = null;
    localStorage.removeItem("ns_user");
    localStorage.removeItem("ns_session_token");
    localStorage.removeItem("ns_profile");

    // Clear diary data
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("ns_diary_")) {
        localStorage.removeItem(key);
      }
    });
    return Promise.resolve();
  },
};

// Helper function to get current user
export const getCurrentUser = () => mockAuth.currentUser;

export const auth = mockAuth;
export const db = null;
