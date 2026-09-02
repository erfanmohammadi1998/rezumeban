import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    KanbanSquare,
    CalendarClock,
    Radar,
    BarChart3,
    History,
    HelpCircle,
    Settings,
    Globe,
    X,
} from "lucide-react";

import { MODULES, APP_NAME, APP_TAGLINE } from "../../config/modules";

const ALL_ITEMS = [
    { to: "/", label: "داشبورد", icon: LayoutDashboard, module: "dashboard", end: true },
    { to: "/candidates", label: "کاندیداها", icon: Users, module: "candidates" },
    { to: "/jobs", label: "آگهی‌های شغلی", icon: Briefcase, module: "jobs" },
    { to: "/pipeline", label: "پایپ‌لاین استخدام", icon: KanbanSquare, module: "pipeline" },
    { to: "/interviews", label: "مصاحبه‌ها", icon: CalendarClock, module: "interviews" },
    { to: "/sourcing", label: "منبع‌یابی", icon: Radar, module: "sourcing" },
    { to: "/reports", label: "گزارش‌ها", icon: BarChart3, module: "reports" },
    { to: "/activity", label: "فعالیت‌ها", icon: History, module: "candidates" },
    { to: "/guide", label: "راهنما", icon: HelpCircle, module: "candidates" },
    { to: "/settings", label: "تنظیمات", icon: Settings, module: "settings" },
];

export default function Sidebar({ open = false, onClose }) {
    const items = ALL_ITEMS.filter((i) => MODULES[i.module]);

    return (
        <>
            {open && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                />
            )}
            <aside
                className={`fixed lg:static inset-y-0 right-0 z-50 w-64 shrink-0 min-h-screen bg-slate-900 border-l border-slate-800 flex flex-col transition-transform lg:translate-x-0 ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                            {APP_NAME[0]}
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-100 leading-tight">
                                {APP_NAME}
                            </h1>
                            <p className="text-[11px] text-slate-500">{APP_TAGLINE}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden text-slate-500 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                }`
                            }
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {MODULES.portal && (
                    <div className="p-3">
                        <a
                            href="/careers"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                        >
                            <Globe size={18} />
                            پورتال عمومی
                        </a>
                    </div>
                )}
            </aside>
        </>
    );
}
