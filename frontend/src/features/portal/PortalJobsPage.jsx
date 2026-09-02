import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Briefcase, ArrowLeft } from "lucide-react";

import { publicApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import useDebounce from "../../hooks/useDebounce";
import { Card, Badge, Skeleton, EmptyState, ErrorState } from "../../components/ui";
import { Select } from "../../components/ui/form";
import {
    EMPLOYMENT_LABELS,
    fmtSalaryRange,
    fmtRelative,
} from "../../lib/format";

export default function PortalJobsPage() {
    const [q, setQ] = useState("");
    const [type, setType] = useState("");
    const [remote, setRemote] = useState(false);
    const search = useDebounce(q, 350);

    const query = useMemo(
        () => ({
            search: search || undefined,
            employment_type: type || undefined,
            is_remote: remote ? "true" : undefined,
        }),
        [search, type, remote]
    );
    const { data, loading, error, reload } = useAsync(
        () => publicApi.jobs(query),
        [JSON.stringify(query)]
    );
    const jobs = data || [];

    return (
        <div className="space-y-8">
            <div className="text-center py-6">
                <h1 className="text-3xl sm:text-4xl font-bold">فرصت‌های شغلی</h1>
                <p className="text-slate-400 mt-3">
                    به تیم ما بپیوندید — موقعیت‌های باز را ببینید و همین حالا درخواست دهید.
                </p>
            </div>

            <Card className="p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-56">
                    <Search
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="جستجوی عنوان شغلی..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                </div>
                <Select
                    className="w-44"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="">همه انواع</option>
                    {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </Select>
                <button
                    onClick={() => setRemote((r) => !r)}
                    className={`px-4 rounded-xl border text-sm transition ${
                        remote
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                >
                    فقط دورکاری
                </button>
            </Card>

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="در حال حاضر موقعیت بازی نیست" />
            ) : (
                <div className="grid gap-3">
                    {jobs.map((j) => (
                        <Link key={j.id} to={`/careers/${j.slug}`}>
                            <Card className="p-5 hover:border-blue-600/50 transition group">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold group-hover:text-blue-400">
                                            {j.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
                                            {j.department && <span>{j.department}</span>}
                                            <span className="flex items-center gap-1">
                                                <MapPin size={13} />
                                                {j.is_remote ? "دورکاری" : j.location || "—"}
                                            </span>
                                            <span>{EMPLOYMENT_LABELS[j.employment_type]}</span>
                                        </div>
                                    </div>
                                    <div className="text-left shrink-0">
                                        <Badge color="green">
                                            {fmtSalaryRange(j.salary_min, j.salary_max)}
                                        </Badge>
                                        <div className="text-xs text-slate-600 mt-2">
                                            {fmtRelative(j.published_at)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-blue-400 mt-4 opacity-0 group-hover:opacity-100 transition">
                                    مشاهده و درخواست
                                    <ArrowLeft size={14} />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
