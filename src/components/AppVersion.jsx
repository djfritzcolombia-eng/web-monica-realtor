import { APP_VERSION } from "../config/version";

export default function AppVersion() {
    return (
        <footer
            style={{
                width: "100%",
                padding: "16px 12px 20px",
                textAlign: "center",
                fontSize: 12,
                color: "#9a8f84",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
                letterSpacing: 0.2,
            }}
        >
            Versión {APP_VERSION}
        </footer>
    );
}
