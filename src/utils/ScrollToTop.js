import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = ({ targetRef }) => {
    const { pathname } = useLocation();

    useEffect (() => {
        requestAnimationFrame(() => {
            const el = targetRef?.current;
            if (el) {
                el.scrollTop = 0;
            } else {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto'  });
            }
        });
    }, [pathname, targetRef]);

    return null;
}