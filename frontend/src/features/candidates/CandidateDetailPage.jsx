import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowRight,
    Pencil,
    Trash2,
    Star,
    Mail,
    Phone,
    MapPin,
    Link2,
    Globe,
    Briefcase,
    GraduationCap,
    Send,
} from "lucide-react";

import { candidatesApi } from "../../api/client";
import { MODULES } from "../../config/modules";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Badge,
    PageLoader,
    EmptyState,
    ErrorState,
    SectionTitle,
} from "../../components/ui";
import { Textarea } from "../../components/ui/form";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";
import {
    fmtDate,
    fmtRelative,
    SOURCE_LABELS,
    SKILL_LEVEL_LABELS,
    APP_STATUS_LABELS,
    APP_STATUS_COLORS,
    INTERVIEW_TYPE_LABELS,
    INTERVIEW_STATUS_LABELS,
} from "../../lib/format";
import CandidateForm from "./CandidateForm";

function Contact({ icon: Icon, value, href }) {
    if (!value) return null;
    const body = (
        <span className="flex items-center gap-2 text-sm text-slate-400">
            <Icon size={15} className="text-slate-500" />
            {value}
        </span>
    );
    return href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:text-blue-400">
            {body}
        </a>
    ) : (
        body
    );
}

export default function CandidateDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [editOpen, setEditOpen] = useState(false);
    const [noteBody, setNoteBody] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const { data: c, loading, error, reload, setData } = useAsync(
        () => candidatesApi.get(id),
        [id]
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !c) return <PageLoader />;

    const toggleFav = async () => {
        const res = await candidatesApi.toggleFavorite(c.id);
        setData({ ...c, is_favorite: res.is_favorite });
    };

    const rate = async (rating) => {
        const res = await candidatesApi.rate(c.id, rating);
        setData({ ...c, rating: res.rating });
    };

    const remove = async () => {
        if (!confirm(`«${c.full_name}» حذف شود؟`)) return;
        try {
            await candidatesApi.remove(c.id);
            toast.success("کاندیدا حذف شد");
            navigate("/candidates");
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    const addNote = async (e) => {
        e.preventDefault();
        if (!noteBody.trim()) return;
        setSavingNote(true);
        try {
            await candidatesApi.addNote(c.id, noteBody.trim());
            setNoteBody("");
            reload();
        } catch {
            toast.error("ثبت یادداشت ناموفق بود");
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="space-y-6">
            <Link
                to="/candidates"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
                <ArrowRight size={16} />
                بازگشت به فهرست
            </Link>

            <Card className="p-6">
                <div className="flex flex-wrap items-start gap-5">
                    <Avatar name={c.full_name} src={c.photo} size="xl" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-slate-100">
                                {c.full_name}
                            </h1>
                            {c.is_favorite && (
                                <Star size={18} className="fill-amber-400 text-amber-400" />
                            )}
                        </div>
                        <p className="text-slate-400 mt-1">{c.headline || "—"}</p>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                            <Contact icon={Mail} value={c.email} href={`mailto:${c.email}`} />
                            <Contact icon={Phone} value={c.phone} href={`tel:${c.phone}`} />
                            <Contact icon={MapPin} value={c.location} />
                            <Contact
                                icon={Link2}
                                value={c.linkedin_url && "لینکدین"}
                                href={c.linkedin_url}
                            />
                            <Contact
                                icon={Link2}
                                value={c.github_url && "گیت‌هاب"}
                                href={c.github_url}
                            />
                            <Contact
                                icon={Globe}
                                value={c.portfolio_url && "نمونه‌کار"}
                                href={c.portfolio_url}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <Badge color="blue">
                                {SOURCE_LABELS[c.source] || c.source}
                            </Badge>
                            {(c.tags || []).map((t) => (
                                <Badge key={t.id} color="purple">
                                    {t.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2">
                            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
                                ویرایش
                            </Button>
                            <Button variant="ghost" icon={Trash2} onClick={remove} />
                        </div>
                        <Button
                            variant={c.is_favorite ? "primary" : "outline"}
                            icon={Star}
                            onClick={toggleFav}
                        >
                            {c.is_favorite ? "نشان‌شده" : "نشان کردن"}
                        </Button>
                        <StarRating value={c.rating} onChange={rate} />
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {c.summary && (
                        <Card className="p-6">
                            <SectionTitle>خلاصه</SectionTitle>
                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {c.summary}
                            </p>
                        </Card>
                    )}

                    <Card className="p-6">
                        <SectionTitle>سوابق کاری</SectionTitle>
                        {c.work_experiences?.length ? (
                            <div className="space-y-5">
                                {c.work_experiences.map((e) => (
                                    <div key={e.id} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                            <Briefcase size={16} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">
                                                {e.position} — {e.company_name}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {fmtDate(e.start_date)} تا{" "}
                                                {e.is_current ? "اکنون" : fmtDate(e.end_date)}
                                            </div>
                                            {e.description && (
                                                <p className="text-sm text-slate-400 mt-1.5 whitespace-pre-line">
                                                    {e.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">ثبت نشده.</p>
                        )}
                    </Card>

                    <Card className="p-6">
                        <SectionTitle>تحصیلات</SectionTitle>
                        {c.educations?.length ? (
                            <div className="space-y-4">
                                {c.educations.map((e) => (
                                    <div key={e.id} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                            <GraduationCap size={16} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">
                                                {e.degree} {e.field_of_study && `— ${e.field_of_study}`}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {e.university}
                                                {e.graduation_year
                                                    ? ` · ${e.graduation_year}`
                                                    : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">ثبت نشده.</p>
                        )}
                    </Card>

                    {MODULES.jobs && (
                        <Card className="p-6">
                            <SectionTitle>درخواست‌های شغلی</SectionTitle>
                            {c.applications?.length ? (
                                <div className="divide-y divide-slate-800">
                                    {c.applications.map((a) => (
                                        <div key={a.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Link
                                                        to={`/jobs/${a.job_slug}`}
                                                        className="text-sm text-slate-200 hover:text-blue-400"
                                                    >
                                                        {a.job_title}
                                                    </Link>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {a.stage || "—"} ·{" "}
                                                        {fmtRelative(a.applied_at)}
                                                    </div>
                                                </div>
                                                <Badge color={APP_STATUS_COLORS[a.status]}>
                                                    {a.status_display ||
                                                        APP_STATUS_LABELS[a.status]}
                                                </Badge>
                                            </div>
                                            {a.interviews?.length > 0 && (
                                                <div className="mt-2 space-y-1 pr-3 border-r-2 border-slate-800">
                                                    {a.interviews.map((iv) => (
                                                        <div
                                                            key={iv.id}
                                                            className="flex items-center justify-between text-xs"
                                                        >
                                                            <span className="text-slate-400">
                                                                {INTERVIEW_TYPE_LABELS[
                                                                    iv.interview_type
                                                                ] || iv.title}{" "}
                                                                · {fmtDate(iv.scheduled_at)}
                                                            </span>
                                                            <span className="text-slate-500">
                                                                {INTERVIEW_STATUS_LABELS[
                                                                    iv.status
                                                                ] || iv.status}
                                                                {iv.score
                                                                    ? ` · ${iv.score}★`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    برای هیچ آگهی‌ای ثبت نشده.
                                </p>
                            )}
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <SectionTitle>مهارت‌ها</SectionTitle>
                        {c.skills?.length ? (
                            <div className="space-y-2">
                                {c.skills.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-slate-300">{s.name}</span>
                                        <span className="text-xs text-slate-500">
                                            {SKILL_LEVEL_LABELS[s.level] || s.level}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">ثبت نشده.</p>
                        )}
                    </Card>

                    <Card className="p-6">
                        <SectionTitle>یادداشت‌های تیم</SectionTitle>
                        <form onSubmit={addNote} className="space-y-2 mb-4">
                            <Textarea
                                rows={2}
                                placeholder="یادداشتی بنویسید..."
                                value={noteBody}
                                onChange={(e) => setNoteBody(e.target.value)}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                icon={Send}
                                loading={savingNote}
                                disabled={!noteBody.trim()}
                            >
                                ثبت یادداشت
                            </Button>
                        </form>
                        {c.notes?.length ? (
                            <div className="space-y-3">
                                {c.notes.map((n) => (
                                    <div
                                        key={n.id}
                                        className="text-sm border-r-2 border-slate-700 pr-3"
                                    >
                                        <p className="text-slate-300 whitespace-pre-line">
                                            {n.body}
                                        </p>
                                        <div className="text-xs text-slate-600 mt-1">
                                            {n.author?.full_name || "—"} ·{" "}
                                            {fmtRelative(n.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="یادداشتی ثبت نشده" />
                        )}
                    </Card>
                </div>
            </div>

            <CandidateForm
                open={editOpen}
                onClose={() => setEditOpen(false)}
                candidate={c}
                onSaved={(saved) => setData(saved)}
            />
        </div>
    );
}
