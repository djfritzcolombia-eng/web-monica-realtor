import React from "react";
import styles from "./ProfileHeader.module.css";
import profileImg from "../assets/foto.jpg";

export default function ProfileHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.avatarWrap}>
                <img
                    src={profileImg}
                    alt="Foto de perfil de Mónica Fritz"
                    className={styles.avatar}
                />
            </div>
            <div className={styles.info}>
                <div className={styles.name}>@MónicaFritzRealtor</div>
                <div className={styles.subtitle}>Tu agente inmobiliaria</div>
            </div>
        </header>
    );
}
