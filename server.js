const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend build
app.use(express.static(path.join(__dirname, "build")));

/* ─────────────────────────────────────────
   FOOD SCAN & NUTRITION API - SETUP
───────────────────────────────────────── */

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Store nutrition data in memory when server starts
let nutritionDatabase = {};

// Load CSV file on server start
function loadNutritionData() {
  const csvPath = path.join(__dirname, "nutrition_data.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("⚠️ nutrition_data.csv not found. Using empty database.");
    return;
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      const foodName = (row["Food Items"] || "").toLowerCase().trim();
      if (foodName) {
        nutritionDatabase[foodName] = {
          calories: parseFloat(row["Energy kcal"]) || 0,
          protein: parseFloat(row["Protein(g)"]) || 0,
          carbs: parseFloat(row["Carbs"]) || 0,
          fat: parseFloat(row["Fat(g)"]) || 0,
          fiber: parseFloat(row["Fibre(g)"]) || 0,
          sugar: parseFloat(row["Freesugar(g)"]) || 0,
          gi: "Medium",
          unit: "100g",
        };
      }
    })
    .on("end", () => {
      console.log(
        `✅ Loaded ${Object.keys(nutritionDatabase).length} food items from CSV`,
      );
      const first10 = Object.keys(nutritionDatabase).slice(0, 10);
      console.log("Sample foods:", first10.join(", "));
    });
}

loadNutritionData();

/* ─────────────────────────────────────────
   VITALS ENDPOINT
───────────────────────────────────────── */
app.get("/api/vitals", async (req, res) => {
  try {
    const vitals = {
      heart_rate_bpm: 70 + Math.floor(Math.random() * 15),
      hrv_ms: 50 + Math.floor(Math.random() * 25),
      spo2: 96 + Math.floor(Math.random() * 3),
      steps: 3000 + Math.floor(Math.random() * 5000),
      active_calories: 1000 + Math.floor(Math.random() * 800),
      sleep_hours: 6.5 + Math.random() * 2,
      physio_state: "normal",
      stress_score: 20 + Math.floor(Math.random() * 30),
    };
    res.json(vitals);
  } catch (error) {
    console.error("Vitals error:", error.message);
    res.status(500).json({ error: "Vitals unavailable" });
  }
});

/* ─────────────────────────────────────────
   Physiology Route
───────────────────────────────────────── */
app.post("/api/physiology", async (req, res) => {
  try {
    const { age, gender, weight, height, activity, goal } = req.body;

    let bmr;
    if (gender === "Male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      Athlete: 1.9,
    };
    const tdee = bmr * (activityMultipliers[activity] || 1.55);

    let recommendedCalories = tdee;
    if (goal === "weightloss") recommendedCalories = tdee - 500;
    if (goal === "muscle") recommendedCalories = tdee + 300;

    res.json({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      recommended_calories: Math.round(recommendedCalories),
      status: "success",
    });
  } catch (error) {
    console.error("Physiology error:", error.message);
    res.json({
      bmr: 1500,
      tdee: 2200,
      recommended_calories: 2000,
      status: "fallback",
    });
  }
});

/* ─────────────────────────────────────────
   Enhanced Physiology Route
───────────────────────────────────────── */
app.post("/api/physiology-enhanced", async (req, res) => {
  try {
    const pythonEngineUrl = process.env.PYTHON_ENGINE;
    if (pythonEngineUrl && pythonEngineUrl !== "http://localhost:8000") {
      const response = await axios.post(
        `${pythonEngineUrl}/v1/physiology/sync`,
        req.body,
        { timeout: 5000 },
      );
      res.json(response.data);
    } else {
      const { heart_rate_bpm, hrv_ms, spo2 } = req.body;
      let healthScore = 75;
      let physioState = "normal";

      if (heart_rate_bpm > 90) healthScore -= 10;
      if (hrv_ms < 35) healthScore -= 10;
      if (spo2 < 95) healthScore -= 10;

      if (healthScore < 50) physioState = "high";
      else if (healthScore > 80) physioState = "low";
      else physioState = "normal";

      res.json({
        score: healthScore,
        physio_state: physioState,
        status: "calculated",
      });
    }
  } catch (error) {
    console.error("Enhanced physiology error:", error.message);
    res.status(500).json({ error: "Enhanced physiology service unavailable" });
  }
});

