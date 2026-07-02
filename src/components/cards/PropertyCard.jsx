import { styles, currencyCOP } from "../../styles/styles";

export default function PropertyCard({ title, price, area, img, href }) {
    return (
        <a href={href} style={styles.card}>
            <div style={styles.thumbWrap}>
                <img src={img} alt={title} style={styles.thumb} />
            </div>
            <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{title}</h3>
                <div style={styles.metaRow}>
                    <span style={styles.price}>{currencyCOP(price)}</span>
                    <span style={styles.dot}>•</span>
                    <span>{area} m²</span>
                </div>
            </div>
        </a>
    );
}
