import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Plus, Star } from "lucide-react";

import { interviewsApi, jobsApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
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
import { Field, Input, Select, Textarea } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import {
    INTERVIEW_TYPE_LABELS,
    INTERVIEW_STATUS_LABELS,
    INTERVIEW_STATUS_COLORS,
    RECOMMENDATION_LABELS,
    fmtDateTime,
} from "../../lib/format";

function ScheduleModal({ open, onClose, onSaved }) {
    const toast = useToast();
    const [jobSlug, setJobSlug] = useState("");
    const [form, setForm] = useState({
        application: "",
        title: "مصاحبه",
        interview_type: "video",
        scheduled_at: "",
        duration_minutes: 60,
        location: "",
    });
    const [saving, setSaving] = useState(false);

    const { data: jobs } = useAsync(
        () => jobsApi.list({ status: "open", page_size: 100 }),
        []
    );
    const { data: apps } = useAsync(
        () => (jobSlug ? jobsApi.applications(jobSlug) : Promise.resolve({ results: [] })),
        [jobSlug]
    );
    const applications = apps?.results || apps || [];

    const submit = async (e) => {
        e.preventDefault();
        if (!form.application) return toast.error("یک درخواست انتخاب کنید");
        setSaving(true);
        try {
            await interviewsApi.create({
                application: Number(form.application),
                title: form.title,
                interview_type: form.interview_type,
                scheduled_at: new Date(form.scheduled_at).toISOString(),
                duration_minutes: Number(form.duration_minutes) || 60,
                location: form.location,
            });
            toast.success("مصاحبه ثبت شد");
            onSaved();
            onClose();
        } catch {
            toast.error("ثبت مصاحبه ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="زمان‌بندی مصاحبه"
            footer={
                <>
                    <Button variant="ghost" type="button" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button type="button" loading={saving} onClick={submit}>
                        ثبت
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="آگهی" required>
                    <Select value={jobSlug} onChange={(e) => setJobSlug(e.target.value)}>
                        <option value="">— انتخاب —</option>
                        {(jobs?.results || []).map((j) => (
                            <option key={j.slug} value={j.slug}>
                                {j.title}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="کاندیدا (درخواست)" required>
                    <Select
                        value={form.application}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, application: e.target.value }))
                        }
                        disabled={!jobSlug}
                    >
                        <option value="">— انتخاب —</option>
                        {applications.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.candidate.full_name}
                            </option>
                        ))}
                    </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="عنوان">
                        <Input
                            value={form.title}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, title: e.target.value }))
                            }
                        />
                    </Field>
                    <Field label="نوع">
                        <Select
                            value={form.interview_type}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, interview_type: e.target.value }))
                            }
                        >
                            {Object.entries(INTERVIEW_TYPE_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="زمان" required>
                        <Input
                            type="datetime-local"
                            value={form.scheduled_at}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, scheduled_at: e.target.value }))
                            }
                            required
                        />
                    </Field>
                    <Field label="مدت (دقیقه)">
                        <Input
                            type="number"
                            value={form.duration_minutes}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    duration_minutes: e.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <Field label="مکان / لینک">
                    <Input
                        value={form.location}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, location: e.target.value }))
                        }
                    />
                </Field>
            </form>
        </Modal>
    );
}

