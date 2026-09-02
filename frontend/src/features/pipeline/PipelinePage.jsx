import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KanbanSquare, CalendarClock, FileSignature, X } from "lucide-react";

import { jobsApi, applicationsApi, offersApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Card,
    Badge,
    Button,
    PageLoader,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import { Field, Input, Select, Textarea } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import { fmtDate, fmtRelative } from "../../lib/format";

function OfferModal({ app, jobTitle, onClose, onDone }) {
    const toast = useToast();
    const [form, setForm] = useState({
        title: jobTitle || "",
        salary: "",
        start_date: "",
        expires_on: "",
        body: "",
    });
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        try {
            await offersApi.create({
                application: app.id,
                title: form.title,
                salary: form.salary ? Number(form.salary) : null,
                start_date: form.start_date || null,
                expires_on: form.expires_on || null,
                body: form.body,
            });
            toast.success("پیش‌نویس پیشنهاد ساخته شد — از صفحهٔ پیشنهادها ارسال کنید");
            onDone?.();
            onClose();
        } catch {
            toast.error("ساخت پیشنهاد ناموفق بود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={`پیشنهاد همکاری — ${app?.candidate?.full_name || ""}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={busy} onClick={submit}>
                        ساخت پیش‌نویس
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="عنوان">
                    <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="حقوق (تومان)">
                        <Input
                            type="number"
                            value={form.salary}
                            onChange={(e) =>
                                setForm({ ...form, salary: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="تاریخ شروع">
                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={(e) =>
                                setForm({ ...form, start_date: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="مهلت پاسخ">
                        <Input
                            type="date"
                            value={form.expires_on}
                            onChange={(e) =>
                                setForm({ ...form, expires_on: e.target.value })
                            }
                        />
                    </Field>
                </div>
                <Field label="متن پیشنهاد">
                    <Textarea
                        rows={4}
                        value={form.body}
                        onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />
                </Field>
            </div>
        </Modal>
    );
}

const STAGE_ACCENT = {
    won: "border-t-green-500",
    lost: "border-t-red-500",
    active: "border-t-blue-500",
};

function ApplicationCard({ app, onDragStart, onReject, onOffer }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, app)}
            className="group bg-slate-800 rounded-xl p-3 cursor-grab active:cursor-grabbing border border-slate-700 hover:border-slate-600"
        >
            <div className="flex items-center gap-2.5">
                <Avatar name={app.candidate.full_name} src={app.candidate.photo} size="sm" />
                <Link
                    to={`/candidates/${app.candidate.id}`}
                    className="text-sm text-slate-100 hover:text-blue-400 truncate flex-1"
                >
                    {app.candidate.full_name}
                </Link>
                {app.status === "active" && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                            onClick={() => onOffer(app)}
                            title="پیشنهاد همکاری"
                            className="text-slate-500 hover:text-green-400"
                        >
                            <FileSignature size={13} />
                        </button>
                        <button
                            onClick={() => onReject(app)}
                            title="رد کردن"
                            className="text-slate-500 hover:text-red-400"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>{fmtRelative(app.applied_at)}</span>
                {app.next_interview && (
                    <span className="flex items-center gap-1 text-amber-400">
                        <CalendarClock size={12} />
                        {fmtDate(app.next_interview)}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function PipelinePage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const jobSlug = params.get("job") || "";
    const [dragOverStage, setDragOverStage] = useState(null);
    const [offerFor, setOfferFor] = useState(null);

    const { data: jobs, loading: loadingJobs } = useAsync(
        () => jobsApi.list({ status: "open", page_size: 100 }),
        []
    );

    const {
        data: board,
        loading,
        error: boardError,
        setData,
        reload,
    } = useAsync(
        () => (jobSlug ? jobsApi.board(jobSlug) : Promise.resolve(null)),
        [jobSlug]
    );

    const reject = async (app) => {
        const reason = window.prompt("دلیل رد کردن (اختیاری):", "");
        if (reason === null) return;
        try {
            await applicationsApi.reject(app.id, reason);
            toast.success("درخواست رد شد");
            reload();
        } catch {
            toast.error("عملیات ناموفق بود");
        }
    };

    const jobOptions = jobs?.results || [];
    const currentJobTitle = jobOptions.find((j) => j.slug === jobSlug)?.title || "";

    // default to the first open job once the list loads
    useEffect(() => {
        if (!jobSlug && jobOptions.length) {
            setParams({ job: jobOptions[0].slug }, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobOptions.length]);

    const onDrop = async (e, stage) => {
        e.preventDefault();
        setDragOverStage(null);
        const appId = e.dataTransfer.getData("application");
        if (!appId) return;

        // optimistic move
        const prev = board;
        const moved = { ...board, columns: board.columns.map((c) => ({ ...c, applications: [...c.applications] })) };
        let card;
        moved.columns.forEach((c) => {
            const idx = c.applications.findIndex((a) => String(a.id) === appId);
            if (idx > -1) card = c.applications.splice(idx, 1)[0];
        });
        if (!card || card.stage === stage.id) return;
        const target = moved.columns.find((c) => c.stage.id === stage.id);
        target.applications.unshift({ ...card, stage: stage.id });
        setData(moved);

        try {
            await applicationsApi.move(card.id, stage.id);
        } catch {
            toast.error("انتقال ناموفق بود");
            setData(prev);
        }
    };

    if (loadingJobs) return <PageLoader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">پایپ‌لاین استخدام</h1>
                    <p className="text-slate-500 mt-1">
                        کارت‌ها را برای تغییر مرحله بکشید و رها کنید
                    </p>
                </div>
                <Select
                    className="w-64"
                    value={jobSlug}
                    onChange={(e) => setParams({ job: e.target.value })}
                >
                    <option value="">— انتخاب آگهی —</option>
                    {jobOptions.map((j) => (
                        <option key={j.slug} value={j.slug}>
                            {j.title}
                        </option>
                    ))}
                </Select>
            </div>

            {!jobSlug ? (
                <EmptyState icon={KanbanSquare} title="یک آگهی انتخاب کنید" />
            ) : boardError ? (
                <ErrorState error={boardError} onRetry={reload} />
            ) : loading || !board ? (
                <PageLoader />
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {board.columns.map(({ stage, applications }) => (
                        <div
                            key={stage.id}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverStage(stage.id);
                            }}
                            onDragLeave={() => setDragOverStage(null)}
                            onDrop={(e) => onDrop(e, stage)}
                            className={`w-72 shrink-0 bg-slate-900 rounded-2xl border border-slate-800 border-t-2 ${
                                STAGE_ACCENT[stage.kind] || STAGE_ACCENT.active
                            } ${dragOverStage === stage.id ? "ring-2 ring-blue-500/50" : ""}`}
                        >
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm font-medium text-slate-200">
                                    {stage.name}
                                </span>
                                <Badge color="slate">{applications.length}</Badge>
                            </div>
                            <div className="px-3 pb-3 space-y-2 min-h-24">
                                {applications.map((app) => (
                                    <ApplicationCard
                                        key={app.id}
                                        app={app}
                                        onReject={reject}
                                        onOffer={setOfferFor}
                                        onDragStart={(e, a) =>
                                            e.dataTransfer.setData("application", String(a.id))
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {board?.unassigned?.length > 0 && (
                <Card className="p-4">
                    <p className="text-sm text-slate-400">
                        {board.unassigned.length} درخواست بدون مرحله
                    </p>
                </Card>
            )}

            {offerFor && (
                <OfferModal
                    app={offerFor}
                    jobTitle={currentJobTitle}
                    onClose={() => setOfferFor(null)}
                    onDone={reload}
                />
            )}
        </div>
    );
}
