import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowRight,
    Pencil,
    Trash2,
    MapPin,
    Users,
    KanbanSquare,
    Plus,
} from "lucide-react";

import { jobsApi, applicationsApi, candidatesApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import useDebounce from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Badge,
    PageLoader,
    ErrorState,
    EmptyState,
    SectionTitle,
} from "../../components/ui";
import { Input } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import {
    JOB_STATUS_LABELS,
    JOB_STATUS_COLORS,
    EMPLOYMENT_LABELS,
    APP_STATUS_LABELS,
    APP_STATUS_COLORS,
    fmtSalaryRange,
    fmtDate,
    fmtRelative,
} from "../../lib/format";
import JobForm from "./JobForm";

function AddApplicationModal({ open, onClose, job, onAdded }) {
    const toast = useToast();
    const [q, setQ] = useState("");
    const debounced = useDebounce(q, 300);
    const [adding, setAdding] = useState(null);

    const { data } = useAsync(
        () =>
            debounced.trim()
                ? candidatesApi.list({ search: debounced, page_size: 8 })
                : Promise.resolve({ results: [] }),
        [debounced]
    );

    const add = async (candidate) => {
        setAdding(candidate.id);
        try {
            await applicationsApi.create({
                candidate_id: candidate.id,
                job_id: job.id,
            });
            toast.success(`${candidate.full_name} اضافه شد`);
            onAdded?.();
            onClose();
        } catch (err) {
            toast.error(
                err.response?.data?.[0] ||
                    err.response?.data?.detail ||
                    "افزودن ناموفق بود"
            );
        } finally {
            setAdding(null);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="افزودن کاندیدا به آگهی">
            <Input
                autoFocus
                placeholder="جستجوی کاندیدا..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {(data?.results || []).map((c) => (
                    <button
                        key={c.id}
                        onClick={() => add(c)}
                        disabled={adding === c.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 text-right disabled:opacity-50"
                    >
                        <Avatar name={c.full_name} src={c.photo} size="sm" />
                        <div className="min-w-0">
                            <div className="text-sm text-slate-200 truncate">
                                {c.full_name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                                {c.headline || c.email}
                            </div>
                        </div>
                    </button>
                ))}
                {debounced.trim() && !data?.results?.length && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        نتیجه‌ای نیست.
                    </p>
                )}
            </div>
        </Modal>
    );
}

export default function JobDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [editOpen, setEditOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    const { data: job, loading, error, reload, setData } = useAsync(
        () => jobsApi.get(slug),
        [slug]
    );
    const { data: apps, reload: reloadApps } = useAsync(
        () => jobsApi.applications(slug),
        [slug]
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !job) return <PageLoader />;

    const applications = apps?.results || apps || [];

    const remove = async () => {
        if (!confirm(`آگهی «${job.title}» حذف شود؟`)) return;
        try {
            await jobsApi.remove(job.slug);
            toast.success("آگهی حذف شد");
            navigate("/jobs");
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    return (
        <div className="space-y-6">
            <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
                <ArrowRight size={16} />
                بازگشت به آگهی‌ها
            </Link>

            <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-slate-100">
                                {job.title}
                            </h1>
                            <Badge color={JOB_STATUS_COLORS[job.status]}>
                                {JOB_STATUS_LABELS[job.status]}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-2">
                            {job.department?.name && <span>{job.department.name}</span>}
                            <span className="flex items-center gap-1">
                                <MapPin size={13} />
                                {job.is_remote ? "دورکاری" : job.location || "—"}
                            </span>
                            <span>{EMPLOYMENT_LABELS[job.employment_type]}</span>
                            <span>{fmtSalaryRange(job.salary_min, job.salary_max)}</span>
                            <span>{job.openings?.toLocaleString("fa-IR")} نیرو</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={KanbanSquare}
                            onClick={() => navigate(`/pipeline?job=${job.slug}`)}
                        >
                            برد استخدام
                        </Button>
                        <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
                            ویرایش
                        </Button>
                        <Button variant="ghost" icon={Trash2} onClick={remove} />
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {job.description && (
                        <Card className="p-6">
                            <SectionTitle>شرح موقعیت</SectionTitle>
                            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                {job.description}
                            </p>
                        </Card>
                    )}
                    {job.requirements && (
                        <Card className="p-6">
                            <SectionTitle>الزامات</SectionTitle>
                            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                {job.requirements}
                            </p>
                        </Card>
                    )}
                </div>

                <Card className="p-6">
                    <SectionTitle
                        action={
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={Plus}
                                onClick={() => setAddOpen(true)}
                            >
                                افزودن
                            </Button>
                        }
                    >
                        درخواست‌ها
                    </SectionTitle>
                    {applications.length ? (
                        <div className="divide-y divide-slate-800">
                            {applications.map((a) => (
                                <Link
                                    key={a.id}
                                    to={`/candidates/${a.candidate.id}`}
                                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-800/40"
                                >
                                    <Avatar
                                        name={a.candidate.full_name}
                                        src={a.candidate.photo}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 truncate">
                                            {a.candidate.full_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {a.stage?.name || "—"} · {fmtRelative(a.applied_at)}
                                        </div>
                                    </div>
                                    <Badge color={APP_STATUS_COLORS[a.status]}>
                                        {APP_STATUS_LABELS[a.status]}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Users} title="هنوز درخواستی ثبت نشده" />
                    )}
                    <p className="text-xs text-slate-600 mt-4">
                        ایجاد شده {fmtDate(job.created_at)}
                    </p>
                </Card>
            </div>

            <JobForm
                open={editOpen}
                onClose={() => setEditOpen(false)}
                job={job}
                onSaved={(saved) => {
                    if (saved.slug !== job.slug) navigate(`/jobs/${saved.slug}`);
                    else setData(saved);
                }}
            />
            <AddApplicationModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                job={job}
                onAdded={() => {
                    reloadApps();
                    reload();
                }}
            />
        </div>
    );
}
