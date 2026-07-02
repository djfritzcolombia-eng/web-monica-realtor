// Botonera flotante de redes sociales (SVGs inline, sin dependencias)
import React, { useEffect, useState } from "react";
import { useSessionTracking } from "../context/SessionTrackingContext";

const brand = {
    whatsapp: "#25D366",
    instagram: "#E4405F",
    facebook: "#1877F2",
    tiktok: "#010101",
    youtube: "#FF0000",
    linkedin: "#0A66C2",
};


const sx = {
    wrapBottom: {
        position: "fixed",
        left: "50%",
        bottom: 32,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "row",
        gap: 20,
        zIndex: 100,
    },
    wrapSide: {
        position: "fixed",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 100,
    },
    wrapBottomRight: {
        position: "fixed",
        right: 12,
        bottom: 16,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        zIndex: 100,
    },
    item: {
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        background: 'none',
    },
    circle: {
        background: "#faf9f6",
        border: "2px solid #e6dace",
        borderRadius: "50%",
        boxShadow: "0 2px 8px 0 rgba(214,164,143,0.13)",
        width: 54,
        height: 54,
        minWidth: 54,
        minHeight: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .2s, box-shadow .2s, background .2s",
        cursor: "pointer",
    },
    icon: {
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
};

function IconWhatsApp() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M20.52 3.48A11.94 11.94 0 0012.06 0C5.5 0 .23 5.27.23 11.83c0 2.09.55 4.13 1.6 5.93L0 24l6.41-1.78a11.81 11.81 0 005.65 1.46h.01c6.56 0 11.83-5.27 11.83-11.83 0-3.16-1.23-6.13-3.38-8.27zM12.07 21.3h-.01a9.47 9.47 0 01-4.83-1.33l-.35-.2-3.81 1.06 1.02-3.71-.23-.38a9.44 9.44 0 01-1.45-5.01c0-5.23 4.26-9.49 9.49-9.49 2.53 0 4.9.98 6.69 2.77a9.43 9.43 0 012.78 6.71c0 5.23-4.26 9.49-9.49 9.49zm5.43-7.12c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.68.15-.2.3-.78.95-.95 1.15-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.93-2.24-.24-.58-.5-.5-.68-.5l-.58-.01c-.2 0-.52.08-.8.38s-1.05 1.03-1.05 2.5 1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.29.5 1.73.64.73.23 1.4.2 1.93.12.59-.09 1.75-.72 2-1.42.25-.7.25-1.31.18-1.44-.07-.13-.27-.2-.57-.35z" />
        </svg>
    );
}
function IconInstagram() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.4.61.21 1.04.46 1.5.92.46.46.71.89.92 1.5.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.4 2.43a3.8 3.8 0 01-.92 1.5 3.8 3.8 0 01-1.5.92c-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.4a3.8 3.8 0 01-1.5-.92 3.8 3.8 0 01-.92-1.5c-.16-.46-.35-1.26-.4-2.43C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.054-1.17.24-1.97.4-2.43.21-.61.46-1.04.92-1.5.46-.46.89-.71 1.5-.92.46-.16 1.26-.35 2.43-.4C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.16 0-3.53.012-4.77.07-.98.045-1.51.21-1.87.35-.47.18-.8.39-1.15.74-.35.35-.56.68-.74 1.15-.14.36-.3.89-.35 1.87-.058 1.24-.07 1.61-.07 4.77s.012 3.53.07 4.77c.045.98.21 1.51.35 1.87.18.47.39.8.74 1.15.35.35.68.56 1.15.74.36.14.89.3 1.87.35 1.24.058 1.61.07 4.77.07s3.53-.012 4.77-.07c.98-.045 1.51-.21 1.87-.35.47-.18.8-.39 1.15-.74.35-.35.56-.68.74-1.15.14-.36.3-.89.35-1.87.058-1.24.07-1.61.07-4.77s-.012-3.53-.07-4.77c-.045-.98-.21-1.51-.35-1.87-.18-.47-.39-.8-.74-1.15-.35-.35-.68-.56-1.15-.74-.36-.14-.89-.3-1.87-.35-1.24-.058-1.61-.07-4.77-.07zm0 2.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 1.8a4.7 4.7 0 100 9.4 4.7 4.7 0 000-9.4zm5-2.7a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z" />
        </svg>
    );
}
function IconFacebook() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.4V12h2.4V9.7c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .17 2 .17v2.2h-1.1c-1.1 0-1.5.7-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12" />
        </svg>
    );
}
function IconTikTok() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M21 8.1a7.1 7.1 0 01-4.7-1.7v7.5a5.7 5.7 0 11-5-5.6v2.5a3.2 3.2 0 102.3 3.1V2h2.5c.3 1.7 1.6 3.1 3.2 3.6v2.5z" />
        </svg>
    );
}
function IconYouTube() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C17.6 2.5 12 2.5 12 2.5h0s-5.6 0-8.6.4c-.4.1-1.3.1-2.1 1-.6.7-.8 2.3-.8 2.3S0 7.9 0 9.7v1.7c0 1.8.2 3.5.2 3.5s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.8.2 7.6.4 8.6.4h0s5.6 0 8.6-.4c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.8.2-3.5V9.7c0-1.8-.2-3.5-.2-3.5zM9.6 13.7V7.5l6.2 3.1-6.2 3.1z" />
        </svg>
    );
}
function IconLinkedIn() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
            <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.1c.5-1 1.8-2.1 3.8-2.1 4.1 0 4.9 2.7 4.9 6.2V23h-4v-6.5c0-1.6 0-3.7-2.3-3.7-2.4 0-2.8 1.8-2.8 3.6V23h-4V8.5z" />
        </svg>
    );
}


