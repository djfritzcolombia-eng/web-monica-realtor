import styles from "./ProfileHeader.module.css";
import profileImg from "../assets/foto.jpg";

export default function ProfileHeader({ centered = false, hideTitle = false, introRing = false }) {
    return (
        <header className={`${styles.header} ${centered ? styles.headerCentered : ""}`}>
            <div className={`${styles.avatarShell} ${introRing ? styles.avatarShellIntro : ""}`}>
                {introRing && (
                    <>
                        <span className={styles.introRing} aria-hidden />
                        <span className={`${styles.introRing} ${styles.introRingDelay}`} aria-hidden />
                    </>
                )}
                <div className={styles.avatarWrap}>
                    <img
                        src={profileImg}
                        alt="Foto de perfil de Mónica Fritz"
                        className={styles.avatar}
                    />
                </div>
            </div>
            <div className={styles.info}>
                {centered ? (
                    <>
                        {!hideTitle && (
                            <>
                                <h1 className={styles.name}>Mónica Fritz</h1>
                                <p className={styles.subtitle}>Tu agente inmobiliaria</p>
                            </>
                        )}
                        <p className={styles.handle}>@MónicaFritzRealtor</p>
                    </>
                ) : (
                    <>
                        <p className={styles.eyebrow}>Inmobiliaria</p>
                        <h1 className={styles.name}>Mónica Fritz</h1>
                        <p className={styles.subtitle}>@MónicaFritzRealtor</p>
                    </>
                )}
            </div>
        </header>
    );
}
