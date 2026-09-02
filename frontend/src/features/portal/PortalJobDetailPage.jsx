import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Briefcase, CheckCircle2 } from "lucide-react";

import { publicApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { Button, Card, Badge, PageLoader } from "../../components/ui";
import { Field, Input, Textarea } from "../../components/ui/form";
import {
    EMPLOYMENT_LABELS,
    fmtSalaryRange,
} from "../../lib/format";

function ApplyForm({ slug, jobTitle }) {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        headline: "",
        location: "",
        linkedin_url: "",
        summary: "",
        cover_letter: "",
    });
    const [resume, setResume] = useState(null);
    const [state, setState] = useState("idle"); // idle | saving | done
    const [error, setError] = useState("");

    const field = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setState("saving");
        setError("");
        try {
            const fd = new FormData();
            fd.append("job", slug);
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            if (resume) fd.append("resume", resume);
            await publicApi.apply(fd);
            setState("done");
        } catch (err) {
            const data = err.response?.data;
            const first =
                data && typeof data === "object" && Object.values(data)[0];
            setError(
                (Array.isArray(first) ? first[0] : first) || "ارسال درخواست ناموفق بود"
            );
            setState("idle");
        }
    };

    if (state === "done") {
        return (
            <Card className="p-8 text-center">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">درخواست شما ثبت شد</h3>
                <p className="text-slate-400 mt-2">
                    از علاقه‌ی شما به موقعیت «{jobTitle}» سپاسگزاریم. به‌زودی با شما تماس می‌گیریم.
                </p>
                <Link
                    to="/careers"
                    className="inline-block mt-5 text-sm text-blue-400 hover:text-blue-300"
                >
                    مشاهده سایر موقعیت‌ها
                </Link>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">ارسال درخواست</h3>
            <form onSubmit={submit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                        {error}
                    </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="نام" required>
                        <Input name="first_name" value={form.first_name} onChange={field} required />
                    </Field>
                    <Field label="نام خانوادگی" required>
                        <Input name="last_name" value={form.last_name} onChange={field} required />
                    </Field>
                    <Field label="ایمیل" required>
                        <Input name="email" type="email" value={form.email} onChange={field} required />
                    </Field>
                    <Field label="تلفن">
                        <Input name="phone" value={form.phone} onChange={field} />
                    </Field>
                    <Field label="عنوان شغلی فعلی">
                        <Input name="headline" value={form.headline} onChange={field} />
                    </Field>
                    <Field label="شهر">
                        <Input name="location" value={form.location} onChange={field} />
                    </Field>
                </div>
                <Field label="لینکدین">
                    <Input name="linkedin_url" value={form.linkedin_url} onChange={field} />
                </Field>
                <Field label="درباره شما">
                    <Textarea name="summary" value={form.summary} onChange={field} rows={3} />
                </Field>
                <Field label="انگیزه‌نامه">
                    <Textarea name="cover_letter" value={form.cover_letter} onChange={field} rows={3} />
                </Field>
                <Field label="رزومه (PDF)" hint="حداکثر ۵ مگابایت">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResume(e.target.files[0] || null)}
                        className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-slate-200 hover:file:bg-slate-700"
                    />
                </Field>
                <Button type="submit" size="lg" loading={state === "saving"} className="w-full">
                    ارسال درخواست
                </Button>
            </form>
        </Card>
    );
}

export default function PortalJobDetailPage() {
    const { slug } = useParams();
    const { data: job, loading, error } = useAsync(
        () => publicApi.job(slug),
        [slug]
    );

    if (loading) return <PageLoader />;
    if (error || !job) {
        return (
            <Card className="p-8 text-center">
                <Briefcase size={36} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">این موقعیت شغلی دیگر در دسترس نیست.</p>
                <Link to="/careers" className="text-blue-400 hover:text-blue-300 text-sm mt-3 inline-block">
                    بازگشت به فهرست
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Link
                to="/careers"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
                <ArrowRight size={16} />
                همه موقعیت‌ها
            </Link>

            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card className="p-6">
                        <h1 className="text-2xl font-bold">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-3">
                            {job.department && <span>{job.department}</span>}
                            <span className="flex items-center gap-1">
                                <MapPin size={13} />
                                {job.is_remote ? "دورکاری" : job.location || "—"}
                            </span>
                            <span>{EMPLOYMENT_LABELS[job.employment_type]}</span>
                            <Badge color="green">
                                {fmtSalaryRange(job.salary_min, job.salary_max)}
                            </Badge>
                        </div>
                    </Card>

                    {job.description && (
                        <Card className="p-6">
                            <h3 className="font-semibold mb-3">شرح موقعیت</h3>
                            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                {job.description}
                            </p>
                        </Card>
                    )}
                    {job.requirements && (
                        <Card className="p-6">
                            <h3 className="font-semibold mb-3">الزامات</h3>
                            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                                {job.requirements}
                            </p>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <div className="lg:sticky lg:top-24">
                        <ApplyForm slug={job.slug} jobTitle={job.title} />
                    </div>
                </div>
            </div>
        </div>
    );
}
