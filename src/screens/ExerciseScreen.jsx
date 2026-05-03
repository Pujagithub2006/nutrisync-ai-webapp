// ─── ExerciseScreen.jsx ───────────────────────────────────────
import { useState } from "react";
import { storage } from "../utils/storage";

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "12px 0",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
        Analysing your body data…
      </span>
    </div>
  );
}

const INTENSITY = ["Light", "Moderate", "Intense"];

// Fallback exercises when API fails
function getFallbackExercises(intensity, vitals) {
  const isHighStress = vitals?.stress === "High";
  const isHighHR = (vitals?.hr || 0) > 85;
  const isLowSteps = (vitals?.steps || 0) < 3000;

  if (isHighStress) {
    return [
      {
        name: "Deep Breathing Exercise",
        emoji: "🧘",
        duration: "10 minutes",
        sets: "3 sets of 10 breaths",
        calories_burned: 30,
        intensity: "Light",
        muscle_group: "Respiratory",
        reason:
          "Deep breathing activates the parasympathetic nervous system, reducing stress hormones and lowering heart rate.",
        steps: [
          "Sit comfortably with spine straight",
          "Inhale deeply through nose for 4 seconds",
          "Hold breath for 4 seconds",
          "Exhale slowly through mouth for 6 seconds",
          "Repeat 10 times",
        ],
      },
    ];
  }

  if (isHighHR) {
    return [
      {
        name: "Gentle Walking",
        emoji: "🚶",
        duration: "15 minutes",
        sets: "1 session",
        calories_burned: 60,
        intensity: "Light",
        muscle_group: "Full Body",
        reason:
          "Light walking helps lower elevated heart rate while maintaining gentle movement for circulation.",
        steps: [
          "Start with slow pace for 2 minutes",
          "Maintain comfortable walking speed",
          "Focus on deep breathing",
          "Cool down with slow walk for 2 minutes",
        ],
      },
    ];
  }

  if (isLowSteps) {
    return [
      {
        name: "Brisk Walking",
        emoji: "🏃",
        duration: "20 minutes",
        sets: "1 session",
        calories_burned: 100,
        intensity: "Moderate",
        muscle_group: "Legs + Cardio",
        reason:
          "Walking increases daily step count and improves cardiovascular health at a safe intensity.",
        steps: [
          "Warm up with slow walk for 2 minutes",
          "Increase pace to brisk walking",
          "Maintain steady pace for 15 minutes",
          "Cool down with slow walk for 3 minutes",
        ],
      },
    ];
  }

  const exercises = {
    Light: [
      {
        name: "Morning Stretch Routine",
        emoji: "🧘",
        duration: "10 minutes",
        sets: "1 set",
        calories_burned: 40,
        intensity: "Light",
        muscle_group: "Full Body",
        reason:
          "Light stretching improves flexibility and blood flow without straining the body.",
        steps: [
          "Neck rolls - 30 seconds",
          "Shoulder stretches - 1 minute",
          "Torso twists - 1 minute",
          "Hamstring stretches - 2 minutes each leg",
          "Full body stretch - 2 minutes",
        ],
      },
    ],
    Moderate: [
      {
        name: "Bodyweight Circuit",
        emoji: "💪",
        duration: "20 minutes",
        sets: "3 sets x 12 reps",
        calories_burned: 150,
        intensity: "Moderate",
        muscle_group: "Full Body",
        reason:
          "Bodyweight exercises build functional strength and improve cardiovascular fitness.",
        steps: [
          "10 squats",
          "10 push-ups (knee or full)",
          "10 lunges each leg",
          "30 second plank hold",
          "Rest 30 seconds between exercises",
        ],
      },
    ],
    Intense: [
      {
        name: "HIIT Workout",
        emoji: "⚡",
        duration: "15 minutes",
        sets: "30s work / 15s rest",
        calories_burned: 200,
        intensity: "Intense",
        muscle_group: "Full Body",
        reason:
          "High-intensity interval training maximizes calorie burn and cardiovascular fitness in minimal time.",
        steps: [
          "30 sec jumping jacks",
          "15 sec rest",
          "30 sec mountain climbers",
          "15 sec rest",
          "30 sec burpees",
          "15 sec rest",
          "30 sec high knees",
          "Repeat 3 times",
        ],
      },
    ],
  };

  return exercises[intensity] || exercises.Moderate;
}

function extractJSONFromText(text) {
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) cleaned = jsonMatch[0];
  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
  return cleaned;
}

