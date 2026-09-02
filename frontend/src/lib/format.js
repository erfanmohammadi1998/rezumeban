export const fmtDate = (v, opts) => {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleDateString("fa-IR", opts);
    } catch {
        return "—";
    }
};

export const fmtDateTime = (v) =>
    fmtDate(v, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const fmtRelative = (v) => {
    if (!v) return "—";
    const diff = (Date.now() - new Date(v).getTime()) / 1000;
    const d = Math.floor(diff / 86400);
    if (diff < 60) return "همین حالا";
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    if (d < 30) return `${d} روز پیش`;
    return fmtDate(v);
};

export const fmtMoney = (v) => {
    if (v == null || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return v;
    if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fa-IR")} میلیون تومان`;
    return `${n.toLocaleString("fa-IR")} تومان`;
};

export const fmtSalaryRange = (min, max) => {
    if (!min && !max) return "توافقی";
    if (min && max)
        return `${(min / 1_000_000).toLocaleString("fa-IR")} تا ${(max / 1_000_000).toLocaleString("fa-IR")} میلیون`;
    return fmtMoney(min || max);
};

export const fmtNum = (n) => Number(n || 0).toLocaleString("fa-IR");

// --- label maps ---------------------------------------------------------- //
export const SOURCE_LABELS = {
    website: "وب‌سایت",
    linkedin: "لینکدین",
    referral: "معرفی",
    job_board: "سایت کاریابی",
    agency: "آژانس",
    event: "رویداد",
    other: "سایر",
};

export const EMPLOYMENT_LABELS = {
    full_time: "تمام‌وقت",
    part_time: "پاره‌وقت",
    contract: "قراردادی",
    internship: "کارآموزی",
    temporary: "موقت",
};

export const JOB_STATUS_LABELS = {
    draft: "پیش‌نویس",
    open: "باز",
    on_hold: "متوقف",
    closed: "بسته",
};

export const JOB_STATUS_COLORS = {
    draft: "slate",
    open: "green",
    on_hold: "amber",
    closed: "red",
};

export const APP_STATUS_LABELS = {
    active: "فعال",
    hired: "استخدام‌شده",
    rejected: "رد شده",
    withdrawn: "انصراف",
};

export const APP_STATUS_COLORS = {
    active: "blue",
    hired: "green",
    rejected: "red",
    withdrawn: "slate",
};

export const INTERVIEW_TYPE_LABELS = {
    phone: "تلفنی",
    video: "ویدیویی",
    onsite: "حضوری",
    technical: "فنی",
    hr: "منابع انسانی",
    final: "نهایی",
};

export const INTERVIEW_STATUS_LABELS = {
    scheduled: "زمان‌بندی‌شده",
    completed: "برگزار شده",
    cancelled: "لغو شده",
    no_show: "عدم حضور",
};

export const INTERVIEW_STATUS_COLORS = {
    scheduled: "blue",
    completed: "green",
    cancelled: "red",
    no_show: "amber",
};

export const RECOMMENDATION_LABELS = {
    strong_yes: "کاملاً موافق",
    yes: "موافق",
    no: "مخالف",
    strong_no: "کاملاً مخالف",
};

export const SKILL_LEVEL_LABELS = {
    Beginner: "مبتدی",
    Intermediate: "متوسط",
    Advanced: "پیشرفته",
    Expert: "خبره",
};
