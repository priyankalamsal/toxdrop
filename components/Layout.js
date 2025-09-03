import Header from "./Header"
import Footer from "./Footer"
import styles from "../styles/Layout.module.css"

export default function Layout({ children }) {
  return (
    <div className={styles.appContainer}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.pageTransition}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}