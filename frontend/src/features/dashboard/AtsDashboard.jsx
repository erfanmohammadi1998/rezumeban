import { Link } from "react-router-dom";
import {
    Users,
    Briefcase,
    GitPullRequest,
    CalendarClock,
    Trophy,
    Square,
    Activity as ActivityIcon,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

import { statsApi, tasksApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import {
    Card,
    Skeleton,
    SectionTitle,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import Avatar from "../../components/ui/Avatar";
import { fmtNum, fmtRelative, fmtDateTime, fmtDate } from "../../lib/format";

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
    const tones = {
        blue: "bg-blue-500/15 text-blue-300",
        green: "bg-green-500/15 text-green-300",
        amber: "bg-amber-500/15 text-amber-300",
        purple: "bg-purple-500/15 text-purple-300",
        pink: "bg-pink-500/15 text-pink-300",
    };
    return (
        <Card className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tones[tone]}`}>
                <Icon size={22} />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
            </div>
        </Card>
    );
}

function MyTasks() {
    const { data, reload } = useAsync(
        () => tasksApi.list({ mine: "true", done: "false" }),
        []
    );
    const tasks = (data?.results || data || []).slice(0, 6);
    if (!tasks.length) return null;
    return (
        <Card className="p-6">
            <SectionTitle
                action={
                    <Link to="/tasks" className="text-sm text-blue-400 hover:text-blue-300">
                        همه
                    </Link>
                }
            >
                کارهای من
            </SectionTitle>
            <div className="divide-y divide-slate-800">
                {tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5">
                        <button
                            onClick={async () => {
                                await tasksApi.toggle(t.id);
                                reload();
                            }}
                            className="text-slate-500 hover:text-green-400"
                        >
                            <Square size={16} />
                        </button>
                        <span className="text-sm text-slate-200 flex-1 truncate">
                            {t.title}
                        </span>
                        {t.due_date && (
                            <span
                                className={`text-xs ${
                                    new Date(t.due_date) < new Date(new Date().toDateString())
                                        ? "text-red-400"
                                        : "text-slate-500"
                                }`}
                            >
                                {fmtDate(t.due_date)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default function AtsDashboard() {
    const { data, loading, error, reload } = useAsync(
        () => statsApi.dashboard(),
        []
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !data) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-72" />
            </div>
        );
    }

    const trend = (data.applications_trend || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("fa-IR", {
            month: "short",
            day: "numeric",
        }),
    }));
    const maxPipeline = Math.max(1, ...(data.pipeline || []).map((p) => p.count));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">داشبورد</h1>
                <p className="text-slate-500 mt-1">نمای کلی استخدام</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard icon={Users} label="کاندیداها" value={fmtNum(data.total_candidates)} />
                <StatCard icon={Briefcase} label="آگهی‌های باز" value={fmtNum(data.open_jobs)} tone="green" />
                <StatCard
                    icon={GitPullRequest}
                    label="درخواست‌های فعال"
                    value={fmtNum(data.active_applications)}
                    tone="purple"
                />
                <StatCard
                    icon={CalendarClock}
                    label="مصاحبه این هفته"
                    value={fmtNum(data.interviews_this_week)}
                    tone="amber"
                />
                <StatCard
                    icon={Trophy}
                    label="استخدام این ماه"
                    value={fmtNum(data.hires_this_month)}
                    tone="pink"
                />
            </div>

            <Card className="p-6">
                <SectionTitle>روند درخواست‌ها (۳۰ روز)</SectionTitle>
                <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} interval={4} />
                            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} width={28} />
                            <Tooltip
                                contentStyle={{
                                    background: "#0f172a",
                                    border: "1px solid #1e293b",
                                    borderRadius: 12,
                                    color: "#e2e8f0",
                                }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#ga)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <SectionTitle>پایپ‌لاین</SectionTitle>
                    {data.pipeline?.length ? (
                        <div className="space-y-3">
                            {data.pipeline.map((p) => (
                                <div key={p.stage}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">{p.stage}</span>
                                        <span className="text-slate-500">{fmtNum(p.count)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                p.kind === "won"
                                                    ? "bg-green-500"
                                                    : p.kind === "lost"
                                                    ? "bg-red-500"
                                                    : "bg-blue-500"
                                            }`}
                                            style={{ width: `${(p.count / maxPipeline) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">داده‌ای نیست.</p>
                    )}
                </Card>

                <Card className="p-6">
                    <SectionTitle
                        action={
                            <Link to="/interviews" className="text-sm text-blue-400 hover:text-blue-300">
                                همه
                            </Link>
                        }
                    >
                        مصاحبه‌های پیش‌رو
                    </SectionTitle>
                    {data.upcoming_interviews?.length ? (
                        <div className="divide-y divide-slate-800">
                            {data.upcoming_interviews.map((iv) => (
                                <div key={iv.id} className="flex items-center gap-3 py-3">
                                    <Avatar name={iv.candidate?.full_name} src={iv.candidate?.photo} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 truncate">
                                            {iv.candidate?.full_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {iv.job?.title} · {fmtDateTime(iv.scheduled_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">مصاحبه‌ای زمان‌بندی نشده.</p>
                    )}
                </Card>
            </div>

            <MyTasks />

            <Card className="p-6">
                <SectionTitle>فعالیت‌های اخیر</SectionTitle>
                {data.recent_activity?.length ? (
                    <div className="space-y-4">
                        {data.recent_activity.map((a) => (
                            <div key={a.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <ActivityIcon size={15} className="text-slate-500" />
                                </div>
                                <div className="text-sm">
                                    <span className="text-slate-300">{a.verb}</span>
                                    <div className="text-xs text-slate-600 mt-0.5">
                                        {a.actor?.full_name ? `${a.actor.full_name} · ` : ""}
                                        {fmtRelative(a.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={ActivityIcon} title="فعالیتی ثبت نشده" />
                )}
            </Card>
        </div>
    );
}
