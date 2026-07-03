import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);
    const close = useCallback(() => setIsOpen(false), []);

    // Close sidebar on route change (mobile navigation)
    useEffect(() => {
        close();
    }, [location.pathname, close]);

    // Close sidebar on Escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [close]);

    // Prevent body scroll when sidebar drawer is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("sidebar-open");
        } else {
            document.body.classList.remove("sidebar-open");
        }
        return () => document.body.classList.remove("sidebar-open");
    }, [isOpen]);

    // Swipe gestures to open/close sidebar on mobile devices
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Swipe must be horizontal, significant distance, and not too much vertical movement
            if (Math.abs(diffX) > 80 && Math.abs(diffY) < 50) {
                if (diffX > 0 && touchStartX < 40 && !isOpen) {
                    // Swipe right from the left edge of the screen: open
                    toggle();
                } else if (diffX < 0 && isOpen) {
                    // Swipe left: close
                    close();
                }
            }
        };

        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isOpen, toggle, close]);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, close }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};
