import Link from 'next/link'
import styles from '../styles/Home.module.css'
import products from '../public/data/products.json'

export default function Home() {
  const latest = products.slice(-3)

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.homeTitle}>ToxDrop</h1>
        <p className={styles.subtitle}>
          Scan cosmetics and skincare products, check ingredients, and discover safer alternatives.
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/lens" className={styles.ctaBtn}>Start Scanning</Link>
          <Link href="/search" className={styles.ctaBtnOutline}>Search Products</Link>
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>Quick Access</h2>
        <div className={styles.menuGrid}>
          <Link href="/search" className={styles.menuCard}>
            <div className={styles.menuIcon}>🔍</div>
            <h3>Search Products</h3>
            <p>Find products by name</p>
          </Link>
          
          <Link href="/lens" className={styles.menuCard}>
            <div className={styles.menuIcon}>📷</div>
            <h3>ToxDrop Lens</h3>
            <p>Scan barcodes</p>
          </Link>
          
          <Link href="/ingredients" className={styles.menuCard}>
            <div className={styles.menuIcon}>📚</div>
            <h3>Ingredient Dictionary</h3>
            <p>Learn about ingredients</p>
          </Link>
        </div>
      </section>

      {/* Latest Products */}
      <section className={styles.latestSection}>
        <h2 className={styles.sectionTitle}>Recently Added</h2>
        <div className={styles.productGrid}>
          {latest.map(p => (
            <div key={p.id} className={styles.productCard}>
              <div className={styles.productImage}>
                <img 
                  src={`/images/${p.image_refs[0]}`} 
                  alt={p.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className={styles.imagePlaceholder}>Product Image</div>
              </div>
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{p.name}</h3>
                <p className={styles.productBrand}>{p.brand}</p>
                <Link href={`/product/${p.id}`} className={styles.viewLink}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}