export default function ExerciseScreen({ vitals }) {
  const [intensity, setIntensity] = useState("Moderate");
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState([]);

  const profile = storage.getProfile();

  async function generate() {
    setLoading(true);
    setExercises([]);
    setError("");

    const diseases =
      profile?.diseases?.filter((d) => d !== "None").join(", ") || "None";
    const diary = storage.getDiary();
    const todayKcal = diary.reduce((a, m) => a + (m.kcal || 0), 0);

    const prompt = `You are NutriSync AI's personal fitness coach.

USER PROFILE:
- Age: ${profile?.age || 30}
- Gender: ${profile?.gender || "Not specified"}
- Weight: ${profile?.weight || 70}kg
- Height: ${profile?.height || 170}cm
- Fitness Goal: ${profile?.goal || "balance"}
- Activity Level: ${profile?.activity || "Moderately Active"}
- Medical Conditions: ${diseases}

LIVE PHYSIOLOGICAL DATA:
- Heart Rate: ${Math.round(vitals?.hr || 75)} BPM
- SpO2: ${(vitals?.spo2 || 97).toFixed(1)}%
- HRV: ${(vitals?.hrv || 60).toFixed(1)}ms
- Stress: ${vitals?.stress || "Moderate"}
- Steps today: ${vitals?.steps || 0}
- Activity: ${vitals?.activity || "Moderate"}

TODAY'S NUTRITION:
- Calories consumed: ${todayKcal} kcal

EXERCISE REQUEST:
- Preferred intensity: ${intensity}

RULES:
1. Return ONLY exercises - NO food, NO meals, NO recipes
2. If HR > 85, suggest light/recovery exercises
3. If stress is High, suggest yoga/breathing exercises
4. If steps < 3000, suggest walking/cardio

Return ONLY valid JSON array of exercises:`;

    try {
      // USE THE NEW EXERCISE ENDPOINT
      const res = await fetch("http://localhost:5000/api/exercise-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      let text = data.content?.map((b) => b.text || "").join("") || "";
      console.log("Raw AI response:", text);

      const cleanedText = extractJSONFromText(text);
      let parsed = JSON.parse(cleanedText);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("No exercises returned");
      }

      setExercises(parsed);
    } catch (e) {
      console.error("Exercise generation error:", e);
      const fallbackExercises = getFallbackExercises(intensity, vitals);
      setExercises(fallbackExercises);
      setError("Using recommended exercises. " + e.message);
    }
    setLoading(false);
  }

  const intensityColor = (i) =>
    i === "Light"
      ? "var(--accent2)"
      : i === "Moderate"
        ? "var(--accent)"
        : "var(--red)";

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: "48px 24px 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(182,245,66,0.1)",
            border: "1px solid rgba(182,245,66,0.2)",
            borderRadius: 100,
            padding: "5px 12px",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
              animation: "pulseDot 1.4s infinite",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            AI Fitness Coach
          </span>
        </div>
        <div
          style={{
            fontSize: 24,
            fontFamily: "var(--font-head)",
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          Exercises for
          <br />
          <span style={{ color: "var(--accent)" }}>your body, right now</span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 6,
            fontWeight: 300,
          }}
        >
          Based on your live vitals + today's nutrition
        </div>
      </div>

      {/* Live vitals context */}
      <div
        style={{
          margin: "14px 24px 0",
          padding: "12px 14px",
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid var(--card-border)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--font-head)",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          Current Body State
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[
            {
              label: `❤️ ${Math.round(vitals?.hr || 75)} BPM`,
              hi: (vitals?.hr || 0) > 85,
            },
            { label: `🫁 SpO₂ ${(vitals?.spo2 || 97).toFixed(1)}%`, hi: true },
            { label: `👟 ${(vitals?.steps || 0).toLocaleString()} steps` },
            {
              label: `🧠 Stress: ${vitals?.stress || "Moderate"}`,
              hi: vitals?.stress === "High",
            },
            { label: `⚡ ${vitals?.activity || "Moderate"} activity` },
          ].map((c) => (
            <div
              key={c.label}
              className={`pill ${c.hi ? "selected" : ""}`}
              style={{ cursor: "default" }}
            >
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Smart suggestion banner */}
      {(vitals?.hr || 0) > 85 && (
        <div
          style={{
            margin: "10px 24px 0",
            padding: "10px 14px",
            background: "rgba(255,179,71,0.08)",
            border: "1px solid rgba(255,179,71,0.25)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--orange)",
          }}
        >
          ⚠️ Your HR is elevated. Light or recovery exercises recommended.
        </div>
      )}
      {vitals?.stress === "High" && (
        <div
          style={{
            margin: "10px 24px 0",
            padding: "10px 14px",
            background: "rgba(255,94,94,0.08)",
            border: "1px solid rgba(255,94,94,0.25)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--red)",
          }}
        >
          🧘 High stress detected. Yoga or breathing exercises recommended.
        </div>
      )}
      {(vitals?.steps || 0) < 3000 && (
        <div
          style={{
            margin: "10px 24px 0",
            padding: "10px 14px",
            background: "rgba(76,255,176,0.08)",
            border: "1px solid rgba(76,255,176,0.25)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--accent2)",
          }}
        >
          🚶 Low step count. A brisk walk would be great right now.
        </div>
      )}

      {/* Intensity selector */}
      <div style={{ margin: "14px 24px 0", display: "flex", gap: 8 }}>
        {INTENSITY.map((t) => (
          <div
            key={t}
            onClick={() => {
              setIntensity(t);
              setExercises([]);
            }}
            style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: 14,
              textAlign: "center",
              border: `1px solid ${intensity === t ? "rgba(182,245,66,0.5)" : "var(--card-border)"}`,
              background:
                intensity === t ? "rgba(182,245,66,0.1)" : "var(--surface)",
              color: intensity === t ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div style={{ margin: "14px 24px 0" }}>
        <button
          className="btn-primary"
          onClick={generate}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div className="spinner" /> Generating plan…
            </>
          ) : (
            "💪 Generate Exercise Plan"
          )}
        </button>
      </div>

      {loading && (
        <div style={{ padding: "0 24px" }}>
          <TypingDots />
        </div>
      )}

      {error && (
        <div
          style={{
            margin: "14px 24px 0",
            background: "rgba(255,94,94,0.08)",
            border: "1px solid rgba(255,94,94,0.25)",
            borderRadius: 14,
            padding: "12px 16px",
            fontSize: 12,
            color: "var(--red)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Exercise cards */}
      {exercises.map((ex, i) => {
        const isDone = done.includes(ex.name);
        return (
          <div
            key={i}
            className="animate-up"
            style={{
              margin: "12px 24px 0",
              background: "var(--surface)",
              borderRadius: 20,
              border: `1px solid ${isDone ? "rgba(182,245,66,0.4)" : "var(--card-border)"}`,
              padding: 18,
              animationDelay: `${i * 0.08}s`,
              opacity: isDone ? 0.7 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-head)",
                      fontWeight: 700,
                      color: intensityColor(ex.intensity),
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: `rgba(182,245,66,0.08)`,
                      padding: "2px 8px",
                      borderRadius: 100,
                    }}
                  >
                    {ex.intensity}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-head)",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: "var(--surface2)",
                      padding: "2px 8px",
                      borderRadius: 100,
                    }}
                  >
                    {ex.muscle_group}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontFamily: "var(--font-head)",
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  {ex.name}
                </div>
              </div>
              <div style={{ fontSize: 36, marginLeft: 8 }}>
                {ex.emoji || "💪"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[
                { label: "Duration", val: ex.duration, color: "var(--accent)" },
                { label: "Sets", val: ex.sets, color: "var(--accent2)" },
                {
                  label: "Burns",
                  val: `${ex.calories_burned} kcal`,
                  color: "var(--orange)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    background: "var(--surface2)",
                    borderRadius: 10,
                    padding: "8px 4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 7,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-head)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-head)",
                      fontWeight: 800,
                      color: s.color,
                      marginTop: 2,
                    }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.55,
                marginBottom: 12,
                background: "var(--surface2)",
                borderRadius: 10,
                padding: "10px 12px",
                borderLeft: "2px solid var(--accent)",
              }}
            >
              💡 {ex.reason}
            </div>

            {ex.steps && ex.steps.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-head)",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  How to do it
                </div>
                {ex.steps.map((step, si) => (
                  <div
                    key={si}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(182,245,66,0.15)",
                        border: "1px solid rgba(182,245,66,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontFamily: "var(--font-head)",
                        fontWeight: 800,
                        color: "var(--accent)",
                        flexShrink: 0,
                      }}
                    >
                      {si + 1}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        paddingTop: 2,
                      }}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => !isDone && setDone((d) => [...d, ex.name])}
              disabled={isDone}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: "none",
                background: isDone
                  ? "rgba(182,245,66,0.1)"
                  : "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: isDone ? "var(--accent)" : "var(--bg)",
                fontFamily: "var(--font-head)",
                fontWeight: 800,
                fontSize: 13,
                cursor: isDone ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isDone ? "✓ Done!" : "💪 Mark as Done"}
            </button>
          </div>
        );
      })}

      <div style={{ height: 20 }} />
    </div>
  );
}
