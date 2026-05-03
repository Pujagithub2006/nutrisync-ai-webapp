// ─── storage.js ───────────────────────────────────────────────
// Uses Firebase Firestore for cloud storage + localStorage cache

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cacheGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function cacheSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const storage = {
  // ── Profile ────────────────────────────────────────────────
  getProfile: () => cacheGet("ns_profile"),

  setProfile: async (uid, profile) => {
    cacheSet("ns_profile", profile);
    if (uid && db) {
      await setDoc(doc(db, "users", uid, "data", "profile"), profile);
    }
    return true;
  },

  loadProfile: async (uid) => {
    if (!uid || !db) return cacheGet("ns_profile");
    try {
      const snap = await getDoc(doc(db, "users", uid, "data", "profile"));
      if (snap.exists()) {
        const data = snap.data();
        cacheSet("ns_profile", data);
        return data;
      }
    } catch (e) {
      console.warn("Firestore read failed, using cache:", e);
    }
    return cacheGet("ns_profile");
  },

  // ── Diary ──────────────────────────────────────────────────
  getTodayKey: todayKey,

  getDiary: () => cacheGet(`ns_diary_${todayKey()}`) || [],

  loadDiary: async (uid, dateKey) => {
    const key = dateKey || todayKey();
    if (!uid || !db) return cacheGet(`ns_diary_${key}`) || [];

    try {
      const ref = collection(db, "users", uid, "diary", key, "meals");
      const snap = await getDocs(query(ref, orderBy("timestamp", "asc")));
      const meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cacheSet(`ns_diary_${key}`, meals);
      return meals;
    } catch (e) {
      console.warn("Firestore diary load failed:", e);
      return cacheGet(`ns_diary_${key}`) || [];
    }
  },

  addMeal: async (uid, meal) => {
    const key = todayKey();
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const entry = { ...meal, time, timestamp: Date.now() };

    let docRef = null;
    if (uid && db) {
      try {
        const ref = collection(db, "users", uid, "diary", key, "meals");
        docRef = await addDoc(ref, entry);
        entry.id = docRef.id;
      } catch (e) {
        console.warn("Firestore add failed, using local only:", e);
      }
    }

    if (!entry.id) entry.id = Date.now().toString();

    const current = cacheGet(`ns_diary_${key}`) || [];
    cacheSet(`ns_diary_${key}`, [...current, entry]);
    return entry;
  },

  removeMeal: async (uid, mealId) => {
    const key = todayKey();
    if (uid && db) {
      try {
        await deleteDoc(doc(db, "users", uid, "diary", key, "meals", mealId));
      } catch (e) {
        console.warn("Firestore delete failed:", e);
      }
    }
    const current = (cacheGet(`ns_diary_${key}`) || []).filter(
      (m) => m.id !== mealId,
    );
    cacheSet(`ns_diary_${key}`, current);
    return current;
  },

  getEatenToday: () =>
    (cacheGet(`ns_diary_${todayKey()}`) || []).map((m) => m.name),

  // ── User session ─────────────────────────────────────────
  getUser: () => cacheGet("ns_user"),
  setUser: (u) => cacheSet("ns_user", u),
  clearUser: () => {
    localStorage.removeItem("ns_user");
    localStorage.removeItem("ns_profile");
  },
};
