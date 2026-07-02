import { styles } from "../styles/styles";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";

export default function SocialIcons() {
    return (
        <div style={styles.socialIcons}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={styles.socialBtn}>
                <FaFacebookF />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={styles.socialBtn}>
                <FaInstagram />
            </a>
            <a href="https://wa.me/573212080985" target="_blank" rel="noopener noreferrer" style={styles.socialBtn}>
                <FaWhatsapp />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={styles.socialBtn}>
                <FaLinkedinIn />
            </a>
        </div>
    );
}