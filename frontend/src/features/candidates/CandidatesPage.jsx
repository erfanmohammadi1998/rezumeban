import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Star, Users } from "lucide-react";

import { candidatesApi, metaApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import useDebounce from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Badge,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import FilterBar from "../../components/FilterBar";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";
import Pagination from "../../components/ui/Pagination";
import { SOURCE_LABELS, fmtRelative } from "../../lib/format";
import CandidateForm from "./CandidateForm";
import BulkActions from "./BulkActions";

const ORDERINGS = [
    { value: "-created_at", label: "جدیدترین" },
    { value: "created_at", label: "قدیمی‌ترین" },
    { value: "-rating", label: "بیشترین امتیاز" },
    { value: "last_name", label: "نام خانوادگی (الف-ی)" },
];

const RATING_OPTS = [5, 4, 3, 2, 1].map((n) => ({
    value: String(n),
    label: `${"★".repeat(n)} و بالاتر`,
}));

const FILTER_KEYS = [
    "search",
    "source",
    "is_favorite",
    "rating__gte",
    "tags",
    "ordering",
];

export default function CandidatesPage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const [formOpen, setFormOpen] = useState(false);
    const [selected, setSelected] = useState(() => new Set());

    // command palette / deep link: ?new=1 opens the create form
    const [newHandled, setNewHandled] = useState(false);
    if (params.get("new") && !newHandled) {
        setNewHandled(true);
        setFormOpen(true);
        params.delete("new");
        setParams(params, { replace: true });
    }

    const search = params.get("search") || "";
    const source = params.get("source") || "";
    const favorite = params.get("is_favorite") || "";
    const minRating = params.get("rating__gte") || "";
    const tag = params.get("tags") || "";
    const ordering = params.get("ordering") || "-created_at";
    const page = Number(params.get("page") || 1);

    const { data: tags } = useAsync(() => metaApi.tags(), []);

    const [searchInput, setSearchInput] = useState(search);
    const debouncedSearch = useDebounce(searchInput, 400);

    const patch = (next, { resetPage = true } = {}) => {
        setParams((prev) => {
            const p = new URLSearchParams(prev);
            Object.entries(next).forEach(([k, v]) => {
                if (v === "" || v == null) p.delete(k);
                else p.set(k, v);
            });
            if (resetPage) p.delete("page");
            return p;
        });
    };

    // keep the URL search param in sync with the debounced input
    useEffect(() => {
        if (debouncedSearch !== search) patch({ search: debouncedSearch });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    // external navigations (e.g. Topbar) change the URL — mirror it into the input
    const [lastSearch, setLastSearch] = useState(search);
    if (search !== lastSearch) {
        setLastSearch(search);
        if (search !== debouncedSearch) setSearchInput(search);
    }

    const query = useMemo(
        () => ({
            search: search || undefined,
            source: source || undefined,
            is_favorite: favorite || undefined,
            rating__gte: minRating || undefined,
            tags: tag || undefined,
            ordering,
            page,
        }),
        [search, source, favorite, minRating, tag, ordering, page]
    );

    const { data, loading, error, reload } = useAsync(
        () => candidatesApi.list(query),
        [JSON.stringify(query)]
    );

    const results = data?.results || [];
    const count = data?.count || 0;

    const toggleOne = (id) =>
        setSelected((s) => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    const allOnPageSelected =
        results.length > 0 && results.every((c) => selected.has(c.id));
    const toggleAll = () =>
        setSelected((s) => {
            const next = new Set(s);
            if (allOnPageSelected) results.forEach((c) => next.delete(c.id));
            else results.forEach((c) => next.add(c.id));
            return next;
        });

    const remove = async (c) => {
        if (!confirm(`«${c.full_name}» حذف شود؟`)) return;
        try {
            await candidatesApi.remove(c.id);
            toast.success("کاندیدا حذف شد");
            reload();
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">کاندیداها</h1>
                    <p className="text-slate-500 mt-1">
                        {count.toLocaleString("fa-IR")} کاندیدا در بانک رزومه
                    </p>
                </div>
                <Button icon={Plus} onClick={() => setFormOpen(true)}>
                    افزودن کاندیدا
                </Button>
            </div>

            <FilterBar
                search={{
                    value: searchInput,
                    onChange: setSearchInput,
                    placeholder: "نام، مهارت، شرکت، عنوان شغلی...",
                }}
                selects={[
                    {
                        key: "source",
                        value: source,
                        onChange: (v) => patch({ source: v }),
                        allLabel: "همه منابع",
                        options: Object.entries(SOURCE_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    },
                    {
                        key: "rating__gte",
                        value: minRating,
                        onChange: (v) => patch({ "rating__gte": v }),
                        allLabel: "هر امتیازی",
                        options: RATING_OPTS,
                    },
                    {
                        key: "tags",
                        value: tag,
                        onChange: (v) => patch({ tags: v }),
                        allLabel: "همه برچسب‌ها",
                        options: (tags || []).map((t) => ({
                            value: String(t.id),
                            label: t.name,
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
                        key: "fav",
                        label: "نشان‌شده‌ها",
                        active: favorite === "true",
                        onClick: () => patch({ is_favorite: favorite ? "" : "true" }),
                    },
                ]}
                activeCount={
                    FILTER_KEYS.filter(
                        (k) =>
                            params.get(k) &&
                            !(k === "ordering" && params.get(k) === "-created_at")
                    ).length
                }
                onClear={() => {
                    setSearchInput("");
                    patch(
                        Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])),
                        { resetPage: true }
                    );
                }}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="کاندیدایی یافت نشد"
                    description="فیلترها را تغییر دهید یا کاندیدای جدیدی اضافه کنید."
                    action={
                        <Button icon={Plus} onClick={() => setFormOpen(true)}>
                            افزودن کاندیدا
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-500 px-4 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600"
                        />
                        انتخاب همه در این صفحه
                    </label>
                    {results.map((c) => (
                        <Card
                            key={c.id}
                            className={`p-4 flex items-center gap-4 transition ${
                                selected.has(c.id)
                                    ? "border-blue-600/60 bg-blue-600/5"
                                    : "hover:border-slate-700"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={selected.has(c.id)}
                                onChange={() => toggleOne(c.id)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 shrink-0"
                            />
                            <Avatar name={c.full_name} src={c.photo} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/candidates/${c.id}`}
                                        className="font-medium text-slate-100 hover:text-blue-400 truncate"
                                    >
                                        {c.full_name}
                                    </Link>
                                    {c.is_favorite && (
                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                    )}
                                </div>
                                <div className="text-sm text-slate-500 truncate">
                                    {c.headline || "—"}
                                    {c.location ? ` · ${c.location}` : ""}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {(c.top_skills || []).map((s) => (
                                        <Badge key={s} color="slate">
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="text-left shrink-0 space-y-1">
                                <StarRating value={c.rating} readOnly size={14} />
                                <div className="text-xs text-slate-600">
                                    {fmtRelative(c.created_at)}
                                </div>
                                <button
                                    onClick={() => remove(c)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    حذف
                                </button>
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

            <CandidateForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSaved={reload}
            />

            {selected.size > 0 && (
                <BulkActions
                    ids={[...selected]}
                    query={query}
                    onClear={() => setSelected(new Set())}
                    onChanged={() => {
                        setSelected(new Set());
                        reload();
                    }}
                />
            )}
        </div>
    );
}
