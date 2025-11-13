import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LoadingOverlay from "./LoadingOverlay";

export default function PageLoaderWrapper({ children }) {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // ✅ Immediately show loader when route changes
        setLoading(true);
        setShowContent(false);

        // Wait for fade-out + loading animation
        const timeout = setTimeout(() => {
            setLoading(false);
            setShowContent(true); // ✅ Only show page AFTER loader
        }, 600); // adjust animation duration freely

        return () => clearTimeout(timeout);
    }, [location]);

    return (
        <>
            {loading && <LoadingOverlay />}

            {/* Fade-in effect once loader finishes */}
            <div
                className={`transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"
                    }`}
            >
                {children}
            </div>
        </>
    );
}
