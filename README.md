<div align="center">

# NutriSync AI
### Real-Time Physiological Nutrition Recommendation System

AI-powered nutrition platform that generates **personalized meals, hydration, and exercise plans** based on **live physiological signals and metabolic health indicators.**

Instead of recommending generic calorie-based diets, **NutriSync AI evaluates how food interacts with your body at that moment**, adapting nutrition strategies dynamically using health vitals and medical context.

Deployed Link - https://nutrisyncai.onrender.com/

</div>

---

## Why NutriSync?

Modern diet applications provide **static meal plans** that ignore real-time physiological signals such as heart rate, stress levels, or oxygen saturation.

However, metabolism is **dynamic**. The way the body processes food changes depending on stress, recovery state, physical activity, and medical conditions.

**NutriSync AI solves this problem by combining physiological data with AI-driven reasoning to generate personalized nutrition recommendations optimized for the user's metabolic state.**

---

## Problem Statement

Most nutrition platforms fail to incorporate **real-time physiological health data** when recommending meals.

As a result:

- Two users with identical calorie targets receive the same meals
- Medical risks such as diabetes are not properly considered
- Glycemic response of meals is ignored
- Nutrition plans fail to adapt to stress, fatigue, or recovery

This leads to **generic diet recommendations that may not align with the body’s metabolic needs.**

---

## Solution Overview

NutriSync AI creates a **real-time personalized nutrition ecosystem** that evaluates physiological parameters and generates optimized health plans using an AI recommendation engine.

Instead of simply counting calories, the system evaluates **how food will interact with the user's body based on their current physiological state.**

The platform:

1. Collects physiological and lifestyle signals
2. Computes a **dynamic metabolic health score**
3. Maps the user to a **health tier**
4. Generates personalized **nutrition, hydration, and exercise plans**

---

# Key Innovations

### 🔷 Dynamic Health Scoring Engine  
![Health Score](https://img.shields.io/badge/System-Dynamic%2010%20Parameter%20Health%20Score-blue)

NutriSync calculates a real-time health score using **ten physiological and behavioral parameters**:

- Heart Rate
- SpO₂
- HRV (Heart Rate Variability)
- Stress
- Step Count
- BMI
- Calorie Intake
- Medical Risk
- Goal Alignment
- Glycemic Index

The weights of these parameters **automatically redistribute based on medical conditions and real-time vitals**, ensuring the score always sums to **100**.

---

### 🔷 AI Nutrition Recommendation Engine  
![AI](https://img.shields.io/badge/AI-Groq%20LLM-purple)

The health score categorizes users into **five metabolic tiers**:

- Peak
- Optimal
- Balanced
- Risk
- Critical

Each tier generates a **different contextual prompt for the AI model**, fundamentally changing the nutrition strategy recommended.

---

### 🔷 Glycemic Impact Analysis  
![Metabolic Analysis](https://img.shields.io/badge/Model-Glycemic%20Impact%20Score-red)

Beyond traditional **Glycemic Index (GI)** and **Glycemic Load (GL)**, NutriSync computes a **Glycemic Impact Score** that considers:

- Protein buffering
- Fiber content
- Anti-spike ingredients
- Medical conditions
- Stress-driven cortisol–glucose interaction

Two meals with identical calories can produce **very different metabolic responses**, and the system explains why.

---

### 🔷 Wearable Ready Architecture  
![Integration](https://img.shields.io/badge/Integration-HealthKit%20%7C%20Google%20Fit-green)

The architecture is designed for **easy integration with wearable health devices**.

Currently simulated vitals can be replaced with real-time health data from:

- Apple HealthKit
- Google Fit
- Wearable fitness trackers

with minimal API changes.

---


The architecture supports **real-time personalization**, cloud synchronization, and future integration with wearable devices.

---

# Workflow

1. User creates an account and provides personal health details.
2. Physiological signals are collected from user inputs or wearable integrations.
3. The system computes a **dynamic health score** using ten parameters.
4. The score maps the user into a **metabolic health tier**.
5. A context-aware prompt is generated for the AI model.
6. The AI generates **meal recommendations, exercise suggestions, and hydration plans**.
7. Results are stored in the cloud and displayed on the user dashboard.

---

# Tech Stack

| Component | Technology | Purpose |
|-----------|------------|--------|
| Frontend | React.js | User interface and dashboard |
| Backend | Node.js + Express | API server and AI integration |
| AI Engine | Groq API (LLaMA 3.1) | Nutrition recommendation generation |
| Authentication | Firebase Authentication | User login and identity management |
| Database | Firebase Firestore | User profiles and food diary |
| Food Data | Spoonacular API | Food images and metadata |
| Config | dotenv | Environment variable management |

---

# Key Features

- Real-time personalized nutrition recommendations
- Dynamic metabolic health scoring
- AI-powered meal planning
- Glycemic impact analysis beyond GI/GL
- Integrated hydration and exercise planning
- Cloud-synced user profiles and food diaries
- Wearable-ready architecture

---

# Future Improvements

Planned enhancements for the system include:

- Integration with **Apple HealthKit and Google Fit**
- Support for **Continuous Glucose Monitoring (CGM) devices**
- Advanced ML models for metabolic prediction
- Micronutrient optimization
- Real-time nutrition alerts and recommendations

---

# Team

**Team DevNauts**

- Puja Nikam  
- Yash Kalaskar  
- Atharv Dubal  
- Shloka Pampattiwar  

---

# Attribution

| Tool / Library | Purpose |
|---------------|--------|
| React | Frontend UI framework |
| Create React App | Project scaffolding |
| Express.js | Backend server |
| Groq API | AI inference engine |
| Spoonacular API | Food images and metadata |
| Firebase Authentication | User authentication |
| Firebase Firestore | Cloud database |
| cors | Cross-origin request handling |
| dotenv | Environment variable management |

---
