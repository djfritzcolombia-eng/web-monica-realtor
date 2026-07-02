import { styles } from "../../styles/styles";

export default function BlogCard({ title, img, href }) {
    return (
        <a href={href} style={styles.card}>
            <div style={styles.thumbWrap}>
                <img src={img} alt={title} style={styles.thumb} />
            </div>
            <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{title}</h3>
                <p style={styles.cardExcerpt}>Lectura recomendada para compradores y vendedores.</p>
            </div>
        </a>
    );
}
