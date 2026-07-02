import styles from "./SiteBackButton.module.css";

export default function SiteBackButton({ onClick, label = "Volver", className = "" }) {
    return (
        <button
            type="button"
            className={`${styles.backBtn} ${className}`.trim()}
            onClick={onClick}
            aria-label={label}
        >
            <span className={styles.arrow} aria-hidden>←</span>
            <span>{label}</span>
        </button>
    );
}
