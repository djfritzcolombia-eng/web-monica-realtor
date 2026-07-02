export default function GlobalReset() {
    return (
        <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; }
      body { overflow-x: hidden; background: #faf9f6; }
    `}</style>
    );
}
