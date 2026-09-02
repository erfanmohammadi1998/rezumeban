import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Search,
    LayoutDashboard,
    Users,
    Briefcase,
    KanbanSquare,
    CalendarClock,
    Radar,
    BarChart3,
    Settings,
    UserPlus,
    CornerDownLeft,
} from "lucide-react";

import { candidatesApi, jobsApi } from "../api/client";
import { MODULES } from "../config/modules";
import useDebounce from "../hooks/useDebounce";
import Avatar from "./ui/Avatar";

const EMPTY_REMOTE = { candidates: [], jobs: [] };

const NAV = [
    { label: "داشبورد", to: "/", icon: LayoutDashboard, module: "dashboard" },
    { label: "کاندیداها", to: "/candidates", icon: Users, module: "candidates" },
    { label: "افزودن کاندیدا", to: "/candidates?new=1", icon: UserPlus, module: "candidates" },
    { label: "آگهی‌های شغلی", to: "/jobs", icon: Briefcase, module: "jobs" },
    { label: "پایپ‌لاین استخدام", to: "/pipeline", icon: KanbanSquare, module: "pipeline" },
    { label: "مصاحبه‌ها", to: "/interviews", icon: CalendarClock, module: "interviews" },
    { label: "منبع‌یابی", to: "/sourcing", icon: Radar, module: "sourcing" },
    { label: "گزارش‌ها", to: "/reports", icon: BarChart3, module: "reports" },
    { label: "تنظیمات", to: "/settings", icon: Settings, module: "settings" },
];

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [active, setActive] = useState(0);
    const [remote, setRemote] = useState({ candidates: [], jobs: [] });
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const debounced = useDebounce(q, 250);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => {
                    if (!o) {
                        setQ("");
                        setActive(0);
                        setRemote({ candidates: [], jobs: [] });
                    }
                    return !o;
                });
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // focus the input once the overlay is mounted
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 40);
            return () => clearTimeout(t);
        }
    }, [open]);

    const queryReady = open && debounced.trim().length >= 2;

    useEffect(() => {
        if (!queryReady) return;
        let cancelled = false;
        const params = { search: debounced, page_size: 5 };
        Promise.all([
            candidatesApi.list(params).catch(() => ({ results: [] })),
            MODULES.jobs
                ? jobsApi.list(params).catch(() => ({ results: [] }))
                : Promise.resolve({ results: [] }),
        ]).then(([c, j]) => {
            if (!cancelled)
                setRemote({
                    candidates: c.results || [],
                    jobs: j.results || [],
                });
        });
        return () => {
            cancelled = true;
        };
    }, [debounced, queryReady]);

    const remoteShown = queryReady ? remote : EMPTY_REMOTE;

    const navItems = useMemo(
        () =>
            NAV.filter((n) => MODULES[n.module]).filter(
                (n) => !q || n.label.includes(q)
            ),
        [q]
    );

    const items = useMemo(() => {
        const list = navItems.map((n) => ({
            type: "nav",
            key: `nav-${n.to}`,
            label: n.label,
            icon: n.icon,
            run: () => navigate(n.to),
        }));
        remoteShown.candidates.forEach((c) =>
            list.push({
                type: "candidate",
                key: `c-${c.id}`,
                label: c.full_name,
                sub: c.headline,
                photo: c.photo,
                run: () => navigate(`/candidates/${c.id}`),
            })
        );
        remoteShown.jobs.forEach((j) =>
            list.push({
                type: "job",
                key: `j-${j.id}`,
                label: j.title,
                sub: j.department?.name,
                icon: Briefcase,
                run: () => navigate(`/jobs/${j.slug}`),
            })
        );
        return list;
    }, [navItems, remoteShown, navigate]);

    const choose = (item) => {
        item.run();
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter" && items[active]) {
            e.preventDefault();
            choose(items[active]);
        }
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 border-b border-slate-800">
                            <Search size={18} className="text-slate-500" />
                            <input
                                ref={inputRef}
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setActive(0);
                                }}
                                onKeyDown={onKeyDown}
                                placeholder="جستجو یا رفتن به..."
                                className="flex-1 bg-transparent py-4 text-sm outline-none text-slate-100"
                            />
                            <kbd className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">
                                ESC
                            </kbd>
                        </div>

                        <div className="max-h-80 overflow-y-auto py-2">
                            {items.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    نتیجه‌ای نیست
                                </p>
                            ) : (
                                items.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.key}
                                            onMouseEnter={() => setActive(i)}
                                            onClick={() => choose(item)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-right ${
                                                i === active ? "bg-slate-800" : ""
                                            }`}
                                        >
                                            {item.photo !== undefined ? (
                                                <Avatar
                                                    name={item.label}
                                                    src={item.photo}
                                                    size="sm"
                                                />
                                            ) : Icon ? (
                                                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    <Icon size={15} className="text-slate-400" />
                                                </span>
                                            ) : null}
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm text-slate-200 truncate">
                                                    {item.label}
                                                </span>
                                                {item.sub && (
                                                    <span className="block text-xs text-slate-500 truncate">
                                                        {item.sub}
                                                    </span>
                                                )}
                                            </span>
                                            {i === active && (
                                                <CornerDownLeft
                                                    size={14}
                                                    className="text-slate-600"
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