/* ─────────────────────────────────────────
   Real-time Vitals
───────────────────────────────────────── */
app.get("/api/vitals-realtime", async (req, res) => {
  try {
    const pythonEngineUrl = process.env.PYTHON_ENGINE;
    if (pythonEngineUrl && pythonEngineUrl !== "http://localhost:8000") {
      const response = await axios.get(
        `${pythonEngineUrl}/v1/physiology/today`,
        {
          headers: {
            Authorization: `Bearer ${process.env.BACKEND_AUTH_TOKEN || "test"}`,
          },
          timeout: 5000,
        },
      );
      res.json(response.data);
    } else {
      res.json({
        heart_rate_bpm: 70 + Math.floor(Math.random() * 15),
        hrv_ms: 50 + Math.floor(Math.random() * 25),
        spo2: 96 + Math.floor(Math.random() * 3),
        steps: 3000 + Math.floor(Math.random() * 5000),
        active_calories: 1000 + Math.floor(Math.random() * 800),
        sleep_hours: 6.5 + Math.random() * 2,
        physio_state: "normal",
      });
    }
  } catch (error) {
    console.error("Real-time vitals error:", error.message);
    res.status(500).json({ error: "Real-time vitals unavailable" });
  }
});

/* ─────────────────────────────────────────
   Food Image API (Spoonacular - Fixed)
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   Food Image API - Working Solution
───────────────────────────────────────── */
app.get("/api/food-image", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ image: null, title: null });
    }

    console.log(`📸 Getting image for: ${query}`);

    // Clean the query for better search
    const cleanQuery = query
      .replace(/\(.*?\)/g, "")
      .replace(/\bwith\b.*/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 2)
      .join(" ");

    // Use The Meal DB API (FREE, no API key needed!)
    // This API returns beautiful food photos
    const searchUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cleanQuery)}`;

    const response = await axios.get(searchUrl, { timeout: 8000 });

    if (response.data.meals && response.data.meals.length > 0) {
      // Get the meal thumbnail image
      const imageUrl = response.data.meals[0].strMealThumb;
      console.log(`✅ Found image from TheMealDB for: ${query}`);
      return res.json({
        image: imageUrl,
        title: response.data.meals[0].strMeal,
      });
    }

    // Fallback 2: Use Foodish API (completely free, no key)
    const categories = [
      "pizza",
      "burger",
      "pasta",
      "sushi",
      "salad",
      "soup",
      "dessert",
    ];
    let category = "food";
    for (const cat of categories) {
      if (cleanQuery.toLowerCase().includes(cat)) {
        category = cat;
        break;
      }
    }

    const foodishUrl = `https://foodish-api.herokuapp.com/api/images/${category}`;
    const foodishResponse = await axios.get(foodishUrl, { timeout: 8000 });

    if (foodishResponse.data && foodishResponse.data.image) {
      console.log(`✅ Found image from Foodish for: ${query}`);
      return res.json({ image: foodishResponse.data.image, title: query });
    }

    // Fallback 3: Placeholder with food name (always works)
    const placeholderUrl = `https://placehold.co/400x300/1a2a1a/4cff8c?text=${encodeURIComponent(cleanQuery)}`;
    console.log(`⚠️ Using placeholder for: ${query}`);
    res.json({ image: placeholderUrl, title: query });
  } catch (err) {
    console.error("Food image error:", err.message);
    // Ultimate fallback - always returns something
    const fallbackUrl = `https://placehold.co/400x300/1a2a1a/4cff8c?text=${encodeURIComponent(req.query.query || "Meal")}`;
    res.json({ image: fallbackUrl, title: req.query.query });
  }
});

/* ─────────────────────────────────────────
   AI Vision - Identify food from image
───────────────────────────────────────── */
app.post("/api/identify-food", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    console.log(`📸 Identifying food via AI Vision: ${imagePath}`);

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {}
      return res.json({
        success: true,
        foodName: "unknown",
        identifiedBy: "fallback",
      });
    }

    const prompt = `Identify the food in this image. Return ONLY the name of the food in lowercase. Nothing else.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000,
      },
    );

    try {
      fs.unlinkSync(imagePath);
    } catch (e) {}

    let identifiedFood = response.data.choices[0].message.content
      .trim()
      .toLowerCase();
    identifiedFood = identifiedFood.replace(/[^\w\s]/g, "").trim();

    console.log(`🔍 AI Vision identified: ${identifiedFood}`);

    res.json({
      success: true,
      foodName: identifiedFood,
      identifiedBy: "ai-vision",
    });
  } catch (error) {
    console.error("AI Vision error:", error.message);
    try {
      if (req.file) fs.unlinkSync(req.file.path);
    } catch (e) {}
    res.status(500).json({ error: error.message, foodName: "unknown" });
  }
});

/* ─────────────────────────────────────────
   Exercise Chat - Dedicated Endpoint
───────────────────────────────────────── */
app.post("/api/exercise-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    let prompt = messages.map((m) => m.content).join("\n");

    prompt += `

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION:
═══════════════════════════════════════════════════════════════
You are a FITNESS COACH. Return ONLY valid JSON array of exercises.
DO NOT include meals, food, or recipes.

