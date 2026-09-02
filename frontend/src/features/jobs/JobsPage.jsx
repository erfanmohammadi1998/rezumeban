import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, MapPin, Users } from "lucide-react";

import { jobsApi, metaApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import useDebounce from "../../hooks/useDebounce";
import useUrlFilters from "../../hooks/useUrlFilters";
import {
    Button,
    Card,
    Badge,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/ui/Pagination";
import {
    JOB_STATUS_LABELS,
    JOB_STATUS_COLORS,
    EMPLOYMENT_LABELS,
    fmtSalaryRange,
} from "../../lib/format";
import JobForm from "./JobForm";

const ORDERINGS = [
    { value: "-created_at", label: "جدیدترین" },
    { value: "created_at", label: "قدیمی‌ترین" },
    { value: "title", label: "عنوان (الف-ی)" },
    { value: "-published_at", label: "تازه‌منتشرشده" },
];

const FILTER_KEYS = ["search", "status", "employment_type", "department", "is_remote", "ordering"];

export default function JobsPage() {
    const { get, patch, clear } = useUrlFilters();
    const [formOpen, setFormOpen] = useState(false);

    const status = get("status");
    const employment_type = get("employment_type");
    const department = get("department");
    const is_remote = get("is_remote");
    const ordering = get("ordering", "-created_at");
    const urlSearch = get("search");
    const page = Number(get("page", "1"));

    const [searchInput, setSearchInput] = useState(urlSearch);
    const debounced = useDebounce(searchInput, 400);
    const [lastSearch, setLastSearch] = useState(urlSearch);
    if (urlSearch !== lastSearch) {
        setLastSearch(urlSearch);
        if (urlSearch !== debounced) setSearchInput(urlSearch);
    }
    useEffect(() => {
        if (debounced !== urlSearch) patch({ search: debounced });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    const { data: departments } = useAsync(() => metaApi.departments(), []);

    const query = useMemo(
        () => ({
            search: urlSearch || undefined,
            status: status || undefined,
            employment_type: employment_type || undefined,
            department: department || undefined,
            is_remote: is_remote || undefined,
            ordering,
            page,
        }),
        [urlSearch, status, employment_type, department, is_remote, ordering, page]
    );
    const { data, loading, error, reload } = useAsync(
        () => jobsApi.list(query),
        [JSON.stringify(query)]
    );

    const results = data?.results || [];
    const count = data?.count || 0;
    const activeCount = FILTER_KEYS.filter(
        (k) => get(k) && !(k === "ordering" && get(k) === "-created_at")
    ).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">آگهی‌های شغلی</h1>
                    <p className="text-slate-500 mt-1">{count.toLocaleString("fa-IR")} آگهی</p>
                </div>
                <Button icon={Plus} onClick={() => setFormOpen(true)}>
                    آگهی جدید
                </Button>
            </div>

            <FilterBar
                search={{
                    value: searchInput,
                    onChange: setSearchInput,
                    placeholder: "عنوان، شرح، موقعیت...",
                }}
                selects={[
                    {
                        key: "status",
                        value: status,
                        onChange: (v) => patch({ status: v }),
                        allLabel: "همه وضعیت‌ها",
                        options: Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    },
                    {
                        key: "employment_type",
                        value: employment_type,
                        onChange: (v) => patch({ employment_type: v }),
                        allLabel: "همه انواع",
                        options: Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    },
                    {
                        key: "department",
                        value: department,
                        onChange: (v) => patch({ department: v }),
                        allLabel: "همه دپارتمان‌ها",
                        options: (departments || []).map((d) => ({
                            value: String(d.id),
                            label: d.name,
                        })),
                    },
                    {
                        key: "ordering",
                        value: ordering,
                        onChange: (v) => patch({ ordering: v }, { resetPage: false }),
                        allLabel: "جدیدترین",
                        options: ORDERINGS.filter((o) => o.value !== "-created_at"),
                    },
                ]}
                toggles={[
                    {
                        key: "remote",
                        label: "دورکاری",
                        active: is_remote === "true",
                        onClick: () => patch({ is_remote: is_remote ? "" : "true" }),
                    },
                ]}
                activeCount={activeCount}
                onClear={() => {
                    setSearchInput("");
                    clear(FILTER_KEYS);
                }}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <EmptyState
                    icon={Briefcase}
                    title="آگهی‌ای یافت نشد"
                    action={
                        <Button icon={Plus} onClick={() => setFormOpen(true)}>
                            آگهی جدید
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-3">
                    {results.map((j) => (
                        <Card key={j.id} className="p-5 hover:border-slate-700 transition">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <Link
                                        to={`/jobs/${j.slug}`}
                                        className="text-lg font-semibold text-slate-100 hover:text-blue-400"
                                    >
                                        {j.title}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1.5">
                                        {j.department?.name && <span>{j.department.name}</span>}
                                        <span className="flex items-center gap-1">
                                            <MapPin size={13} />
                                            {j.is_remote ? "دورکاری" : j.location || "—"}
                                        </span>
                                        <span>{EMPLOYMENT_LABELS[j.employment_type]}</span>
                                        <span>{fmtSalaryRange(j.salary_min, j.salary_max)}</span>
                                    </div>
                                </div>
                                <Badge color={JOB_STATUS_COLORS[j.status]}>
                                    {JOB_STATUS_LABELS[j.status]}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    {j.application_count?.toLocaleString("fa-IR") || "۰"} درخواست
                                </span>
                                <span className="text-slate-600">
                                    {j.active_application_count?.toLocaleString("fa-IR") || "۰"} فعال
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Pagination
                page={page}
                count={count}
                onChange={(p) => patch({ page: p }, { resetPage: false })}
            />

            <JobForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} />
        </div>
    );
}
