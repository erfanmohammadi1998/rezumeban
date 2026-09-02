import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import CommandPalette from "../components/CommandPalette";

export default function DashboardLayout() {
    const [navOpen, setNavOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar onMenu={() => setNavOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
            <CommandPalette />
        </div>
    );
}