export default function FloatingSocial({
    phone = "573212080985", // WhatsApp en formato internacional sin +
    instagram = "https://www.instagram.com/monicafritz_realtor?igsh=dGgyamNxOHFnb3Ru&utm_source=qr",
    facebook = "https://www.facebook.com/MonicaFritzPropiedades/",
    tiktok = "https://www.tiktok.com/@monicafritzrealtor?_t=ZS-8zpnfyXujaO&_r=1",
    youtube = "https://youtube.com/@monicafritzrealtor?si=mLJDFZLP6EAgP2RW",
    hidden = false,
    placement = "bottom",
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { track } = useSessionTracking();

    useEffect(() => {
        const check = () => setModalOpen(document.body.classList.contains("modal-open"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 700);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    if (hidden || modalOpen) return null;
    const items = [
        { name: "WhatsApp", color: brand.whatsapp, href: `https://wa.me/${phone}`, Icon: IconWhatsApp, bg: "#e6dace" },
        { name: "Instagram", color: brand.instagram, href: instagram, Icon: IconInstagram, bg: "#e6dace" },
        { name: "Facebook", color: brand.facebook, href: facebook, Icon: IconFacebook, bg: "#e6dace" },
        { name: "TikTok", color: brand.tiktok, href: tiktok, Icon: IconTikTok, bg: "#e6dace" },
        { name: "YouTube", color: brand.youtube, href: youtube, Icon: IconYouTube, bg: "#e6dace" },
    ];

    const wrapStyle = placement === "side"
        ? (isMobile ? sx.wrapBottomRight : sx.wrapSide)
        : sx.wrapBottom;

    return (
        <nav
            aria-label="Redes sociales"
            style={wrapStyle}
        >
            {items.map((item, idx) => {
                const { name, color, href, Icon } = item;
                return (
                    <a
                        key={href || idx}
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={name}
                        style={sx.item}
                        onClick={() => track("social_click", { action: "open_social", network: name, href })}
                    >
                        <span
                            style={sx.circle}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-2px) scale(1.07)";
                                e.currentTarget.style.background = "#d8a48f";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0) scale(1)";
                                e.currentTarget.style.background = "#faf9f6";
                            }}
                        >
                            <span style={{
                                ...sx.icon,
                                color: color,
                            }}>
                                <Icon />
                            </span>
                        </span>
                    </a>
                );
            })}
        </nav>
    );
}