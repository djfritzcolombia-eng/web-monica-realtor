import { useEffect, useRef, useState } from "react";
import styles from "./ImageCarousel.module.css";

const DEFAULT_COLORS = {
    terracota: "#d8a48f",
    ivory: "#faf9f6",
};

export default function ImageCarousel({
    images,
    title,
    height = 250,
    initialIndex = 0,
    onIndexChange,
    accentColor = DEFAULT_COLORS.terracota,
    labelColor = DEFAULT_COLORS.ivory,
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loadingNext, setLoadingNext] = useState(false);
    const [progress, setProgress] = useState(0);
    const [vivid, setVivid] = useState(false);
    const progressTimerRef = useRef(null);

    useEffect(() => setCurrentIndex(initialIndex), [initialIndex]);
    useEffect(() => () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }, []);

    const startIndeterminateProgress = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(0);
        progressTimerRef.current = setInterval(() => {
            setProgress((p) => (p < 90 ? Math.min(90, p + 8 + Math.random() * 7) : p));
        }, 180);
    };

    const stopProgress = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(100);
        setTimeout(() => setProgress(0), 350);
    };

    const preloadAndSwitch = (nextIndex) => {
        if (!images?.length || nextIndex === currentIndex) return;
        setLoadingNext(true);
        setVivid(false);
        startIndeterminateProgress();
        const img = new window.Image();
        img.onload = () => {
            setCurrentIndex(nextIndex);
            onIndexChange?.(nextIndex);
            setLoadingNext(false);
            stopProgress();
        };
        img.onerror = () => {
            setLoadingNext(false);
            stopProgress();
        };
        img.src = images[nextIndex];
    };

    const goToPrevious = () => {
        const next = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        preloadAndSwitch(next);
    };

    const goToNext = () => {
        const next = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        preloadAndSwitch(next);
    };

    if (!images?.length) {
        return (
            <div className={styles.frame} style={{ height }}>
                <img
                    src="https://via.placeholder.com/640x400?text=Sin+imagen"
                    alt={title || "Propiedad"}
                    className={styles.image}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <div
                className={`${styles.frame} ${vivid ? styles.frameVivid : ""}`}
                style={{ height }}
                onMouseEnter={() => setVivid(true)}
                onMouseLeave={() => setVivid(false)}
                onClick={() => setVivid(true)}
                role="presentation"
            >
                <img
                    src={images[currentIndex]}
                    alt={`${title || "Propiedad"} - Imagen ${currentIndex + 1}`}
                    className={styles.image}
                    loading="lazy"
                />

                {loadingNext && (
                    <>
                        <div className={styles.loadingOverlay} />
                        <div className={styles.spinner} />
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressBar}
                                style={{ width: `${progress}%`, background: accentColor }}
                            >
                                <span className={styles.progressShimmer} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <>
                    <div className={styles.counter} style={{ color: labelColor }}>
                        {currentIndex + 1} / {images.length}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                        className={`${styles.navBtn} ${styles.navBtnLeft} ${loadingNext ? styles.navBtnDim : ""}`}
                        style={{ color: labelColor }}
                        aria-label="Imagen anterior"
                    >
                        ‹
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                        className={`${styles.navBtn} ${styles.navBtnRight} ${loadingNext ? styles.navBtnDim : ""}`}
                        style={{ color: labelColor }}
                        aria-label="Imagen siguiente"
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    );
}
