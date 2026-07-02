import { styles } from "../styles/styles";

export default function Section({ title, subtitle, children }) {
    return (
        <section style={styles.section}>
            <div style={styles.container}>
                <h2 style={styles.h2}>{title}</h2>
                {subtitle && <p style={styles.sub}>{subtitle}</p>}
                {children}
            </div>
        </section>
    );
}
