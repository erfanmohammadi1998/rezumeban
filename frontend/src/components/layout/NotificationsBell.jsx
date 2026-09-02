import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";

import { activityApi } from "../../api/client";
import { fmtRelative } from "../../lib/format";

const SEEN_KEY = "notif_seen_at";

export default function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [seenAt, setSeenAt] = useState(() => {
        try {
            return localStorage.getItem(SEEN_KEY) || "";
        } catch {
            return "";
        }
    });
    const ref = useRef(null);
    const navigate = useNavigate();

    const load = () => {
        activityApi
            .list({ page: 1 })
            .then((d) => setItems(d.results?.slice(0, 10) || []))
            .catch(() => {});
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const unread = items.filter(
        (a) => !seenAt || new Date(a.created_at) > new Date(seenAt)
    ).length;

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && items[0]) {
            const now = items[0].created_at;
            setSeenAt(now);
            try {
                localStorage.setItem(SEEN_KEY, now);
            } catch {
                /* private mode */
            }
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggle}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="اعلان‌ها"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                        {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-40"
                    >
                        <div className="px-4 py-2.5 border-b border-slate-700 text-sm font-medium text-slate-200">
                            اعلان‌ها
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {items.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    اعلانی نیست
                                </p>
                            ) : (
                                items.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => {
                                            setOpen(false);
                                            if (a.candidate)
                                                navigate(`/candidates/${a.candidate}`);
                                            else navigate("/activity");
                                        }}
                                        className="w-full text-right px-4 py-3 hover:bg-slate-700/60 border-b border-slate-800 last:border-0"
                                    >
                                        <p className="text-sm text-slate-200 leading-snug">
                                            {a.verb}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {a.actor?.full_name
                                                ? `${a.actor.full_name} · `
                                                : ""}
                                            {fmtRelative(a.created_at)}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate("/activity");
                            }}
                            className="w-full py-2.5 text-sm text-blue-400 hover:bg-slate-700/60 border-t border-slate-700"
                        >
                            مشاهده همه فعالیت‌ها
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