Example:
[
  {
    "name": "Push-ups",
    "emoji": "💪",
    "duration": "10 minutes",
    "sets": "3 sets x 10 reps",
    "calories_burned": 80,
    "intensity": "Moderate",
    "muscle_group": "Chest, Triceps",
    "reason": "Builds upper body strength",
    "steps": ["Get into plank position", "Lower body", "Push up"]
  }
]

Return ONLY the JSON array:`;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      const mockExercises = [
        {
          name: "Brisk Walking",
          emoji: "🚶",
          duration: "20 minutes",
          sets: "1 session",
          calories_burned: 100,
          intensity: "Moderate",
          muscle_group: "Legs, Cardio",
          reason: "Walking improves cardiovascular health.",
          steps: [
            "Start with 5 min warm-up",
            "Walk briskly for 15 min",
            "Cool down for 5 min",
          ],
        },
      ];
      res.json({
        content: [{ type: "text", text: JSON.stringify(mockExercises) }],
      });
      return;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 45000,
      },
    );

    let text = response.data.choices[0].message.content;
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) text = jsonMatch[0];

    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Exercise chat error:", err.message);
    const fallback = [
      {
        name: "Light Stretching",
        emoji: "🧘",
        duration: "10 minutes",
        sets: "1 set",
        calories_burned: 30,
        intensity: "Light",
        muscle_group: "Full Body",
        reason: "Gentle exercise for your current state.",
        steps: ["Neck rolls", "Shoulder stretches", "Torso twists"],
      },
    ];
    res.json({ content: [{ type: "text", text: JSON.stringify(fallback) }] });
  }
});

/* ─────────────────────────────────────────
   Full Day Meal Plan Endpoint
───────────────────────────────────────── */
app.post("/api/full-day-plan", async (req, res) => {
  try {
    const { userProfile, vitals } = req.body;

    const prompt = `You are NutriSync AI. Create a FULL DAY meal plan for this user.

USER PROFILE:
- Goal: ${userProfile?.goal || "balance"}
- Activity: ${userProfile?.activity || "Moderately Active"}
- Diet: ${userProfile?.vegetarian ? "Vegetarian" : userProfile?.vegan ? "Vegan" : "Non-vegetarian"}
- Allergies: ${userProfile?.allergies?.join(", ") || "None"}
- Medical Conditions: ${userProfile?.diseases?.filter((d) => d !== "None").join(", ") || "None"}

LIVE VITALS:
- Heart Rate: ${vitals?.hr || 75} BPM
- Stress: ${vitals?.stress || "Moderate"}
- Steps: ${vitals?.steps || 0}

