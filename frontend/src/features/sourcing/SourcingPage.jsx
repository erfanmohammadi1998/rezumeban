import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Download,
    X,
    Play,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Users,
    Briefcase,
} from "lucide-react";

import { sourcingApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Badge,
    Skeleton,
    ErrorState,
    SectionTitle,
} from "../../components/ui";
import { Field, Input, Select } from "../../components/ui/form";
import Tabs from "../../components/ui/Tabs";

const KINDS = [
    { key: "jobs", label: "آگهی شغلی", icon: Briefcase },
    { key: "candidates", label: "کاندیدا", icon: Users },
];

const STATUS_META = {
    new: { label: "جدید", color: "blue" },
    imported: { label: "وارد شده", color: "green" },
    dismissed: { label: "رد شده", color: "slate" },
};

function ResultCard({ result, onImport, onDismiss, busy }) {
    const meta = STATUS_META[result.status] || STATUS_META.new;
    const imported = result.status === "imported";
    const dismissed = result.status === "dismissed";
    return (
        <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-100">{result.title}</span>
                        <Badge color={meta.color}>{meta.label}</Badge>
                        {result.score != null && (
                            <span className="text-xs text-slate-500">
                                امتیاز {Math.round(result.score)}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{result.subtitle}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        <span>{result.provider}</span>
                        {result.location && <span>· {result.location}</span>}
                        {result.url && (
                            <a
                                href={result.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            >
                                <ExternalLink size={12} />
                                منبع
                            </a>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                    {imported ? (
                        <Link
                            to={
                                result.imported_candidate
                                    ? `/candidates/${result.imported_candidate}`
                                    : result.imported_job
                                    ? "/jobs"
                                    : "#"
                            }
                            className="text-xs text-green-400 flex items-center gap-1"
                        >
                            <CheckCircle2 size={14} />
                            مشاهده
                        </Link>
                    ) : dismissed ? null : (
                        <>
                            <Button
                                size="sm"
                                icon={Download}
                                loading={busy === "import"}
                                onClick={() => onImport(result)}
                            >
                                وارد کردن
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                icon={X}
                                loading={busy === "dismiss"}
                                onClick={() => onDismiss(result)}
                            >
                                رد
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}

function SavedSearches({ onRan }) {
    const toast = useToast();
    const { data, loading, reload } = useAsync(() => sourcingApi.savedSearches(), []);
    const [runningId, setRunningId] = useState(null);
    const list = data?.results || data || [];

    if (loading || list.length === 0) return null;

    const run = async (s) => {
        setRunningId(s.id);
        try {
            const res = await sourcingApi.runSavedSearch(s.id);
            toast.success(
                `«${s.name}»: ${res.count} نتیجه` +
                    (res.auto_imported ? ` · ${res.auto_imported} وارد شد` : "")
            );
            onRan?.();
        } catch {
            toast.error("اجرای جستجو ناموفق بود");
        } finally {
            setRunningId(null);
        }
    };

    return (
        <Card className="p-5">
            <SectionTitle>جستجوهای ذخیره‌شده</SectionTitle>
            <div className="divide-y divide-slate-800">
                {list.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5">
                        <div>
                            <div className="text-sm text-slate-200">{s.name}</div>
                            <div className="text-xs text-slate-600">
                                {s.provider} · {s.kind === "jobs" ? "آگهی" : "کاندیدا"}
                                {s.last_result_count != null
                                    ? ` · آخرین: ${s.last_result_count}`
                                    : ""}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={Play}
                                loading={runningId === s.id}
                                onClick={() => run(s)}
                            >
                                اجرا
                            </Button>
                            <button
                                onClick={() =>
                                    sourcingApi
                                        .removeSavedSearch(s.id)
                                        .then(reload)
                                        .catch(() => toast.error("حذف ناموفق بود"))
                                }
                                className="text-slate-500 hover:text-red-400 p-1.5"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function StoredResults({ kind, refreshKey, onChanged }) {
    const toast = useToast();
    const [status, setStatus] = useState("new");
    const [busyId, setBusyId] = useState(null);
    const [bulking, setBulking] = useState(false);

    const { data, loading, error, reload } = useAsync(
        () =>
            sourcingApi.results({
                kind,
                status: status || undefined,
                page_size: 50,
            }),
        [kind, status, refreshKey]
    );
    const items = data?.results || data || [];

    const act = async (fn, result, tag) => {
        setBusyId(result.id + ":" + tag);
        try {
            await fn(result.id);
            reload();
            onChanged?.();
        } catch (err) {
            toast.error(err.response?.data?.detail || "عملیات ناموفق بود");
        } finally {
            setBusyId(null);
        }
    };

    const bulkImport = async () => {
        const ids = items.filter((r) => r.status === "new").map((r) => r.id);
        if (!ids.length) return;
        setBulking(true);
        try {
            const res = await sourcingApi.bulkImport(ids);
            toast.success(`${res.imported} مورد وارد شد`);
            reload();
            onChanged?.();
        } catch {
            toast.error("ورود گروهی ناموفق بود");
        } finally {
            setBulking(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <SectionTitle>نتایج ذخیره‌شده در سیستم</SectionTitle>
                <div className="flex items-center gap-2">
                    <Select
                        className="w-36"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">همه</option>
                        <option value="new">جدید</option>
                        <option value="imported">وارد شده</option>
                        <option value="dismissed">رد شده</option>
                    </Select>
                    {status === "new" && items.some((r) => r.status === "new") && (
                        <Button size="sm" icon={Download} loading={bulking} onClick={bulkImport}>
                            وارد کردن همه
                        </Button>
                    )}
                </div>
            </div>

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <Skeleton className="h-24" />
            ) : items.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">موردی نیست.</p>
            ) : (
                items.map((r) => (
                    <ResultCard
                        key={r.id}
                        result={r}
                        busy={
                            busyId === r.id + ":import"
                                ? "import"
                                : busyId === r.id + ":dismiss"
                                ? "dismiss"
                                : null
                        }
                        onImport={(res) => act(sourcingApi.importResult, res, "import")}
                        onDismiss={(res) => act(sourcingApi.dismissResult, res, "dismiss")}
                    />
                ))
            )}
        </div>
    );
}

export default function SourcingPage() {
    const toast = useToast();
    const [kind, setKind] = useState("jobs");
    const [provider, setProvider] = useState("");
    const [queryValues, setQueryValues] = useState({});
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [saveAs, setSaveAs] = useState("");
    const [storedKey, setStoredKey] = useState(0);

    const { data: providers, loading: loadingProviders } = useAsync(
        () => sourcingApi.providers(kind),
        [kind]
    );

    // when a fresh provider list arrives, default the selection to the first entry
    const [seenProviders, setSeenProviders] = useState(null);
    if (providers && providers !== seenProviders) {
        setSeenProviders(providers);
        setProvider(providers[0]?.slug || "");
        setQueryValues({});
        setResults([]);
    }

    const activeProvider = useMemo(
        () => providers?.find((p) => p.slug === provider),
        [providers, provider]
    );

    const runSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        try {
            const res = await sourcingApi.search({
                kind,
                provider,
                query: queryValues,
                save_as: saveAs.trim() || undefined,
            });
            setResults(res.results || []);
            setStoredKey((k) => k + 1);
            toast.success(
                `${res.count} نتیجه دریافت شد${res.saved_search ? " و جستجو ذخیره شد" : ""}`
            );
        } catch (err) {
            toast.error(err.response?.data?.detail || "جست‌وجو ناموفق بود");
        } finally {
            setSearching(false);
        }
    };

    const patchResult = (id, patch) =>
        setResults((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const importResult = async (result) => {
        setBusyId(result.id + ":import");
        try {
            await sourcingApi.importResult(result.id);
            patchResult(result.id, { status: "imported" });
            toast.success("با موفقیت وارد شد");
        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                    err.response?.data?.email?.[0] ||
                    "ورود ناموفق بود"
            );
        } finally {
            setBusyId(null);
        }
    };

    const dismissResult = async (result) => {
        setBusyId(result.id + ":dismiss");
        try {
            await sourcingApi.dismissResult(result.id);
            patchResult(result.id, { status: "dismissed" });
        } catch {
            toast.error("عملیات ناموفق بود");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">منبع‌یابی</h1>
                <p className="text-slate-500 mt-1">
                    دریافت آگهی و کاندیدا از منابع بیرونی (جاب‌ویژن، GitHub و…)
                </p>
            </div>

            <Tabs
                tabs={KINDS}
                active={kind}
                onChange={(k) => {
                    setKind(k);
                    setResults([]);
                }}
            />

            <Card className="p-6">
                {loadingProviders ? (
                    <Skeleton className="h-40" />
                ) : (
                    <form onSubmit={runSearch} className="space-y-4">
                        <Field label="ارائه‌دهنده">
                            <Select
                                value={provider}
                                onChange={(e) => {
                                    setProvider(e.target.value);
                                    setQueryValues({});
                                    setResults([]);
                                }}
                            >
                                {(providers || []).map((p) => (
                                    <option key={p.slug} value={p.slug}>
                                        {p.name}
                                        {p.is_live ? "" : " — نمونه"}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        {activeProvider?.description && (
                            <p className="text-xs text-slate-500 -mt-1">
                                {activeProvider.description}
                            </p>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            {(activeProvider?.params || []).map((param) => (
                                <Field
                                    key={param.name}
                                    label={param.label}
                                    required={param.required}
                                >
                                    <Input
                                        placeholder={param.placeholder}
                                        required={param.required}
                                        value={queryValues[param.name] || ""}
                                        onChange={(e) =>
                                            setQueryValues((v) => ({
                                                ...v,
                                                [param.name]: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                            ))}
                        </div>

                        <div className="flex items-end gap-3 pt-1">
                            <Field label="ذخیره به‌عنوان جستجوی ذخیره‌شده (اختیاری)" className="flex-1">
                                <Input
                                    placeholder="مثلاً: بک‌اند تهران"
                                    value={saveAs}
                                    onChange={(e) => setSaveAs(e.target.value)}
                                />
                            </Field>
                            <Button type="submit" icon={Search} loading={searching}>
                                جست‌وجو
                            </Button>
                        </div>
                    </form>
                )}
            </Card>

            {results.length > 0 && (
                <div className="space-y-3">
                    <SectionTitle>{results.length} نتیجه</SectionTitle>
                    {results.map((r) => (
                        <ResultCard
                            key={r.id}
                            result={r}
                            busy={
                                busyId === r.id + ":import"
                                    ? "import"
                                    : busyId === r.id + ":dismiss"
                                    ? "dismiss"
                                    : null
                            }
                            onImport={importResult}
                            onDismiss={dismissResult}
                        />
                    ))}
                </div>
            )}

            <SavedSearches onRan={() => setStoredKey((k) => k + 1)} />

            <StoredResults
                kind={kind}
                refreshKey={storedKey}
                onChanged={() => setStoredKey((k) => k + 1)}
            />
        </div>
    );
}
