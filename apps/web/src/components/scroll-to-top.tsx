import { useEffect } from "react";
import { useLocation } from "react-router";

export function ScrollToTop() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) return;
    try {
      window.scrollTo({ left: 0, top: 0 });
    } catch {
      return;
    }
  }, [hash, pathname]);

  return null;
}
