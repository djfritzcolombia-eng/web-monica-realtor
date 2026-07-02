// src/pages/SRHome.styles.js

export const paginationStyles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "2.5rem 0 3rem 0",
        gap: "0.5rem",
        flexWrap: "wrap",
        background: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        padding: "12px 0",
        border: "none",
        minHeight: 56,
    },
    button: {
        padding: "0.5rem 1.1rem",
        border: "1px solid var(--border-nude, #e6dace)",
        borderRadius: "2px",
        backgroundColor: "var(--surface-bg, #fff)",
        color: "var(--color-topo-deep, #3a332c)",
        fontWeight: 600,
        fontFamily: 'var(--font-alt)',
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "all 0.18s ease",
        minWidth: "44px",
        boxShadow: "none",
        margin: "0 2px",
    },
    buttonHover: { backgroundColor: "var(--fill-nude, #f3ede6)", borderColor: "var(--color-terracotta, #d8a48f)" },
    activeButton: {
        backgroundColor: "var(--color-topo-deep, #3a332c)",
        color: "#fff",
        borderColor: "var(--color-topo-deep, #3a332c)",
        boxShadow: "none",
    },
    disabledButton: { opacity: 0.5, cursor: "not-allowed" },
    info: { margin: "0 1.2rem", color: "#6e6259", fontSize: "1.01rem", fontFamily: 'var(--font-main)' },
};

export const bandStyles = {
    wrap: {
        borderRadius: 0,
        padding: 0,
        margin: 0,
        boxShadow: "none",
        background: "none",
        border: "none",
    },
};

