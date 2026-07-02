import styles from "./Section.module.css";

export default function Section({ id, title, subtitle, eyebrow, children }) {
    return (
        <section id={id} className={styles.section}>
            <div className={styles.inner}>
                {(title || subtitle || eyebrow) && (
                    <header className={styles.header}>
                        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                        {title && <h2 className={styles.title}>{title}</h2>}
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                        <div className={styles.divider} aria-hidden />
                    </header>
                )}
                {children}
            </div>
        </section>
    );
}
