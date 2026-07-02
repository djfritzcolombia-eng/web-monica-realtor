import { Outlet } from "react-router-dom";

export default function AdminLayout() {
    return (
        <>
            <style>{`
                html, body, #root {
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: block !important;
                    place-items: unset !important;
                    overflow: hidden;
                }
            `}</style>
            <Outlet />
        </>
    );
}
