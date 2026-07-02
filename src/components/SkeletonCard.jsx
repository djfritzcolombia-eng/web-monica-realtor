/* src/components/SkeletonCard.jsx */
import React from "react";
import styles from "./SkeletonCard.module.css";

export default function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonText} />
                <div className={styles.skeletonText} style={{ width: '60%' }} />
            </div>
        </div>
    );
}
