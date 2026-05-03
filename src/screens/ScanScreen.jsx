// ─── ScanScreen.jsx ─────────────────────────────────────────────
import { useState, useRef } from "react";
import { storage } from "../utils/storage";

export default function ScanScreen({ vitals, onNavigate }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const fileInputRef = useRef(null);

  const profile = storage.getProfile();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
      scanImage(file);
    }
  };

  const scanImage = async (file) => {
    setScanning(true);
    setResult(null);
    setAiResponse(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:5000/api/scan-food", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        console.error("Scan failed:", data.error);
        setResult({ error: data.error || "Failed to detect food" });
      }
    } catch (error) {
      console.error("Scan error:", error);
      setResult({
        error: "Connection error. Make sure backend is running on port 5000",
      });
    }
    setScanning(false);
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults(null);
    setResult(null);
    setAiResponse(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/search-food?query=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();

      if (data.success && data.exactMatch) {
        setResult({
          success: true,
          foodName: data.exactMatch.name,
          nutrition: data.exactMatch.nutrition,
          isSearchResult: true,
          identifiedBy: "search",
        });
        setSearchResults(data.suggestions);
      } else {
        setResult({ error: `No nutrition data found for "${searchQuery}"` });
      }
    } catch (error) {
      console.error("Search error:", error);
      setResult({
        error: "Search failed. Make sure backend is running on port 5000",
      });
    }
    setSearching(false);
  };

  const getAIRecommendation = async () => {
    if (!result || !result.foodName) return;

    setLoadingAI(true);
    setAiResponse(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/food-ai-recommendation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: result.foodName,
            nutrition: result.nutrition,
            userProfile: profile,
            vitals: vitals,
          }),
        },
      );
      const data = await response.json();
      setAiResponse(data);
    } catch (error) {
      console.error("AI error:", error);
      setAiResponse({
        error: "AI recommendation failed",
        verdict: "MODERATE",
        reason: "AI service unavailable",
      });
    }
    setLoadingAI(false);
  };

  const getVerdictColor = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case "good":
        return "var(--accent2)";
      case "moderate":
        return "var(--accent)";
      case "avoid":
        return "var(--red)";
      default:
        return "var(--text-muted)";
    }
  };

  const getGlycemicLabelColor = (label) => {
    switch (label?.toLowerCase()) {
      case "excellent":
        return "var(--accent2)";
      case "good":
        return "var(--accent)";
      case "fair":
        return "var(--orange)";
      case "poor":
        return "var(--red)";
      default:
        return "var(--text-muted)";
    }
  };

  const logToDiary = () => {
    if (!result || !result.foodName) return;

    const user = storage.getUser();
    const mealEntry = {
      name: result.foodName,
      emoji: result.isGeneratedByAI ? "🤖" : "📷",
      kcal: result.nutrition?.calories || 0,
      protein: result.nutrition?.protein || 0,
      carbs: result.nutrition?.carbs || 0,
      fat: result.nutrition?.fat || 0,
      gi: result.nutrition?.gi || "Medium",
      mealType: "Snack",
    };

    storage.addMeal(user?.uid, mealEntry);
    alert(`✅ ${result.foodName} added to diary!`);
  };

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
            Food Scanner
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
          Scan or search
          <br />
          <span style={{ color: "var(--accent)" }}>any food 🍽️</span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 6,
            fontWeight: 300,
          }}
        >
          AI-powered food recognition + nutrition insights
        </div>
      </div>

      {/* Scan Section */}
      <div style={{ margin: "20px 24px 0" }}>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            border: "1px solid var(--card-border)",
            padding: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Take a photo of your food
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Upload an image to identify the food item
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />

          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            style={{ marginBottom: 12 }}
          >
            {scanning ? "📡 Scanning..." : "📸 Scan Food"}
          </button>

          {selectedImage && !scanning && (
            <div style={{ marginTop: 16 }}>
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 16,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* OR Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          margin: "14px 24px",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "var(--font-head)",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          or
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
      </div>

      {/* Search Section */}
      <div style={{ margin: "0 24px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search for any food (e.g., 'pizza', 'apple')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchFood()}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={searchFood}
            disabled={searching}
            style={{ width: "auto", padding: "0 20px" }}
          >
            {searching ? "🔍" : "Search"}
          </button>
        </div>

        {searchResults && searchResults.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "var(--font-head)",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Did you mean?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {searchResults.map((s, i) => (
                <div
                  key={i}
                  className="pill"
                  onClick={() => {
                    setSearchQuery(s.name);
                    searchFood();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div className="animate-up" style={{ margin: "14px 24px 0" }}>
          {result.error ? (
            <div
              style={{
                background: "rgba(255,94,94,0.08)",
                border: "1px solid rgba(255,94,94,0.25)",
                borderRadius: 16,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-head)",
                  fontWeight: 700,
                  color: "var(--red)",
                  marginBottom: 8,
                }}
              >
                Not Found
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {result.error}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 20,
                border: "1px solid var(--card-border)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontFamily: "var(--font-head)",
                      fontWeight: 800,
                    }}
                  >
                    {result.foodName}
                  </div>
                  {result.isGeneratedByAI && (
                    <div
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(182,245,66,0.2)",
                        color: "var(--accent)",
                      }}
                    >
                      🤖 AI Identified
                    </div>
                  )}
                </div>

                {/* Nutrition Facts */}
                {result.nutrition && !result.nutrition.notFound ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        {
                          label: "Calories",
                          value: result.nutrition.calories,
                          unit: "kcal",
                          color: "var(--accent)",
                        },
                        {
                          label: "Protein",
                          value: result.nutrition.protein,
                          unit: "g",
                          color: "var(--accent2)",
                        },
                        {
                          label: "Carbs",
                          value: result.nutrition.carbs,
                          unit: "g",
                          color: "var(--accent)",
                        },
                        {
                          label: "Fat",
                          value: result.nutrition.fat,
                          unit: "g",
                          color: "var(--orange)",
                        },
                        {
                          label: "Fiber",
                          value: result.nutrition.fiber || 0,
                          unit: "g",
                          color: "var(--text-muted)",
                        },
                        {
                          label: "Sugar",
                          value: result.nutrition.sugar || 0,
                          unit: "g",
                          color: "var(--text-muted)",
                        },
                      ].map((n) => (
                        <div
                          key={n.label}
                          style={{
                            background: "var(--surface2)",
                            borderRadius: 12,
                            padding: "10px",
                            textAlign: "center",
                            border: "1px solid var(--card-border)",
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
                            {n.label}
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontFamily: "var(--font-head)",
                              fontWeight: 800,
                              color: n.color,
                            }}
                          >
                            {n.value}
                          </div>
                          <div
                            style={{ fontSize: 8, color: "var(--text-muted)" }}
                          >
                            {n.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <div
                        style={{
                          flex: 1,
                          background: "rgba(182,245,66,0.08)",
                          borderRadius: 10,
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 7,
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-head)",
                            fontWeight: 700,
                          }}
                        >
                          GI Value
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontFamily: "var(--font-head)",
                            fontWeight: 800,
                            color:
                              result.nutrition.gi === "Low"
                                ? "var(--accent2)"
                                : result.nutrition.gi === "Medium"
                                  ? "var(--accent)"
                                  : "var(--red)",
                          }}
                        >
                          {result.nutrition.gi}
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: "rgba(76,255,176,0.08)",
                          borderRadius: 10,
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 7,
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-head)",
                            fontWeight: 700,
                          }}
                        >
                          Serving Size
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-head)",
                            fontWeight: 800,
                            color: "var(--accent2)",
                          }}
                        >
                          {result.nutrition.unit || "100g"}
                        </div>
                      </div>
                    </div>

                    {result.nutrition.aiGenerated && (
                      <div
                        style={{
                          background: "rgba(182,245,66,0.08)",
                          borderRadius: 8,
                          padding: 8,
                          marginBottom: 12,
                          textAlign: "center",
                          fontSize: 10,
                          color: "var(--accent)",
                        }}
                      >
                        🤖 Nutrition data AI-estimated
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      background: "rgba(255,179,71,0.08)",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                      textAlign: "center",
                      fontSize: 12,
                      color: "var(--orange)",
                    }}
                  >
                    ⚠️ Limited nutrition data available for this food
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={getAIRecommendation}
                    disabled={loadingAI}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      background: loadingAI ? "var(--surface2)" : undefined,
                    }}
                  >
                    {loadingAI ? "🤖 Thinking..." : "✨ Get AI Insight"}
                  </button>
                  <button
                    onClick={logToDiary}
                    className="btn-outline"
                    style={{ flex: 1 }}
                  >
                    📓 Log to Diary
                  </button>
                </div>

                {/* AI Recommendation Response - Enhanced */}
                {aiResponse && (
                  <div
                    style={{
                      marginTop: 16,
                      background: "var(--surface2)",
                      borderRadius: 16,
                      padding: 16,
                      borderLeft: `3px solid ${getVerdictColor(aiResponse.verdict)}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-head)",
                          fontWeight: 800,
                          color: getVerdictColor(aiResponse.verdict),
                          textTransform: "uppercase",
                        }}
                      >
                        {aiResponse.verdict || "MODERATE"}
                      </span>
                      <span
                        style={{ fontSize: 10, color: "var(--text-muted)" }}
                      >
                        Recommendation
                      </span>
                    </div>

                    {/* Glycemic Impact Score */}
                    {aiResponse.glycemicImpact && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                          padding: "8px 12px",
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-head)",
                              fontWeight: 700,
                            }}
                          >
                            Glycemic Impact
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontFamily: "var(--font-head)",
                              fontWeight: 800,
                              color: getGlycemicLabelColor(
                                aiResponse.glycemicLabel,
                              ),
                            }}
                          >
                            {aiResponse.glycemicImpact}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--font-head)",
                            fontWeight: 700,
                            color: getGlycemicLabelColor(
                              aiResponse.glycemicLabel,
                            ),
                          }}
                        >
                          /{aiResponse.glycemicLabel || "Fair"}
                        </div>
                      </div>
                    )}

                    {/* Key Nutrients */}
                    {aiResponse.keyNutrients &&
                      aiResponse.keyNutrients.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-head)",
                              fontWeight: 700,
                              marginBottom: 6,
                            }}
                          >
                            KEY NUTRIENTS
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {aiResponse.keyNutrients.map((nutrient, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 11,
                                  padding: "4px 10px",
                                  background: "rgba(76,255,176,0.1)",
                                  borderRadius: 100,
                                  color: "var(--accent2)",
                                }}
                              >
                                {nutrient}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        lineHeight: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      {aiResponse.reason || "AI analysis complete."}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 8,
                      }}
                    >
                      {aiResponse.bestTime && (
                        <div
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            background: "rgba(182,245,66,0.1)",
                            borderRadius: 100,
                            color: "var(--accent)",
                          }}
                        >
                          ⏰ {aiResponse.bestTime}
                        </div>
                      )}
                      {aiResponse.portionSuggestion && (
                        <div
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            background: "rgba(76,255,176,0.1)",
                            borderRadius: 100,
                            color: "var(--accent2)",
                          }}
                        >
                          🥄 {aiResponse.portionSuggestion}
                        </div>
                      )}
                      {aiResponse.pairing && (
                        <div
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            background: "rgba(255,179,71,0.1)",
                            borderRadius: 100,
                            color: "var(--orange)",
                          }}
                        >
                          🍽️ {aiResponse.pairing}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
