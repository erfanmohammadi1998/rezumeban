import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, Check, X, Pause } from "lucide-react";

import { requisitionsApi, metaApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useAsync from "../../hooks/useAsync";
import {
    Button,
    Card,
    Badge,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import { Field, Input, Textarea, Select, Checkbox } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import FilterBar from "../../components/FilterBar";
import { EMPLOYMENT_LABELS, fmtDate, fmtRelative } from "../../lib/format";

const STATUS_COLOR = {
    draft: "slate",
    submitted: "blue",
    approved: "green",
    rejected: "red",
    on_hold: "amber",
};
const URGENCY_COLOR = { low: "slate", normal: "blue", high: "red" };

function RequisitionModal({ open, onClose, onDone }) {
    const toast = useToast();
    const { data: depts } = useAsync(() => metaApi.departments(), []);
    const [form, setForm] = useState({
        title: "",
        department_id: "",
        headcount: 1,
        employment_type: "full_time",
        urgency: "normal",
        target_start: "",
        reason: "",
        requirements: "",
    });
    const [submit_, setSubmit] = useState(true);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!form.title.trim()) return;
        setBusy(true);
        try {
            await requisitionsApi.create({
                ...form,
                department_id: form.department_id || null,
                headcount: Number(form.headcount) || 1,
                target_start: form.target_start || null,
                submit: submit_,
            });
            toast.success(submit_ ? "درخواست ارسال شد" : "پیش‌نویس ذخیره شد");
            onDone();
            onClose();
        } catch {
            toast.error("ثبت درخواست ناموفق بود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="درخواست جذب نیرو"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={busy} onClick={save}>
                        {submit_ ? "ارسال درخواست" : "ذخیرهٔ پیش‌نویس"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="عنوان موقعیت" required>
                    <Input
                        autoFocus
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="دپارتمان">
                        <Select
                            value={form.department_id}
                            onChange={(e) =>
                                setForm({ ...form, department_id: e.target.value })
                            }
                        >
                            <option value="">—</option>
                            {(depts || []).map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="تعداد نیرو">
                        <Input
                            type="number"
                            min={1}
                            value={form.headcount}
                            onChange={(e) =>
                                setForm({ ...form, headcount: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="نوع همکاری">
                        <Select
                            value={form.employment_type}
                            onChange={(e) =>
                                setForm({ ...form, employment_type: e.target.value })
                            }
                        >
                            {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="فوریت">
                        <Select
                            value={form.urgency}
                            onChange={(e) =>
                                setForm({ ...form, urgency: e.target.value })
                            }
                        >
                            <option value="low">عادی</option>
                            <option value="normal">متوسط</option>
                            <option value="high">فوری</option>
                        </Select>
                    </Field>
                    <Field label="تاریخ شروع موردنظر">
                        <Input
                            type="date"
                            value={form.target_start}
                            onChange={(e) =>
                                setForm({ ...form, target_start: e.target.value })
                            }
                        />
                    </Field>
                </div>
                <Field label="دلیل نیاز" required>
                    <Textarea
                        rows={2}
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                </Field>
                <Field label="شرایط و مهارت‌های موردنیاز">
                    <Textarea
                        rows={2}
                        value={form.requirements}
                        onChange={(e) =>
                            setForm({ ...form, requirements: e.target.value })
                        }
                    />
                </Field>
                <Checkbox
                    label="ارسال برای بررسی مدیر (در غیر این صورت پیش‌نویس می‌ماند)"
                    checked={submit_}
                    onChange={(e) => setSubmit(e.target.checked)}
                />
            </div>
        </Modal>
    );
}

export default function RequisitionsPage() {
    const toast = useToast();
    const { user } = useAuth();
    const canReview = user?.is_staff || user?.is_superuser;
    const [status, setStatus] = useState("");
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const query = useMemo(() => ({ status: status || undefined }), [status]);
    const { data, loading, error, reload } = useAsync(
        () => requisitionsApi.list(query),
        [JSON.stringify(query)]
    );
    const rows = data?.results || data || [];

    const act = async (id, fn, note) => {
        setBusyId(id);
        try {
            await fn(id, note ? { note } : {});
            toast.success("ثبت شد");
            reload();
        } catch {
            toast.error("عملیات ناموفق بود");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        درخواست‌های جذب نیرو
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {canReview
                            ? "بررسی و تأیید درخواست‌های مدیران واحدها"
                            : "درخواست‌های شما به مدیر سیستم"}
                    </p>
                </div>
                <Button icon={Plus} onClick={() => setOpen(true)}>
                    درخواست جدید
                </Button>
            </div>

            <FilterBar
                selects={[
                    {
                        key: "status",
                        value: status,
                        onChange: setStatus,
                        allLabel: "همه وضعیت‌ها",
                        options: [
                            { value: "draft", label: "پیش‌نویس" },
                            { value: "submitted", label: "ارسال‌شده" },
                            { value: "approved", label: "تأییدشده" },
                            { value: "rejected", label: "رد شده" },
                            { value: "on_hold", label: "در انتظار" },
                        ],
                    },
                ]}
                activeCount={status ? 1 : 0}
                onClear={() => setStatus("")}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <EmptyState icon={ClipboardList} title="درخواستی ثبت نشده" />
            ) : (
                <div className="grid gap-3">
                    {rows.map((r) => (
                        <Card key={r.id} className="p-5">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-slate-100">
                                            {r.title}
                                        </span>
                                        <Badge color={STATUS_COLOR[r.status]}>
                                            {r.status_display}
                                        </Badge>
                                        <Badge color={URGENCY_COLOR[r.urgency]}>
                                            {r.urgency_display}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                        {r.department?.name && (
                                            <span>{r.department.name}</span>
                                        )}
                                        <span>
                                            {r.headcount?.toLocaleString("fa-IR")} نفر
                                        </span>
                                        <span>{EMPLOYMENT_LABELS[r.employment_type]}</span>
                                        {r.target_start && (
                                            <span>شروع: {fmtDate(r.target_start)}</span>
                                        )}
                                        <span className="text-slate-600">
                                            {r.requested_by?.full_name} ·{" "}
                                            {fmtRelative(r.created_at)}
                                        </span>
                                    </div>
                                </div>
                                {r.job_slug && (
                                    <Link
                                        to={`/jobs/${r.job_slug}`}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        آگهی ساخته‌شده
                                    </Link>
                                )}
                            </div>

                            {r.reason && (
                                <p className="text-sm text-slate-400 mt-3 whitespace-pre-line">
                                    {r.reason}
                                </p>
                            )}
                            {r.review_note && (
                                <p className="text-xs text-slate-500 mt-2 border-r-2 border-slate-700 pr-2">
                                    یادداشت بررسی: {r.review_note}
                                </p>
                            )}

                            {canReview && r.status === "submitted" && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        icon={Check}
                                        loading={busyId === r.id}
                                        onClick={() =>
                                            act(
                                                r.id,
                                                (id) =>
                                                    requisitionsApi.approve(id, {
                                                        create_job: true,
                                                    }),
                                            )
                                        }
                                    >
                                        تأیید و ساخت آگهی
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={Pause}
                                        loading={busyId === r.id}
                                        onClick={() =>
                                            act(r.id, requisitionsApi.hold, "نیاز به بررسی بیشتر")
                                        }
                                    >
                                        در انتظار
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        icon={X}
                                        loading={busyId === r.id}
                                        onClick={() => {
                                            const note = window.prompt("دلیل رد:");
                                            if (note !== null)
                                                act(r.id, requisitionsApi.reject, note);
                                        }}
                                    >
                                        رد
                                    </Button>
                                </div>
                            )}
                            {!canReview && r.status === "draft" && (
                                <Button
                                    size="sm"
                                    className="mt-4"
                                    loading={busyId === r.id}
                                    onClick={() => act(r.id, requisitionsApi.submit)}
                                >
                                    ارسال برای بررسی
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <RequisitionModal
                open={open}
                onClose={() => setOpen(false)}
                onDone={reload}
            />
        </div>
    );
}
