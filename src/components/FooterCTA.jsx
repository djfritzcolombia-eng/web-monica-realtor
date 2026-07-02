import { styles } from "../styles/styles";

export default function FooterCTA() {
    return (
        <div style={styles.ctaFoot}>
            <div style={styles.container}>
                <h3 style={{ ...styles.h2, marginBottom: 8 }}>¿Listo para dar el siguiente paso?</h3>
                <p style={styles.sub}>Conversemos sobre tu propiedad o la casa que sueñas.</p>
                <div style={styles.ctaRow}>
                    <a href="#contacto" style={{ ...styles.btn, ...styles.btnPrimary }}>Contactar un asesor</a>
                    <a href="#tasacion" style={{ ...styles.btn, ...styles.btnGhost }}>Solicitar valoración</a>
                </div>
            </div>
        </div>
    );
}
