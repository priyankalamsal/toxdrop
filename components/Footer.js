import Link from "next/link"
import styles from "../styles/Layout.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} ToxDrop. All rights reserved.
        </p>
        
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Service
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Contact Us
          </Link>
          <Link href="/about" className={styles.footerLink}>
            About
          </Link>
        </div>
        
        <p className={styles.footerText}>
          Making product safety transparent and accessible.
        </p>
      </div>
    </footer>
  )
}