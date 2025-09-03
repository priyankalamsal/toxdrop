import { useState, useMemo } from 'react'
import ingredients from '../public/data/ingredients.json'
import products from '../public/data/products.json'
import styles from '../styles/Ingredients.module.css'

export default function Ingredients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterRisk, setFilterRisk] = useState('all')
  const [selectedIngredient, setSelectedIngredient] = useState(null)

  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ing.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRisk = filterRisk === 'all' || ing.risk_level === filterRisk
        return matchesSearch && matchesRisk
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'risk':
            const riskOrder = { High: 4, Medium: 3, Low: 2, Safe: 1 }
            return riskOrder[b.risk_level] - riskOrder[a.risk_level]
          case 'name':
            return a.name.localeCompare(b.name)
          case 'frequency':
            const countA = products.filter(p => p.ingredients.includes(a.id)).length
            const countB = products.filter(p => p.ingredients.includes(b.id)).length
            return countB - countA
          default:
            return 0
        }
      })
  }, [searchTerm, sortBy, filterRisk])

  const getProductCount = (ingredientId) => {
    return products.filter(p => p.ingredients.includes(ingredientId)).length
  }

  const getRiskStats = () => {
    const stats = { High: 0, Medium: 0, Low: 0, Safe: 0, total: ingredients.length }
    ingredients.forEach(ing => stats[ing.risk_level]++)
    return stats
  }

  const riskStats = getRiskStats()

  return (
    <div className={styles.ingredientsContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ingredient Dictionary</h2>
        <p className={styles.subtitle}>
          Comprehensive database of cosmetic ingredients with safety ratings
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
            <option value="Safe">Safe</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="risk">Sort by Risk</option>
            <option value="frequency">Sort by Frequency</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Ingredients</h3>
          <span className={styles.statNumber}>{riskStats.total}</span>
        </div>
        <div className={styles.statCard}>
          <h3>High Risk</h3>
          <span className={`${styles.statNumber} ${styles.riskHigh}`}>{riskStats.High}</span>
        </div>
        <div className={styles.statCard}>
          <h3>Medium Risk</h3>
          <span className={`${styles.statNumber} ${styles.riskMedium}`}>{riskStats.Medium}</span>
        </div>
        <div className={styles.statCard}>
          <h3>Low Risk</h3>
          <span className={`${styles.statNumber} ${styles.riskLow}`}>{riskStats.Low}</span>
        </div>
        <div className={styles.statCard}>
          <h3>Safe</h3>
          <span className={`${styles.statNumber} ${styles.riskSafe}`}>{riskStats.Safe}</span>
        </div>
      </div>

      <div className={styles.ingredientsGrid}>
        {filteredIngredients.map(ingredient => (
          <div
            key={ingredient.id}
            className={`${styles.ingredientCard} ${styles[`risk${ingredient.risk_level}`]}`}
            onClick={() => setSelectedIngredient(ingredient)}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.ingredientName}>{ingredient.name}</h3>
              <span className={styles.riskBadge}>{ingredient.risk_level}</span>
            </div>
            
            <p className={styles.ingredientDesc}>{ingredient.description}</p>
            
            <div className={styles.cardFooter}>
              <span className={styles.productCount}>
                Found in {getProductCount(ingredient.id)} products
              </span>
              <span className={styles.viewDetails}>View Details →</span>
            </div>
          </div>
        ))}
      </div>

      {filteredIngredients.length === 0 && (
        <div className={styles.noResults}>
          <p>No ingredients found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterRisk('all')
            }}
            className={styles.clearBtn}
          >
            Clear Filters
          </button>
        </div>
      )}

      {selectedIngredient && (
        <div className={styles.modalOverlay} onClick={() => setSelectedIngredient(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedIngredient(null)}
            >
              ×
            </button>
            
            <h3>{selectedIngredient.name}</h3>
            <span className={`${styles.riskBadge} ${styles[`risk${selectedIngredient.risk_level}`]}`}>
              {selectedIngredient.risk_level} Risk
            </span>
            
            <p className={styles.modalDesc}>{selectedIngredient.description}</p>
            
            <div className={styles.modalSection}>
              <h4>Products containing this ingredient:</h4>
              <div className={styles.productList}>
                {products
                  .filter(p => p.ingredients.includes(selectedIngredient.id))
                  .map(product => (
                    <span key={product.id} className={styles.productTag}>
                      {product.name}
                    </span>
                  ))
                }
              </div>
            </div>

            <div className={styles.modalSection}>
              <h4>Safety Recommendations:</h4>
              <p>
                {selectedIngredient.risk_level === 'High' &&
                  'Consider avoiding products with this ingredient. Look for safer alternatives.'}
                {selectedIngredient.risk_level === 'Medium' &&
                  'Use with caution. May cause issues for sensitive skin.'}
                {selectedIngredient.risk_level === 'Low' &&
                  'Generally safe for most users. Monitor for any personal reactions.'}
                {selectedIngredient.risk_level === 'Safe' &&
                  'Considered safe for regular use by most regulatory bodies.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}