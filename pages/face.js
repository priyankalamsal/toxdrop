// pages/face.js
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ingredients from "../public/data/ingredients.json";
import skinTypes from "../public/data/skinTypes.json";
import styles from "../styles/Face.module.css";

// We'll handle the import differently
let faceapi = null;

export default function Face() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [detection, setDetection] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [skinAnalysis, setSkinAnalysis] = useState(null);
  const [detectorOptions, setDetectorOptions] = useState(null);
  const [faceApiInitialized, setFaceApiInitialized] = useState(false);

  useEffect(() => {
    // Load face-api only on client side
    if (typeof window !== "undefined" && !faceApiInitialized) {
      import("@vladmandic/face-api")
        .then((module) => {
          faceapi = module;
          console.log("FaceAPI loaded successfully");
          
          // Initialize detector options
          if (faceapi.TinyFaceDetectorOptions) {
            setDetectorOptions(new faceapi.TinyFaceDetectorOptions({
              inputSize: 160,
              scoreThreshold: 0.5,
            }));
          }
          
          setFaceApiInitialized(true);
        })
        .catch((err) => {
          console.error("Failed to load FaceAPI:", err);
          setError(`Failed to load face detection library: ${err.message}`);
        });
    }
  }, [faceApiInitialized]);

  useEffect(() => {
    if (!faceApiInitialized || !faceapi) {
      return;
    }

    async function loadModels() {
      try {
        console.log("Starting to load models...");
        const MODEL_URL = "/models";
        
        setLoadingProgress("Loading face detector...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("Face detector loaded");
        
        setLoadingProgress("Loading age/gender model...");
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        console.log("Age/gender model loaded");
        
        setLoadingProgress("Loading expression model...");
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log("Expression model loaded");
        
        setModelsLoaded(true);
        setLoadingProgress("Models loaded successfully!");
        console.log("All models loaded successfully");
        startVideo();
      } catch (err) {
        console.error("Model loading error:", err);
        setError(`Failed to load models: ${err.message}. Please check if models are in /public/models folder.`);
      }
    }

    loadModels();

    return () => {
      // Clean up animation frame on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [faceApiInitialized]);

  const startVideo = () => {
    console.log("Requesting camera access...");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        console.log("Camera access granted");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
          };
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setError(`Camera access denied: ${err.message}. Please allow camera permissions and refresh.`);
      });
  };

  // Process frame without blocking UI
  const processFrame = useCallback(async () => {
    if (!modelsLoaded || !faceapi || !videoRef.current || videoRef.current.paused || !detectorOptions) {
      return;
    }

    try {
      const result = await faceapi
        .detectSingleFace(videoRef.current, detectorOptions)
        .withAgeAndGender()
        .withFaceExpressions();

      if (result) {
        setDetection(result);
        drawDetection(result);
        
        // Only update recommendations periodically to reduce computation
        if (!scanComplete && (!detection || Date.now() % 1000 < 100)) {
          suggestIngredients(result);
          analyzeSkin(result);
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    // Schedule next frame with target of 5-10 FPS
    animationRef.current = setTimeout(() => {
      requestAnimationFrame(processFrame);
    }, 100); // ~10 FPS
  }, [modelsLoaded, scanComplete, detection, detectorOptions]);

  const handlePlay = () => {
    if (!modelsLoaded || !faceapi) {
      console.log("Models not ready yet");
      return;
    }

    // Set up canvas for drawing
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    setIsScanning(true);
    processFrame();
    
    // Auto-complete scan after 5 seconds
    setTimeout(() => {
      setScanComplete(true);
      setIsScanning(false);
    }, 5000);
  };

  const drawDetection = (result) => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face detection box
    const { x, y, width, height } = result.detection.box;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw landmarks if available
    if (result.landmarks) {
      ctx.fillStyle = '#FF5252';
      result.landmarks.positions.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  const analyzeSkin = (result) => {
    // Simulate skin analysis based on facial features and expressions
    const skinConcerns = [];
    let skinType = "Normal";
    
    // Simple simulation based on expressions and age
    if (result.expressions && result.expressions.sad > 0.7) {
      skinConcerns.push("Dullness", "Fatigue");
    }
    
    if (result.age > 35) {
      skinConcerns.push("Fine Lines", "Loss of Elasticity");
      skinType = result.gender === "male" ? "Aging" : "Mature";
    }
    
    if (result.expressions && result.expressions.angry > 0.6) {
      skinConcerns.push("Redness", "Sensitivity");
      skinType = "Sensitive";
    }
    
    if (skinConcerns.length === 0) {
      skinConcerns.push("Maintenance", "Protection");
    }
    
    setSkinAnalysis({ type: skinType, concerns: skinConcerns });
  };

  const suggestIngredients = (result) => {
    const recs = new Set();
    
    // Age-based recommendations
    if (result.age > 35) {
      recs.add("Retinol");
      recs.add("Hyaluronic Acid");
      recs.add("Peptides");
    } else if (result.age < 25) {
      recs.add("Salicylic Acid");
      recs.add("Niacinamide");
    }
    
    // Gender-based recommendations
    if (result.gender === "male") {
      recs.add("Glycerin");
      recs.add("Lightweight");
    } else {
      recs.add("Antioxidants");
    }
    
    // Expression-based recommendations
    const expressions = result.expressions || {};
    if (expressions.sad > 0.5) recs.add("Vitamin C");
    if (expressions.angry > 0.5) recs.add("Centella Asiatica");
    if (expressions.neutral > 0.7) recs.add("Ceramides");
    if (expressions.happy > 0.7) recs.add("Antioxidants");
    
    // Skin concerns-based recommendations
    if (skinAnalysis) {
      skinAnalysis.concerns.forEach(concern => {
        if (concern.includes("Fine Lines")) recs.add("Retinol");
        if (concern.includes("Dullness")) recs.add("Vitamin C");
        if (concern.includes("Redness")) recs.add("Niacinamide");
        if (concern.includes("Sensitivity")) recs.add("Centella Asiatica");
      });
    }
    
    // Find matching ingredients
    const ingredientMatches = ingredients.filter(i => 
      Array.from(recs).some(r => 
        i.name.toLowerCase().includes(r.toLowerCase()) || 
        (i.tags && i.tags.some(tag => tag.toLowerCase().includes(r.toLowerCase())))
      )
    );
    
    // Limit to top 5 recommendations
    setRecommendations(ingredientMatches.slice(0, 5));
  };

  const restartScan = () => {
    setScanComplete(false);
    setDetection(null);
    setRecommendations([]);
    setSkinAnalysis(null);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    // Restart detection after a brief pause
    setTimeout(() => {
      setIsScanning(true);
      processFrame();
      
      setTimeout(() => {
        setScanComplete(true);
        setIsScanning(false);
      }, 5000);
    }, 300);
  };

  return (
    <div className={styles.faceContainer}>
      <h2>Skin Analysis Scanner</h2>
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handlePlay}
          className={styles.faceVideo}
        />
        <canvas ref={canvasRef} className={styles.overlayCanvas} />
        
        {isScanning && (
          <div className={styles.scanOverlay}>
            <div className={styles.scanLine}></div>
            <div className={styles.scanText}>Analyzing your skin...</div>
          </div>
        )}
      </div>
      
      {!modelsLoaded && !error && (
        <div className={styles.loading}>
          <p>Loading face detection models...</p>
          {loadingProgress && <p className={styles.progress}>{loadingProgress}</p>}
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
        </div>
      )}

      {scanComplete && detection && (
        <div className={`${styles.resultBox} ${styles.fadeIn}`}>
          <h3>Analysis Results</h3>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Age:</span>
              <span className={styles.resultValue}>{Math.round(detection.age)}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Gender:</span>
              <span className={styles.resultValue}>{detection.gender}</span>
            </div>
            {skinAnalysis && (
              <>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Skin Type:</span>
                  <span className={styles.resultValue}>{skinAnalysis.type}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Concerns:</span>
                  <span className={styles.resultValue}>
                    {skinAnalysis.concerns.join(", ")}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className={styles.expressions}>
            <h4>Facial Expressions</h4>
            <div className={styles.expressionGrid}>
              {detection.expressions && Object.entries(detection.expressions)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, value]) => (
                  <div key={emotion} className={styles.expressionItem}>
                    <span className={styles.expressionName}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}:
                    </span>
                    <div className={styles.expressionBar}>
                      <div 
                        className={styles.expressionValue} 
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                    <span className={styles.expressionPercent}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className={`${styles.recommendations} ${styles.slideIn}`}>
          <h3>Recommended Ingredients</h3>
          <div className={styles.ingredientGrid}>
            {recommendations.map((r) => (
              <div key={r.id} className={styles.ingredientCard}>
                <h4>{r.name}</h4>
                <p>{r.description}</p>
                <div className={styles.ingredientTags}>
                  {r.tags && r.tags.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scanComplete && (
        <button className={styles.scanAgainButton} onClick={restartScan}>
          Scan Again
        </button>
      )}
    </div>
  );
}