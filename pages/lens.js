import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import products from '../public/data/products.json'
import ingredients from '../public/data/ingredients.json'
import alternatives from '../public/data/alternatives.json'
import styles from '../styles/Lens.module.css'

export default function Lens() {
  const videoRef = useRef()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [scanHistory, setScanHistory] = useState([])

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    let interval

    if (scanning) {
      interval = setInterval(() => {
        codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result) {
            handleBarcodeScan(result.getText())
          }
        })
      }, 1000)
    }

    return () => {
      clearInterval(interval)
      codeReader.reset()
    }
  }, [scanning])

  const handleBarcodeScan = (barcode) => {
    setLoading(true)
    setScanning(false)
    
    // Simulate network delay
    setTimeout(() => {
      const match = products.find(p => p.barcode === barcode)
      
      if (match) {
        const ingredientDetails = match.ingredients.map(
          id => ingredients.find(i => i.id === id)
        ).filter(Boolean)
        
        const alternative = alternatives.find(a => a.related_to === match.id)
        const relatedProducts = products.filter(p => 
          p.brand === match.brand && p.id !== match.id
        ).slice(0, 3)

        const scannedProduct = {
          ...match,
          ingredientDetails,
          alternative,
          relatedProducts,
          safetyScore: calculateSafetyScore(ingredientDetails)
        }

        setProduct(scannedProduct)
        setScanHistory(prev => [scannedProduct, ...prev.slice(0, 4)])
      } else {
        setProduct({ notFound: true, code: barcode })
      }
      
      setLoading(false)
    }, 800)
  }

  const calculateSafetyScore = (ingredients) => {
    const riskWeights = { High: 3, Medium: 2, Low: 1, Safe: 0 }
    const totalRisk = ingredients.reduce((sum, ing) => {
      return sum + (riskWeights[ing.risk_level] || 0)
    }, 0)
    
    return Math.max(0, 10 - totalRisk * 0.8).toFixed(1)
  }

  const restartScan = () => {
    setProduct(null)
    setScanning(true)
  }

  return (
    <div className={styles.lensContainer}>
      <div className={styles.header}>
        <h2 className={styles.lensTitle}>ToxDrop Lens</h2>
        <p className={styles.subtitle}>Scan product barcodes to analyze ingredients</p>
      </div>

      {scanning && (
        <div className={styles.scannerSection}>
          <video 
            ref={videoRef} 
            className={styles.lensVideo}
            playsInline
          />
          <div className={styles.scannerOverlay}>
            <div className={styles.scannerFrame}></div>
            <p className={styles.scannerHint}>Align barcode within the frame</p>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analyzing product...</p>
        </div>
      )}

      {product && !product.notFound && (
        <div className={styles.productResult}>
          <div className={styles.productHeader}>
            <h3 className={styles.productName}>{product.name}</h3>
            <div className={styles.safetyScore}>
              <span className={styles.scoreValue}>{product.safetyScore}/10</span>
              <span className={styles.scoreLabel}>Safety Score</span>
            </div>
          </div>
          
          <div className={styles.productMeta}>
            <span className={styles.brand}>{product.brand}</span>
            <span className={styles.barcode}>Barcode: {product.barcode}</span>
          </div>

          <div className={styles.ingredientsSection}>
            <h4>Ingredients Analysis</h4>
            <div className={styles.ingredientsGrid}>
              {product.ingredientDetails.map(ingredient => (
                <div key={ingredient.id} className={styles.ingredientCard}>
                  <span className={styles.ingredientName}>{ingredient.name}</span>
                  <span className={`${styles.riskBadge} ${styles[`risk${ingredient.risk_level}`]}`}>
                    {ingredient.risk_level}
                  </span>
                  <p className={styles.ingredientDesc}>{ingredient.description}</p>
                </div>
              ))}
            </div>
          </div>

          {product.alternative && (
            <div className={styles.alternativeSection}>
              <h4>🚨 Safer Alternative</h4>
              <div className={styles.alternativeCard}>
                <h5>{product.alternative.alternative_product}</h5>
                <p>{product.alternative.reason}</p>
              </div>
            </div>
          )}

          {product.relatedProducts && product.relatedProducts.length > 0 && (
            <div className={styles.relatedSection}>
              <h4>Other products by {product.brand}</h4>
              <div className={styles.relatedGrid}>
                {product.relatedProducts.map(related => (
                  <div key={related.id} className={styles.relatedCard}>
                    <span className={styles.relatedName}>{related.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={restartScan} className={styles.scanAgainBtn}>
            Scan Another Product
          </button>
        </div>
      )}

      {product && product.notFound && (
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>❌</div>
          <h3>Product Not Found</h3>
          <p>No product found for barcode: <strong>{product.code}</strong></p>
          <p className={styles.suggestion}>
            Try searching for the product manually or check if the barcode is correct.
          </p>
          <button onClick={restartScan} className={styles.scanAgainBtn}>
            Try Again
          </button>
        </div>
      )}

      {scanHistory.length > 0 && (
        <div className={styles.historySection}>
          <h4>Recent Scans</h4>
          <div className={styles.historyGrid}>
            {scanHistory.map((item, index) => (
              <div key={index} className={styles.historyCard}>
                <span className={styles.historyName}>{item.name}</span>
                <span className={styles.historyScore}>{item.safetyScore}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}