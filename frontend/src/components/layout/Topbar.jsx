import { useNavigate } from "react-router-dom";
import {
    LogOut,
    Menu,
    Search,
    User as UserIcon,
    HelpCircle,
    ChevronDown,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import NotificationsBell from "./NotificationsBell";

const openPalette = () =>
    window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    );

export default function Topbar({ onMenu }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const name = user?.full_name || user?.username || "کاربر";

    return (
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6">
            <button
                onClick={onMenu}
                className="lg:hidden text-slate-400 hover:text-white shrink-0"
            >
                <Menu size={22} />
            </button>
            <button
                onClick={openPalette}
                className="flex items-center gap-2.5 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-500 hover:border-slate-700 transition"
            >
                <Search size={16} />
                <span className="flex-1 text-right">جستجوی سریع...</span>
                <kbd className="hidden sm:inline text-[10px] border border-slate-700 rounded px-1.5 py-0.5">
                    Ctrl K
                </kbd>
            </button>

            <div className="flex items-center gap-1">
            <NotificationsBell />

            <Dropdown
                align="start"
                trigger={
                    <button className="flex items-center gap-2.5 hover:bg-slate-800 rounded-xl px-2 py-1.5 transition">
                        <Avatar name={name} size="sm" />
                        <span className="text-sm text-slate-200 hidden sm:block">
                            {name}
                        </span>
                        <ChevronDown size={15} className="text-slate-500" />
                    </button>
                }
            >
                <DropdownItem
                    icon={UserIcon}
                    onClick={() => navigate("/settings")}
                >
                    پروفایل و تنظیمات
                </DropdownItem>
                <DropdownItem icon={HelpCircle} onClick={() => navigate("/guide")}>
                    راهنما
                </DropdownItem>
                <DropdownItem
                    icon={LogOut}
                    danger
                    onClick={() => {
                        logout();
                        navigate("/login", { replace: true });
                    }}
                >
                    خروج از حساب
                </DropdownItem>
            </Dropdown>
            </div>
        </header>
    );
}
