import React from "react";
import styles from "./ImageSkeleton.module.css";

export default function ImageSkeleton({ height = 250 }) {
    return (
        <div
            className={styles.skeletonImgBg}
            style={{ width: "100%", height }}
        >
            <div className={styles.skeletonShimmer} />
        </div>
    );
}
