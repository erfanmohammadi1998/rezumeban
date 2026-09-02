/**
 * رزومه‌بان — سامانهٔ دریافت و مدیریت رزومه برای شرکت‌ها.
 *
 * All modules ship on by default. VITE_APP_MODE=cv builds a lighter
 * résumé-bank-only variant (no jobs / pipeline / interviews / portal).
 */
const MODE = (import.meta.env.VITE_APP_MODE || "full").toLowerCase();

export const APP_MODE = MODE === "cv" ? "cv" : "full";

export const MODULES = {
    candidates: true,
    dashboard: true,
    jobs: APP_MODE === "full",
    pipeline: APP_MODE === "full",
    interviews: APP_MODE === "full",
    sourcing: APP_MODE === "full",
    reports: APP_MODE === "full",
    portal: APP_MODE === "full",
    settings: true,
};

export const isEnabled = (name) => Boolean(MODULES[name]);

export const APP_NAME = "رزومه‌بان";
export const APP_TAGLINE = "دریافت و مدیریت رزومه";
