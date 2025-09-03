import { useRouter } from 'next/router'
import Link from 'next/link'
import products from '../../public/data/products.json'
import ingredients from '../../public/data/ingredients.json'
import alternatives from '../../public/data/alternatives.json'
import styles from '../../styles/Product.module.css'

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query

  const product = products.find(p => p.id === id)
  
  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <Link href="/search" className={styles.backLink}>
            ← Back to Search
          </Link>
        </div>
      </div>
    )
  }

  const productIngredients = product.ingredients.map(
    id => ingredients.find(i => i.id === id)
  ).filter(Boolean)

  const alternative = alternatives.find(a => a.related_to === product.id)
  const relatedProducts = products.filter(p => 
    p.brand === product.brand && p.id !== product.id
  ).slice(0, 4)

  const calculateSafetyScore = () => {
    const riskWeights = { High: 3, Medium: 2, Low: 1, Safe: 0 }
    const totalRisk = productIngredients.reduce((sum, ing) => {
      return sum + (riskWeights[ing.risk_level] || 0)
    }, 0)
    
    return Math.max(0, 10 - totalRisk * 0.8).toFixed(1)
  }

  const safetyScore = calculateSafetyScore()

  const getRiskCounts = () => {
    const counts = { High: 0, Medium: 0, Low: 0, Safe: 0 }
    productIngredients.forEach(ing => {
      counts[ing.risk_level]++
    })
    return counts
  }

  const riskCounts = getRiskCounts()

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span> / </span>
        <Link href="/search">Products</Link>
        <span> / </span>
        <span>{product.name}</span>
      </nav>

      {/* Product Header */}
      <div className={styles.productHeader}>
        <div className={styles.productImage}>
          <img 
            src={`/images/${product.image_refs[0]}`} 
            alt={product.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className={styles.imagePlaceholder}>📦</div>
        </div>
        
        <div className={styles.productInfo}>
          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.productBrand}>{product.brand}</p>
          
          <div className={styles.safetyScore}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{safetyScore}</span>
              <span className={styles.scoreLabel}>Safety Score</span>
            </div>
          </div>

          <div className={styles.productMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Type:</span>
              <span className={styles.metaValue}>{product.type}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Barcode:</span>
              <span className={styles.metaValue}>{product.barcode}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Ingredients:</span>
              <span className={styles.metaValue}>{product.ingredients.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <section className={styles.riskSummary}>
        <h3>Ingredient Risk Breakdown</h3>
        <div className={styles.riskGrid}>
          <div className={`${styles.riskItem} ${styles.riskHigh}`}>
            <span className={styles.riskCount}>{riskCounts.High}</span>
            <span className={styles.riskLabel}>High Risk</span>
          </div>
          <div className={`${styles.riskItem} ${styles.riskMedium}`}>
            <span className={styles.riskCount}>{riskCounts.Medium}</span>
            <span className={styles.riskLabel}>Medium Risk</span>
          </div>
          <div className={`${styles.riskItem} ${styles.riskLow}`}>
            <span className={styles.riskCount}>{riskCounts.Low}</span>
            <span className={styles.riskLabel}>Low Risk</span>
          </div>
          <div className={`${styles.riskItem} ${styles.riskSafe}`}>
            <span className={styles.riskCount}>{riskCounts.Safe}</span>
            <span className={styles.riskLabel}>Safe</span>
          </div>
        </div>
      </section>

      {/* Ingredients Analysis */}
      <section className={styles.ingredientsSection}>
        <h3>Ingredients Analysis</h3>
        <div className={styles.ingredientsGrid}>
          {productIngredients.map(ingredient => (
            <div key={ingredient.id} className={styles.ingredientCard}>
              <div className={styles.ingredientHeader}>
                <h4 className={styles.ingredientName}>{ingredient.name}</h4>
                <span className={`${styles.riskBadge} ${styles[`risk${ingredient.risk_level}`]}`}>
                  {ingredient.risk_level}
                </span>
              </div>
              <p className={styles.ingredientDesc}>{ingredient.description}</p>
              <div className={styles.ingredientMeta}>
                <span className={styles.riskLevel}>Risk: {ingredient.risk_level}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alternative Product */}
      {alternative && (
        <section className={styles.alternativeSection}>
          <div className={styles.sectionHeader}>
            <h3>🚨 Safer Alternative</h3>
            <span className={styles.recommendationBadge}>Recommended</span>
          </div>
          <div className={styles.alternativeCard}>
            <h4>{alternative.alternative_product}</h4>
            <p className={styles.alternativeReason}>{alternative.reason}</p>
            <Link href={`/product/${alternative.alternative_product}`} className={styles.viewAlternativeBtn}>
              View Alternative Product
            </Link>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <h3>Other products by {product.brand}</h3>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(related => (
              <Link key={related.id} href={`/product/${related.id}`} className={styles.relatedCard}>
                <div className={styles.relatedImage}>
                  <img 
                    src={`/images/${related.image_refs[0]}`} 
                    alt={related.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className={styles.relatedPlaceholder}>📦</div>
                </div>
                <div className={styles.relatedInfo}>
                  <h4 className={styles.relatedName}>{related.name}</h4>
                  <p className={styles.relatedType}>{related.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Link href="/search" className={styles.backButton}>
          ← Back to Search
        </Link>
        <Link href="/lens" className={styles.scanButton}>
          📷 Scan Another Product
        </Link>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  const paths = products.map(product => ({
    params: { id: product.id }
  }))

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  return {
    props: {}
  }
}