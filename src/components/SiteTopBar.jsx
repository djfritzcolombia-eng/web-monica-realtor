import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SiteSearchBar from "./SiteSearchBar";
import { useSellListingNav } from "../hooks/useSellListingNav";
import styles from "./SiteTopBar.module.css";

export default function SiteTopBar({
    showBack = false,
    onBack,
    backLabel = "Volver",
    editorial = false,
    showNav = false,
    onBrandClick,
    selectionMode = false,
    selectionCount = 0,
    onToggleSelectionMode,
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const onHome = location.pathname === "/";
    const onSell = location.pathname.startsWith("/vender");
    const initialQuery = searchParams.get("q") || "";
    const sellNav = useSellListingNav(onSell);

    const sellLink = (
        <Link
            to={sellNav.to}
            className={`${styles.navLink} ${(onSell || sellNav.activeClass) ? styles.navLinkActive : ""}`}
        >
            {sellNav.label}
            {sellNav.badge && <span className={styles.navBadge}>{sellNav.badge}</span>}
        </Link>
    );

    const selectionLink = onToggleSelectionMode ? (
        <button
            type="button"
            className={`${styles.navLink} ${selectionMode ? styles.navLinkActive : ""}`}
            onClick={onToggleSelectionMode}
            aria-pressed={selectionMode}
        >
            Mis seleccionados
            {selectionCount > 0 && (
                <span className={styles.navBadge}>{selectionCount}</span>
            )}
        </button>
    ) : null;

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

    if (editorial) {
        return (
            <header className={styles.editorialNav}>
                <div className={styles.barEditorialHome}>
                    <div className={styles.brandStack}>
                        <Link to="/" className={styles.brandLinkEditorial} onClick={handleBrandClick}>
                            {brandMark}
                        </Link>
                        <p className={styles.brandTagline}>Tu agente inmobiliaria</p>
                    </div>
                    {showNav && (
                        <nav className={`${styles.nav} ${styles.navEditorialHome}`} aria-label="Navegación principal">
                            <SiteSearchBar initialQuery={onHome ? initialQuery : ""} />
                            {selectionLink}
                            {sellLink}
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
                        {selectionLink}
                        {sellLink}
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