Return ONLY valid JSON with this structure:
{
  "breakfast": {
    "name": "Meal name",
    "emoji": "🥞",
    "kcal": 400,
    "protein": 15,
    "carbs": 45,
    "fat": 12,
    "gi": "Low",
    "reason": "Why this is good for breakfast"
  },
  "lunch": {
    "name": "Meal name",
    "emoji": "🥗",
    "kcal": 500,
    "protein": 20,
    "carbs": 55,
    "fat": 15,
    "gi": "Medium",
    "reason": "Why this is good for lunch"
  },
  "snack": {
    "name": "Snack name",
    "emoji": "🍎",
    "kcal": 200,
    "protein": 5,
    "carbs": 25,
    "fat": 8,
    "gi": "Low",
    "reason": "Why this is good as a snack"
  },
  "dinner": {
    "name": "Meal name",
    "emoji": "🍽️",
    "kcal": 450,
    "protein": 18,
    "carbs": 40,
    "fat": 14,
    "gi": "Low",
    "reason": "Why this is good for dinner"
  },
  "hydration": {
    "target": "2.5 liters",
    "tip": "Drink water throughout the day"
  }
}`;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      const mockPlan = {
        breakfast: {
          name: "Masala Dosa",
          emoji: "🥞",
          kcal: 350,
          protein: 8,
          carbs: 45,
          fat: 15,
          gi: "Medium",
          reason: "Fermented batter provides probiotics",
        },
        lunch: {
          name: "Vegetable Pulao",
          emoji: "🍚",
          kcal: 380,
          protein: 9,
          carbs: 55,
          fat: 12,
          gi: "Medium",
          reason: "Balanced mix of rice and vegetables",
        },
        snack: {
          name: "Fruit and Nuts",
          emoji: "🍎",
          kcal: 200,
          protein: 5,
          carbs: 25,
          fat: 10,
          gi: "Low",
          reason: "Quick energy boost",
        },
        dinner: {
          name: "Vegetable Soup",
          emoji: "🥣",
          kcal: 250,
          protein: 6,
          carbs: 30,
          fat: 8,
          gi: "Low",
          reason: "Light and easily digestible",
        },
        hydration: { target: "2.5 liters", tip: "Drink water every hour" },
      };
      res.json(mockPlan);
      return;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 45000,
      },
    );

    let text = response.data.choices[0].message.content;
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const plan = JSON.parse(text);
    res.json(plan);
  } catch (err) {
    console.error("Full day plan error:", err.message);
    const fallback = {
      breakfast: {
        name: "Oatmeal with Fruits",
        emoji: "🥣",
        kcal: 350,
        protein: 10,
        carbs: 50,
        fat: 8,
        gi: "Low",
        reason: "Sustained energy release",
      },
      lunch: {
        name: "Grilled Chicken Salad",
        emoji: "🥗",
        kcal: 450,
        protein: 30,
        carbs: 25,
        fat: 18,
        gi: "Low",
        reason: "Lean protein for muscle health",
      },
      snack: {
        name: "Greek Yogurt",
        emoji: "🥄",
        kcal: 150,
        protein: 15,
        carbs: 10,
        fat: 5,
        gi: "Low",
        reason: "Probiotics and protein",
      },
      dinner: {
        name: "Steamed Fish with Vegetables",
        emoji: "🐟",
        kcal: 400,
        protein: 35,
        carbs: 20,
        fat: 15,
        gi: "Low",
        reason: "Omega-3 fatty acids",
      },
      hydration: { target: "2.5 liters", tip: "Add lemon to your water" },
    };
    res.json(fallback);
  }
});

/* ─────────────────────────────────────────
   AI Chat - FORCED JSON OUTPUT
───────────────────────────────────────── */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    let prompt = messages.map((m) => m.content).join("\n");

    prompt += `

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION:
═══════════════════════════════════════════════════════════════
Return ONLY valid JSON with: meal_options (array), exercise (object), hydration (object)
Start DIRECTLY with { and end with }.

