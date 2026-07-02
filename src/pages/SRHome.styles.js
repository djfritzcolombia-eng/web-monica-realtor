// src/pages/SRHome.styles.js

export const paginationStyles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "2.5rem 0 3rem 0",
        gap: "0.5rem",
        flexWrap: "wrap",
        background: "#faf9f6",
        borderRadius: "18px",
        boxShadow: "0 2px 12px 0 rgba(214,164,143,0.07)",
        padding: "18px 32px 18px 32px",
        border: "1.5px solid #e6dace",
        minHeight: 56,
    },
    button: {
        padding: "0.5rem 1.3rem",
        border: "1.5px solid #e6dace",
        borderRadius: "10px",
        backgroundColor: "#fff",
        color: "#6e4a2b",
        fontWeight: 700,
        fontFamily: 'var(--font-alt)',
        fontSize: "1.08rem",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
        minWidth: "44px",
        boxShadow: "0 2px 8px 0 rgba(214,164,143,0.06)",
        margin: "0 2px",
    },
    buttonHover: { backgroundColor: "#f3ede6", borderColor: "#d8a48f" },
    activeButton: {
        backgroundColor: "#d8a48f",
        color: "#fff",
        borderColor: "#d8a48f",
        boxShadow: "0 4px 16px 0 rgba(214,164,143,0.10)",
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

