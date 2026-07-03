import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteSearchProvider } from "./context/SiteSearchContext";
import { SessionTrackingProvider } from "./context/SessionTrackingContext";
import AdminApp from "./pages/AdminApp";
import SRHome from "./pages/SRHome";
import SellPropertyPage from "./pages/SellPropertyPage";

export default function App() {
    return (
        <BrowserRouter>
            <SiteSearchProvider>
                <Routes>
                    <Route
                        path="/"
                        element={(
                            <SessionTrackingProvider>
                                <SRHome />
                            </SessionTrackingProvider>
                        )}
                    />
                    <Route
                        path="/vender"
                        element={(
                            <SessionTrackingProvider>
                                <SellPropertyPage />
                            </SessionTrackingProvider>
                        )}
                    />
                    <Route path="/admin/*" element={<AdminApp />} />
                </Routes>
            </SiteSearchProvider>
        </BrowserRouter>
    );
}
