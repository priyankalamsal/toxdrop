import { useState, useMemo } from 'react'
import Link from 'next/link'
import products from '../public/data/products.json'
import ingredients from '../public/data/ingredients.json'
import styles from '../styles/Search.module.css'

export default function Search() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('products')
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    brand: 'all'
  })

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))]
    return ['all', ...uniqueBrands]
  }, [])

  const searchResults = useMemo(() => {
    if (!query.trim() && filters.riskLevel === 'all' && filters.brand === 'all') {
      return []
    }

    if (searchType === 'products') {
      return products.filter(product => {
        const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase()) ||
                           product.brand.toLowerCase().includes(query.toLowerCase())
        
        const matchesBrand = filters.brand === 'all' || product.brand === filters.brand
        
        // For products, we need to check ingredient risks
        if (filters.riskLevel !== 'all') {
          const productIngredients = product.ingredients.map(
            id => ingredients.find(i => i.id === id)
          ).filter(Boolean)
          
          const hasMatchingRisk = productIngredients.some(
            ing => ing.risk_level === filters.riskLevel
          )
          
          return matchesQuery && matchesBrand && hasMatchingRisk
        }
        
        return matchesQuery && matchesBrand
      })
    } else {
      return ingredients.filter(ingredient => {
        const matchesQuery = ingredient.name.toLowerCase().includes(query.toLowerCase()) ||
                           ingredient.description.toLowerCase().includes(query.toLowerCase())
        
        const matchesRisk = filters.riskLevel === 'all' || ingredient.risk_level === filters.riskLevel
        
        return matchesQuery && matchesRisk
      })
    }
  }, [query, searchType, filters])

  const clearSearch = () => {
    setQuery('')
    setFilters({ riskLevel: 'all', brand: 'all' })
  }

  const getRiskLevelCounts = () => {
    const counts = { High: 0, Medium: 0, Low: 0, Safe: 0 }
    
    if (searchType === 'products') {
      products.forEach(product => {
        product.ingredients.forEach(ingId => {
          const ingredient = ingredients.find(i => i.id === ingId)
          if (ingredient) {
            counts[ingredient.risk_level]++
          }
        })
      })
    } else {
      ingredients.forEach(ing => {
        counts[ing.risk_level]++
      })
    }
    
    return counts
  }

  const riskCounts = getRiskLevelCounts()

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>Advanced Search</h2>
        <p className={styles.searchSubtitle}>Find products and ingredients with detailed filters</p>
      </div>

      <div className={styles.searchControls}>
        <div className={styles.searchTypeToggle}>
          <button
            className={`${styles.toggleBtn} ${searchType === 'products' ? styles.active : ''}`}
            onClick={() => setSearchType('products')}
          >
            Products
          </button>
          <button
            className={`${styles.toggleBtn} ${searchType === 'ingredients' ? styles.active : ''}`}
            onClick={() => setSearchType('ingredients')}
          >
            Ingredients
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${searchType}...`}
            onKeyPress={(e) => e.key === 'Enter' && setQuery(e.target.value)}
          />
          {query && (
            <button onClick={clearSearch} className={styles.clearBtn}>
              ×
            </button>
          )}
        </div>

        <div className={styles.filterSection}>
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className={styles.filterSelect}
          >
            <option value="all">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
            <option value="Safe">Safe</option>
          </select>

          {searchType === 'products' && (
            <select
              value={filters.brand}
              onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
              className={styles.filterSelect}
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand === 'all' ? 'All Brands' : brand}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.resultsSummary}>
        <p>
          Found <strong>{searchResults.length}</strong> {searchType}
          {query && ` for "${query}"`}
        </p>
        
        <div className={styles.riskSummary}>
          {Object.entries(riskCounts).map(([risk, count]) => (
            count > 0 && (
              <span key={risk} className={`${styles.riskPill} ${styles[`risk${risk}`]}`}>
                {risk}: {count}
              </span>
            )
          ))}
        </div>
      </div>

      {searchResults.length > 0 ? (
        <div className={styles.resultsGrid}>
          {searchResults.map(item => (
            searchType === 'products' ? (
              <div key={item.id} className={styles.productCard}>
                <div className={styles.productImage}>
                  <img 
                    src={`/images/${item.image_refs[0]}`} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className={styles.imagePlaceholder}>📦</div>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{item.name}</h3>
                  <p className={styles.productBrand}>{item.brand}</p>
                  <div className={styles.productMeta}>
                    <span className={styles.barcode}>{item.barcode}</span>
                    <span className={styles.ingredientCount}>
                      {item.ingredients.length} ingredients
                    </span>
                  </div>
                  <Link href={`/product/${item.id}`} className={styles.viewDetailsBtn}>
                    View Details
                  </Link>
                </div>
              </div>
            ) : (
              <div key={item.id} className={styles.ingredientCard}>
                <h3 className={styles.ingredientName}>{item.name}</h3>
                <span className={`${styles.riskBadge} ${styles[`risk${item.risk_level}`]}`}>
                  {item.risk_level}
                </span>
                <p className={styles.ingredientDesc}>{item.description}</p>
                <div className={styles.ingredientMeta}>
                  <span>Found in {products.filter(p => p.ingredients.includes(item.id)).length} products</span>
                </div>
              </div>
            )
          ))}
        </div>
      ) : query || filters.riskLevel !== 'all' || filters.brand !== 'all' ? (
        <div className={styles.noResults}>
          <p>No {searchType} found matching your criteria.</p>
          <button onClick={clearSearch} className={styles.clearSearchBtn}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className={styles.initialState}>
          <p>Start typing to search {searchType} or use filters to narrow down results.</p>
          <div className={styles.searchTips}>
            <h4>Search Tips:</h4>
            <ul>
              <li>Use specific product names or brands</li>
              <li>Filter by risk level to find safer alternatives</li>
              <li>Search ingredients to learn about their effects</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}