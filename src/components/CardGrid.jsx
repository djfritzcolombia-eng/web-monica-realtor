import React from "react";

const gridStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
    gap: 20,
    width: "100%",
    marginTop: 0,
    maxWidth: "1600px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: '0 0 32px 0',
    boxSizing: 'border-box',
};

// Media queries responsivos
const gridResponsive = `
@media (max-width: 1700px) {
    .wasi-card-grid {
        grid-template-columns: repeat(2, minmax(420px, 1fr)) !important;
    }
}
@media (max-width: 1100px) {
    .wasi-card-grid {
        grid-template-columns: 1fr !important;
        max-width: 100vw !important;
        margin-left: 12px !important;
        margin-right: 12px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
    }
}
@media (max-width: 700px) {
    .wasi-card-grid {
        width: 100vw !important;
        max-width: 100vw !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
        grid-template-columns: 1fr !important;
        box-sizing: border-box !important;
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