Example format:
{
  "meal_options": [...],
  "exercise": {...},
  "hydration": {...}
}`;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      const mockResponse = {
        meal_options: [
          {
            name: "Masala Dosa",
            emoji: "🥞",
            kcal: 350,
            protein: 8,
            carbs: 45,
            fat: 15,
            gi: "Medium",
            gl: 18,
            key_nutrient: "Fermented",
            best_time: "Morning",
            reason: "Probiotic-rich",
            ingredients: ["Rice", "Urad dal", "Potato"],
          },
        ],
        exercise: {
          type: "Brisk Walking",
          duration: "25 minutes",
          intensity: "Moderate",
          description: "Walk at steady pace",
          best_time: "Morning",
          reason: "Improves cardiovascular health",
        },
        hydration: {
          target: "2.5 liters",
          reminder: "Drink water every hour",
          electrolytes: "Add lemon to water",
        },
      };
      res.json({
        content: [{ type: "text", text: JSON.stringify(mockResponse) }],
      });
      return;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 60000,
      },
    );

    let text = response.data.choices[0].message.content;
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Chat error:", err.message);
    const fallback = {
      meal_options: [
        {
          name: "Balanced Meal",
          emoji: "🍽️",
          kcal: 400,
          protein: 20,
          carbs: 45,
          fat: 15,
          gi: "Medium",
          gl: 15,
          key_nutrient: "Balanced",
          best_time: "Meal time",
          reason: "Balanced nutrition",
          ingredients: ["Vegetables", "Protein", "Grains"],
        },
      ],
      exercise: {
        type: "Light Activity",
        duration: "15 minutes",
        intensity: "Low",
        description: "Gentle movement",
        best_time: "Any time",
        reason: "Good for health",
      },
      hydration: {
        target: "2 liters",
        reminder: "Drink water regularly",
        electrolytes: "Add lemon",
      },
    };
    res.json({ content: [{ type: "text", text: JSON.stringify(fallback) }] });
  }
});

/* ─────────────────────────────────────────
   FOOD SCAN & NUTRITION API - ENDPOINTS
───────────────────────────────────────── */

app.get("/api/foods-list", (req, res) => {
  const foods = Object.keys(nutritionDatabase).slice(0, 50);
  res.json({ count: Object.keys(nutritionDatabase).length, samples: foods });
});

// Scan food endpoint
app.post("/api/scan-food", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    console.log(`📸 Processing image: ${imagePath}`);

    let predictedFood = await new Promise((resolve, reject) => {
      // ✅ FIXED: Use environment variable for Python path
      const pythonProcess = spawn(process.env.PYTHON_PATH || "python3", [
        path.join(__dirname, "predict_food.py"),
        imagePath,
      ]);

      let output = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`Python exited with code ${code}: ${error}`);
          reject(new Error(error || "Prediction failed"));
        } else {
          const predicted = output.trim().toLowerCase();
          console.log(`✅ Raw predicted: ${predicted}`);
          resolve(predicted);
        }
      });
    });

    let isFromAI = false;
    let identifiedBy = "model";

    if (predictedFood === "unknown") {
      console.log("⚠️ Model returned 'unknown', falling back to AI Vision...");

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      const GROQ_API_KEY = process.env.GROQ_API_KEY;

      if (GROQ_API_KEY && GROQ_API_KEY !== "your_groq_api_key_here") {
        try {
          const visionResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Identify this food. Return only the food name in lowercase.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`,
                      },
                    },
                  ],
                },
              ],
              max_tokens: 100,
              temperature: 0.3,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
              },
              timeout: 30000,
            },
          );

          let aiIdentified = visionResponse.data.choices[0].message.content
            .trim()
            .toLowerCase();
          aiIdentified = aiIdentified.replace(/[^\w\s]/g, "").trim();

          if (
            aiIdentified &&
            aiIdentified !== "unknown" &&
            aiIdentified.length > 2
          ) {
            predictedFood = aiIdentified;
            isFromAI = true;
            identifiedBy = "ai-vision";
            console.log(`🔍 AI Vision identified: ${predictedFood}`);
          }
        } catch (visionError) {
          console.error("AI Vision error:", visionError.message);
        }
      }
    }

    try {
      fs.unlinkSync(imagePath);
    } catch (e) {}

    const nameMapping = {
      idly: "idli",
      vada_pav: "vada pav",
      chappati: "chapati",
    };

    let mappedFood = nameMapping[predictedFood] || predictedFood;

    let nutrition = nutritionDatabase[mappedFood];

    if (!nutrition) {
      const matchingKey = Object.keys(nutritionDatabase).find(
        (key) => key.toLowerCase() === mappedFood.toLowerCase(),
      );
      if (matchingKey) nutrition = nutritionDatabase[matchingKey];
    }

    // Step 5: If still no nutrition data, generate AI nutrition for unknown food
    let aiGeneratedNutrition = null;
    if (!nutrition && isFromAI) {
      console.log(`🤖 Generating AI nutrition for: ${mappedFood}`);
      const GROQ_API_KEY = process.env.GROQ_API_KEY;

      if (GROQ_API_KEY && GROQ_API_KEY !== "your_groq_api_key_here") {
        try {
          const nutritionPrompt = `You are a nutrition expert. Provide estimated nutrition facts for "${mappedFood}".
Return ONLY valid JSON with these fields: calories, protein, carbs, fat, fiber, sugar, gi.
Values should be realistic for a standard 100g serving.
Example: {"calories": 250, "protein": 8, "carbs": 35, "fat": 10, "fiber": 4, "sugar": 5, "gi": "Medium"}`;

          const nutritionResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: nutritionPrompt }],
              max_tokens: 200,
              temperature: 0.5,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
              },
              timeout: 15000,
            },
          );

          let nutritionText = nutritionResponse.data.choices[0].message.content;
          nutritionText = nutritionText.replace(/```json|```/g, "").trim();
          const jsonMatch = nutritionText.match(/\{[\s\S]*\}/);
          if (jsonMatch) nutritionText = jsonMatch[0];

          const generatedNutrition = JSON.parse(nutritionText);
          aiGeneratedNutrition = {
            calories: generatedNutrition.calories || 250,
            protein: generatedNutrition.protein || 10,
            carbs: generatedNutrition.carbs || 30,
            fat: generatedNutrition.fat || 12,
            fiber: generatedNutrition.fiber || 3,
            sugar: generatedNutrition.sugar || 4,
            gi: generatedNutrition.gi || "Medium",
            unit: "100g",
            aiGenerated: true, // This flag tells frontend it's AI-generated
          };
          console.log("✅ AI generated nutrition data for:", mappedFood);
        } catch (genError) {
          console.error("AI nutrition generation error:", genError.message);
        }
      }
    }

    // Use AI generated nutrition if available
    if (!nutrition && aiGeneratedNutrition) {
      nutrition = aiGeneratedNutrition;
    }

    if (!nutrition) {
      nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        gi: "Medium",
        unit: "100g",
        notFound: true,
      };
      console.log(`⚠️ No nutrition data found for: ${mappedFood}`);
    }

    res.json({
      success: true,
      foodName: mappedFood,
      originalPrediction: predictedFood,
      identifiedBy: identifiedBy,
      isGeneratedByAI: isFromAI,
      nutrition: nutrition,
    });
  } catch (error) {
    console.error("Scan food error:", error.message);
    try {
      if (req.file) fs.unlinkSync(req.file.path);
    } catch (e) {}
    res.status(500).json({ error: error.message });
  }
});

