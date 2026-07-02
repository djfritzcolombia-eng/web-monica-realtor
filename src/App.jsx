import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SessionTrackingProvider } from "./context/SessionTrackingContext";
import AdminApp from "./pages/AdminApp";
import SRHome from "./pages/SRHome";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={(
                        <SessionTrackingProvider>
                            <SRHome />
                        </SessionTrackingProvider>
                    )}
                />
                <Route path="/admin/*" element={<AdminApp />} />
            </Routes>
        </BrowserRouter>
    );
}
