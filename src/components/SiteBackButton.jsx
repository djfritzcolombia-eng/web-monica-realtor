import styles from "./SiteBackButton.module.css";

export default function SiteBackButton({ onClick, label = "Volver", className = "", compact = false }) {
    return (
        <button
            type="button"
            className={`${styles.backBtn} ${compact ? styles.backBtnCompact : ""} ${className}`.trim()}
            onClick={onClick}
            aria-label={label}
        >
            <span className={styles.arrow} aria-hidden>←</span>
            <span>{label}</span>
        </button>
    );
}
