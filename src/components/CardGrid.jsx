import React from "react";

const gridStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 28,
    width: "100%",
    marginTop: 0,
    maxWidth: "1400px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "0 0 32px 0",
    boxSizing: "border-box",
};

const gridResponsive = `
@media (max-width: 1100px) {
    .wasi-card-grid {
        grid-template-columns: 1fr !important;
        max-width: 100% !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
    }
}
@media (max-width: 700px) {
    .wasi-card-grid {
        gap: 16px !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
    }
}
`;

export default function CardGrid({ items, render }) {
    return (
        <>
            <style>{gridResponsive}</style>
            <div className="wasi-card-grid" style={gridStyles}>
                {items.map(render)}
            </div>
        </>
    );
}
