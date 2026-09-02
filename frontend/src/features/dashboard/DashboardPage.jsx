import { Link } from "react-router-dom";
import {
    Users,
    UserPlus,
    Star,
    Gauge,
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

import { statsApi } from "../../api/client";
import { MODULES } from "../../config/modules";
import useAsync from "../../hooks/useAsync";
import {
    Card,
    Skeleton,
    SectionTitle,
    EmptyState,
    ErrorState,
    Badge,
} from "../../components/ui";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";
import { fmtNum, fmtRelative, SOURCE_LABELS } from "../../lib/format";
import AtsDashboard from "./AtsDashboard";

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
    const tones = {
        blue: "bg-blue-500/15 text-blue-300",
        green: "bg-green-500/15 text-green-300",
        amber: "bg-amber-500/15 text-amber-300",
        purple: "bg-purple-500/15 text-purple-300",
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

export default function DashboardPage() {
    if (MODULES.jobs) return <AtsDashboard />;
    return <CvDashboard />;
}

function CvDashboard() {
    const { data, loading, error, reload } = useAsync(
        () => statsApi.candidates(),
        []
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !data) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-72" />
            </div>
        );
    }

    const trend = (data.candidates_trend || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("fa-IR", {
            month: "short",
            day: "numeric",
        }),
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">داشبورد</h1>
                <p className="text-slate-500 mt-1">نمای کلی بانک رزومه‌ها</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="کل کاندیداها"
                    value={fmtNum(data.total_candidates)}
                    tone="blue"
                />
                <StatCard
                    icon={UserPlus}
                    label="جدید در هفته اخیر"
                    value={fmtNum(data.new_candidates_this_week)}
                    tone="green"
                />
                <StatCard
                    icon={Star}
                    label="نشان‌شده‌ها"
                    value={fmtNum(data.favorites)}
                    tone="amber"
                />
                <StatCard
                    icon={Gauge}
                    label="میانگین امتیاز"
                    value={data.avg_rating?.toLocaleString("fa-IR") ?? "۰"}
                    tone="purple"
                />
            </div>

            <Card className="p-6">
                <SectionTitle>روند افزودن کاندیدا (۳۰ روز)</SectionTitle>
                <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                interval={4}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                width={28}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#0f172a",
                                    border: "1px solid #1e293b",
                                    borderRadius: 12,
                                    color: "#e2e8f0",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#g)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                    <SectionTitle
                        action={
                            <Link
                                to="/candidates"
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                مشاهده همه
                            </Link>
                        }
                    >
                        آخرین کاندیداها
                    </SectionTitle>
                    {data.latest_candidates?.length ? (
                        <div className="divide-y divide-slate-800">
                            {data.latest_candidates.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/candidates/${c.id}`}
                                    className="flex items-center gap-3 py-3 hover:bg-slate-800/40 -mx-2 px-2 rounded-lg transition"
                                >
                                    <Avatar name={c.full_name} src={c.photo} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 truncate">
                                            {c.full_name}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {c.headline || "—"}
                                        </div>
                                    </div>
                                    <StarRating value={c.rating} readOnly size={14} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-6 text-center">
                            هنوز کاندیدایی ثبت نشده است.
                        </p>
                    )}
                </Card>

                <Card className="p-6">
                    <SectionTitle>منابع جذب</SectionTitle>
                    {data.sources?.length ? (
                        <div className="space-y-3">
                            {data.sources.map((s) => (
                                <div
                                    key={s.source}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-slate-400">
                                        {SOURCE_LABELS[s.source] || s.source || "نامشخص"}
                                    </span>
                                    <Badge color="blue">{fmtNum(s.count)}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">داده‌ای موجود نیست.</p>
                    )}
                </Card>
            </div>

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
