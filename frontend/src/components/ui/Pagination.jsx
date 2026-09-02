import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize = 12, count, onChange }) {
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    if (totalPages <= 1) return null;

    const go = (p) => onChange(Math.min(totalPages, Math.max(1, p)));

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= page - 1 && i <= page + 1)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "…") {
            pages.push("…");
        }
    }

    return (
        <div className="flex items-center justify-between gap-4 mt-6">
            <p className="text-sm text-slate-500">
                {count.toLocaleString("fa-IR")} مورد
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => go(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-40"
                >
                    <ChevronRight size={18} />
                </button>
                {pages.map((p, i) =>
                    p === "…" ? (
                        <span key={`e${i}`} className="px-2 text-slate-600">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => go(p)}
                            className={`min-w-9 h-9 rounded-lg text-sm transition ${
                                p === page
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800"
                            }`}
                        >
                            {p.toLocaleString("fa-IR")}
                        </button>
                    )
                )}
                <button
                    onClick={() => go(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-40"
                >
                    <ChevronLeft size={18} />
                </button>
            </div>
        </div>
    );
}
