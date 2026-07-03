import { Link, useLocation, useSearchParams } from "react-router-dom";
import SiteSearchBar from "./SiteSearchBar";
import styles from "./SiteTopBar.module.css";

export default function SiteTopBar({
    showBack = false,
    onBack,
    backLabel = "Volver",
    editorial = false,
    showNav = false,
}) {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const onHome = location.pathname === "/";
    const onSell = location.pathname.startsWith("/vender");
    const initialQuery = searchParams.get("q") || "";

    const nav = showNav ? (
        <nav className={styles.nav} aria-label="Navegación principal">
            <SiteSearchBar initialQuery={onHome ? initialQuery : ""} />
            <Link
                to="/vender"
                className={`${styles.navLink} ${onSell ? styles.navLinkActive : ""}`}
            >
                Vender
            </Link>
        </nav>
    ) : null;

    if (editorial) {
        return (
            <header className={styles.editorialStack}>
                {showNav && (
                    <div className={styles.bar}>
                        <Link to="/" className={styles.brandLink}>
                            Mónica Fritz <span className={styles.brandAccent}>Realtor</span>
                        </Link>
                        {nav}
                    </div>
                )}
                <div className={styles.barEditorial}>
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
                </div>
            </header>
        );
    }

    return (
        <header className={styles.bar}>
            <Link to="/" className={styles.brandLink}>
                Mónica Fritz <span className={styles.brandAccent}>Realtor</span>
            </Link>
            <nav className={styles.nav} aria-label="Navegación principal">
                {showNav && (
                    <>
                        <SiteSearchBar initialQuery={onHome ? initialQuery : ""} />
                        <Link
                            to="/vender"
                            className={`${styles.navLink} ${onSell ? styles.navLinkActive : ""}`}
                        >
                            Vender
                        </Link>
                    </>
                )}
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
