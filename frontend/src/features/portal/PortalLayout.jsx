import { Link, Outlet } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../../config/modules";

export default function PortalLayout() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/careers" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                            {APP_NAME[0]}
                        </div>
                        <div>
                            <div className="font-bold leading-tight">{APP_NAME}</div>
                            <div className="text-[11px] text-slate-500">{APP_TAGLINE}</div>
                        </div>
                    </Link>
                    <Link
                        to="/login"
                        className="text-sm text-slate-400 hover:text-slate-100"
                    >
                        ورود کارفرما
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
                <Outlet />
            </main>

            <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
                © {new Date().getFullYear()} {APP_NAME}
            </footer>
        </div>
    );
}
