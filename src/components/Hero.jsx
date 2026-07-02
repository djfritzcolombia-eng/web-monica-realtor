import { styles } from "../styles/styles";

export default function Hero() {
    return (
        <header style={styles.hero}>
            {/* Fondo degradado decorativo en vez de video */}
            <div style={{ ...styles.heroBg, background: 'linear-gradient(120deg, #e6dace 0%, #faf9f6 100%)' }} aria-hidden>
                <div style={styles.heroOverlay} />
            </div>
            {/* Contenido encima del fondo */}
            <div style={styles.heroContent}>
                <div style={styles.heroLeft}>
                    {/* ...contenido... */}
                </div>
            </div>
        </header>
    );
}