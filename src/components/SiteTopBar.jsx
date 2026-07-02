import styles from "./SiteTopBar.module.css";

export default function SiteTopBar({ showBack = false, onBack, backLabel = "Volver", editorial = false }) {
    if (editorial) {
        return (
            <header className={styles.barEditorial}>
                <h1 className={styles.brandLarge}>Mónica Fritz</h1>
                <p className={styles.brandSubtitle}>Tu agente inmobiliaria</p>
                {showBack && onBack && (
                    <nav className={styles.navEditorial} aria-label="Navegación principal">
                        <button
                            type="button"
                            className={styles.navLink}
                            onClick={onBack}
                        >
                            <span aria-hidden>←</span> {backLabel}
                        </button>
                    </nav>
                )}
            </header>
        );
    }

    return (
        <header className={styles.bar}>
            <p className={styles.brand}>
                Mónica <span className={styles.brandAccent}>Fritz</span>
            </p>
            <nav className={styles.nav} aria-label="Navegación principal">
                {showBack && onBack && (
                    <button
                        type="button"
                        className={`${styles.navLink} ${styles.backLink}`}
                        onClick={onBack}
                    >
                        <span aria-hidden>←</span>
                        {backLabel}
                    </button>
                )}
            </nav>
        </header>
    );
}