// Search food endpoint
app.get("/api/search-food", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query)
      return res.status(400).json({ error: "Query parameter required" });

    const searchTerm = query.toLowerCase().trim();
    const matches = Object.keys(nutritionDatabase)
      .filter((name) => name.includes(searchTerm))
      .slice(0, 10)
      .map((name) => ({ name: name, nutrition: nutritionDatabase[name] }));

    let exactMatch = null;
    if (nutritionDatabase[searchTerm]) {
      exactMatch = {
        name: searchTerm,
        nutrition: nutritionDatabase[searchTerm],
      };
    } else if (matches.length > 0) {
      exactMatch = matches[0];
    }

    res.json({
      success: true,
      exactMatch: exactMatch,
      suggestions: matches.filter((m) => m.name !== exactMatch?.name),
    });
  } catch (error) {
    console.error("Search food error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Food AI recommendation endpoint
app.post("/api/food-ai-recommendation", async (req, res) => {
  try {
    const { foodName, nutrition, userProfile, vitals } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    const prompt = `Analyze ${foodName} for this user.

Nutrition: ${JSON.stringify(nutrition)}
Goal: ${userProfile?.goal}
Vitals: HR ${vitals?.hr} BPM, Stress ${vitals?.stress}

Return JSON: {"verdict":"GOOD/MODERATE/AVOID","glycemicImpact":65,"glycemicLabel":"Fair","keyNutrients":["Nutrient1","Nutrient2"],"bestTime":"Best time","portionSuggestion":"Portion","pairing":"Pairing","reason":"Explanation"}`;

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      return res.json({
        verdict: "MODERATE",
        glycemicImpact: 65,
        glycemicLabel: "Fair",
        keyNutrients: ["Fiber", "Protein"],
        bestTime: "Any time",
        portionSuggestion: "Standard serving",
        pairing: "With vegetables",
        reason: `${foodName} can be part of a balanced diet.`,
      });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000,
      },
    );

    let text = response.data.choices[0].message.content;
    text = text.replace(/```json|```/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json(aiResponse);
  } catch (err) {
    console.error("Food AI error:", err.message);
    res.json({
      verdict: "MODERATE",
      glycemicImpact: 60,
      glycemicLabel: "Fair",
      keyNutrients: ["Fiber", "Protein"],
      bestTime: "Any time",
      portionSuggestion: "Standard serving",
      pairing: "With balanced meal",
      reason: "AI recommendation temporarily unavailable.",
    });
  }
});

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve React App
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 NutriSync server running on port ${PORT}`);
  console.log(
    `📊 CSV loaded: ${Object.keys(nutritionDatabase).length} food items`,
  );
  console.log(`🔬 Python model: ready`);
  console.log(`🤖 AI Vision: enabled`);
  console.log(`📸 Food images: Spoonacular + Unsplash fallback`);
});