function FeedbackModal({ interview, onClose, onSaved }) {
    const toast = useToast();
    const [form, setForm] = useState(() => ({
        status: interview?.status || "completed",
        score: interview?.score || "",
        recommendation: interview?.recommendation || "",
        feedback: interview?.feedback || "",
    }));
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        setSaving(true);
        try {
            await interviewsApi.update(interview.id, {
                status: form.status,
                score: form.score === "" ? null : Number(form.score),
                recommendation: form.recommendation,
                feedback: form.feedback,
            });
            toast.success("ثبت شد");
            onSaved();
            onClose();
        } catch {
            toast.error("ذخیره ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={Boolean(interview)}
            onClose={onClose}
            title={`بازخورد — ${interview?.candidate?.full_name || ""}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={saving} onClick={submit}>
                        ذخیره
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="وضعیت">
                        <Select
                            value={form.status}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, status: e.target.value }))
                            }
                        >
                            {Object.entries(INTERVIEW_STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="امتیاز (۱ تا ۵)">
                        <Input
                            type="number"
                            min={1}
                            max={5}
                            value={form.score}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, score: e.target.value }))
                            }
                        />
                    </Field>
                </div>
                <Field label="توصیه">
                    <Select
                        value={form.recommendation}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, recommendation: e.target.value }))
                        }
                    >
                        <option value="">—</option>
                        {Object.entries(RECOMMENDATION_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="یادداشت بازخورد">
                    <Textarea
                        value={form.feedback}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, feedback: e.target.value }))
                        }
                    />
                </Field>
            </div>
        </Modal>
    );
}

function InterviewRow({ iv, onFeedback, showDate }) {
    return (
        <Card className="p-4 flex items-center gap-4">
            <Avatar name={iv.candidate?.full_name} src={iv.candidate?.photo} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        to={`/candidates/${iv.candidate?.id}`}
                        className="text-sm font-medium text-slate-100 hover:text-blue-400"
                    >
                        {iv.candidate?.full_name}
                    </Link>
                    <Badge color={INTERVIEW_STATUS_COLORS[iv.status]}>
                        {INTERVIEW_STATUS_LABELS[iv.status]}
                    </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    {iv.job?.title} · {INTERVIEW_TYPE_LABELS[iv.interview_type]}
                    {showDate
                        ? ` · ${fmtDateTime(iv.scheduled_at)}`
                        : ` · ${new Date(iv.scheduled_at).toLocaleTimeString("fa-IR", {
                              hour: "2-digit",
                              minute: "2-digit",
                          })}`}
                </div>
            </div>
            {iv.score ? (
                <span className="flex items-center gap-1 text-sm text-amber-400">
                    <Star size={14} className="fill-amber-400" />
                    {iv.score}
                </span>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => onFeedback(iv)}>
                بازخورد
            </Button>
        </Card>
    );
}

function groupByDay(items) {
    const map = new Map();
    for (const iv of items) {
        const key = new Date(iv.scheduled_at).toLocaleDateString("fa-IR", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(iv);
    }
    return [...map.entries()];
}

export default function InterviewsPage() {
    const [upcoming, setUpcoming] = useState(true);
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [jobSlug, setJobSlug] = useState("");
    const [view, setView] = useState("list");
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [feedbackFor, setFeedbackFor] = useState(null);

    const { data: jobs } = useAsync(
        () => jobsApi.list({ page_size: 100 }),
        []
    );
    const jobId = (jobs?.results || []).find((j) => j.slug === jobSlug)?.id;

    const query = useMemo(
        () => ({
            upcoming: upcoming ? "true" : undefined,
            status: status || undefined,
            interview_type: type || undefined,
            application__job: jobId || undefined,
            page_size: 100,
        }),
        [upcoming, status, type, jobId]
    );
    const { data, loading, error, reload } = useAsync(
        () => interviewsApi.list(query),
        [JSON.stringify(query)]
    );
    const items = data?.results || data || [];
    const activeCount =
        (status ? 1 : 0) + (type ? 1 : 0) + (jobSlug ? 1 : 0) + (upcoming ? 0 : 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">مصاحبه‌ها</h1>
                    <p className="text-slate-500 mt-1">
                        {(data?.count ?? items.length).toLocaleString("fa-IR")} مصاحبه
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-slate-800 overflow-hidden">
                        {[
                            ["list", "فهرست"],
                            ["agenda", "روزشمار"],
                        ].map(([v, label]) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-2 text-sm transition ${
                                    view === v
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <Button icon={Plus} onClick={() => setScheduleOpen(true)}>
                        زمان‌بندی مصاحبه
                    </Button>
                </div>
            </div>

            <FilterBar
                selects={[
                    {
                        key: "status",
                        value: status,
                        onChange: setStatus,
                        allLabel: "همه وضعیت‌ها",
                        options: Object.entries(INTERVIEW_STATUS_LABELS).map(
                            ([value, label]) => ({ value, label })
                        ),
                    },
                    {
                        key: "type",
                        value: type,
                        onChange: setType,
                        allLabel: "همه انواع",
                        options: Object.entries(INTERVIEW_TYPE_LABELS).map(
                            ([value, label]) => ({ value, label })
                        ),
                    },
                    {
                        key: "job",
                        value: jobSlug,
                        onChange: setJobSlug,
                        allLabel: "همه آگهی‌ها",
                        options: (jobs?.results || []).map((j) => ({
                            value: j.slug,
                            label: j.title,
                        })),
                    },
                ]}
                toggles={[
                    {
                        key: "upcoming",
                        label: "فقط پیش‌رو",
                        active: upcoming,
                        onClick: () => setUpcoming((u) => !u),
                    },
                ]}
                activeCount={activeCount}
                onClear={() => {
                    setStatus("");
                    setType("");
                    setJobSlug("");
                    setUpcoming(true);
                }}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState icon={CalendarClock} title="مصاحبه‌ای یافت نشد" />
            ) : view === "agenda" ? (
                <div className="space-y-6">
                    {groupByDay(items).map(([day, dayItems]) => (
                        <div key={day}>
                            <h3 className="text-sm font-semibold text-slate-400 mb-2 sticky top-16 bg-slate-950/80 backdrop-blur py-1">
                                {day}
                            </h3>
                            <div className="grid gap-2">
                                {dayItems.map((iv) => (
                                    <InterviewRow
                                        key={iv.id}
                                        iv={iv}
                                        onFeedback={setFeedbackFor}
                                        showDate={false}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-3">
                    {items.map((iv) => (
                        <InterviewRow
                            key={iv.id}
                            iv={iv}
                            onFeedback={setFeedbackFor}
                            showDate
                        />
                    ))}
                </div>
            )}

            <ScheduleModal
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                onSaved={reload}
            />
            {feedbackFor && (
                <FeedbackModal
                    interview={feedbackFor}
                    onClose={() => setFeedbackFor(null)}
                    onSaved={reload}
                />
            )}
        </div>
    );
}
