import Link from "next/link"
import { useRouter } from "next/router"
import styles from "../styles/Layout.module.css"

export default function Header() {
  const router = useRouter()

  const isActive = (path) => router.pathname === path

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <img 
          src="/logo.png" 
          alt="ToxDrop Logo" 
          className={styles.logoImage}
        />
        <span className={styles.logoText}>ToxDrop</span>
      </Link>
      
      <nav>
        <ul className={styles.nav}>
          <li className={styles.navItem}>
            <Link 
              href="/" 
              className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
            >
              Home
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link 
              href="/search" 
              className={`${styles.navLink} ${isActive('/search') ? styles.navLinkActive : ''}`}
            >
              Search
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link 
              href="/lens" 
              className={`${styles.navLink} ${isActive('/lens') ? styles.navLinkActive : ''}`}
            >
              Lens
            </Link>
          </li>
           <li className={styles.navItem}>
            <Link 
              href="/face" 
              className={`${styles.navLink} ${isActive('/face') ? styles.navLinkActive : ''}`}
            >
              Face
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link 
              href="/ingredients" 
              className={`${styles.navLink} ${isActive('/ingredients') ? styles.navLinkActive : ''}`}
            >
              Ingredients
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}