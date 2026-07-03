import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SiteSearchBar from "./SiteSearchBar";
import styles from "./SiteTopBar.module.css";

export default function SiteTopBar({
    showBack = false,
    onBack,
    backLabel = "Volver",
    editorial = false,
    showNav = false,
    onBrandClick,
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const onHome = location.pathname === "/";
    const onSell = location.pathname.startsWith("/vender");
    const initialQuery = searchParams.get("q") || "";

    const handleBrandClick = (event) => {
        if (onBrandClick) {
            onBrandClick(event);
            if (event.defaultPrevented) return;
        }
        if (onHome) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        event.preventDefault();
        navigate("/");
    };

    const brandMark = (
        <>
            Mónica Fritz <span className={styles.brandAccent}>Realtor</span>
        </>
    );

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
                        <Link to="/" className={styles.brandLink} onClick={handleBrandClick}>
                            {brandMark}
                        </Link>
                        {nav}
                    </div>
                )}
                <div className={styles.barEditorial}>
                    <Link to="/" className={styles.brandLargeLink} onClick={handleBrandClick}>
                        <h1 className={styles.brandLarge}>Mónica Fritz</h1>
                    </Link>
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
            <Link to="/" className={styles.brandLink} onClick={handleBrandClick}>
                {brandMark}
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
