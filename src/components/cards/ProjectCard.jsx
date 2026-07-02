import { styles, currencyCOP } from "../../styles/styles";

export default function ProjectCard({ name, from, area, img, href }) {
    return (
        <a href={href} style={styles.card}>
            <div style={styles.thumbWrap}>
                <img src={img} alt={name} style={styles.thumb} />
                <div style={styles.badge}>Proyecto</div>
            </div>
            <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{name}</h3>
                <div style={styles.metaRow}>
                    <span>Desde {currencyCOP(from)}</span>
                    <span style={styles.dot}>•</span>
                    <span>{area}</span>
                </div>
            </div>
        </a>
    );
}
