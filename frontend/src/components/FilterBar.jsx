import { Search, X } from "lucide-react";
import { Card, Button } from "./ui";
import { Select } from "./ui/form";

/**
 * Consistent filter row for list pages.
 *
 * search  : { value, onChange, placeholder }   (optional)
 * selects : [{ key, value, onChange, allLabel, options:[{value,label}] }]
 * toggles : [{ key, label, active, onClick }]  (optional pill buttons)
 * activeCount / onClear : show a "clear filters" button
 */
export default function FilterBar({
    search,
    selects = [],
    toggles = [],
    activeCount = 0,
    onClear,
    children,
}) {
    return (
        <Card className="p-4 flex flex-wrap items-center gap-3">
            {search && (
                <div className="relative flex-1 min-w-56">
                    <Search
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        value={search.value}
                        onChange={(e) => search.onChange(e.target.value)}
                        placeholder={search.placeholder || "جستجو..."}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                </div>
            )}

            {selects.map((s) => (
                <Select
                    key={s.key}
                    className="w-40"
                    value={s.value}
                    onChange={(e) => s.onChange(e.target.value)}
                >
                    <option value="">{s.allLabel || "همه"}</option>
                    {s.options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </Select>
            ))}

            {toggles.map((t) => (
                <button
                    key={t.key}
                    onClick={t.onClick}
                    className={`px-4 py-2 rounded-xl border text-sm transition ${
                        t.active
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                >
                    {t.label}
                </button>
            ))}

            {children}

            {activeCount > 0 && (
                <Button variant="ghost" size="sm" icon={X} onClick={onClear}>
                    پاک کردن فیلترها ({activeCount.toLocaleString("fa-IR")})
                </Button>
            )}
        </Card>
    );
}
