import styles from "./ProfileHeader.module.css";
import profileImg from "../assets/foto.jpg";

export default function ProfileHeader({
    centered = false,
    hideTitle = false,
    introRing = false,
    compact = false,
    showAvatar = true,
    showHandle = true,
    heroAvatar = false,
}) {
    const showInfo = showHandle && (centered ? !hideTitle || showHandle : true);

    return (
        <header
            className={`${styles.header} ${centered ? styles.headerCentered : ""} ${compact ? styles.headerCompact : ""} ${!showAvatar && showHandle ? styles.headerHandleOnly : ""}`}
        >
            {showAvatar && (
                <div className={`${styles.avatarShell} ${compact ? styles.avatarShellCompact : ""} ${heroAvatar ? styles.avatarShellHero : ""} ${introRing ? styles.avatarShellIntro : ""}`}>
                    {introRing && (
                        <>
                            <span className={styles.introRing} aria-hidden />
                            <span className={`${styles.introRing} ${styles.introRingDelay}`} aria-hidden />
                        </>
                    )}
                    <div className={`${styles.avatarWrap} ${compact ? styles.avatarWrapCompact : ""} ${heroAvatar ? styles.avatarWrapHero : ""}`}>
                        <img
                            src={profileImg}
                            alt="Foto de perfil de Mónica Fritz"
                            className={styles.avatar}
                        />
                    </div>
                </div>
            )}
            {showInfo && (
                <div className={styles.info}>
                    {centered ? (
                        <>
                            {!hideTitle && (
                                <>
                                    <h1 className={styles.name}>Mónica Fritz</h1>
                                    <p className={styles.subtitle}>Tu agente inmobiliaria</p>
                                </>
                            )}
                            {showHandle && <p className={styles.handle}>@MónicaFritzRealtor</p>}
                        </>
                    ) : (
                        <>
                            <p className={styles.eyebrow}>Inmobiliaria</p>
                            <h1 className={styles.name}>Mónica Fritz</h1>
                            {showHandle && <p className={styles.subtitle}>@MónicaFritzRealtor</p>}
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
