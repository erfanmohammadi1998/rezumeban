import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Clock, Trophy } from "lucide-react";

import { statsApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { Card, Skeleton, SectionTitle, ErrorState } from "../../components/ui";
import {
    APP_STATUS_LABELS,
    INTERVIEW_TYPE_LABELS,
    fmtNum,
} from "../../lib/format";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

const tooltipStyle = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    color: "#e2e8f0",
};

function ChartCard({ title, children }) {
    return (
        <Card className="p-6">
            <SectionTitle>{title}</SectionTitle>
            <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export default function ReportsPage() {
    const { data, loading, error, reload } = useAsync(() => statsApi.reports(), []);

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !data) {
        return (
            <div className="grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-72" />
                ))}
            </div>
        );
    }

    const byStatus = (data.applications_by_status || []).map((r) => ({
        name: APP_STATUS_LABELS[r.status] || r.status,
        value: r.count,
    }));
    const byJob = (data.applications_by_job || []).map((r) => ({
        name: r.title,
        count: r.count,
    }));
    const byDept = (data.jobs_by_department || []).map((r) => ({
        name: r.name,
        count: r.count,
    }));
    const byType = (data.interviews_by_type || []).map((r) => ({
        name: INTERVIEW_TYPE_LABELS[r.interview_type] || r.interview_type,
        value: r.count,
    }));
    const ratings = (data.rating_distribution || []).map((r) => ({
        name: `${r.rating}★`,
        count: r.count,
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100">گزارش‌ها</h1>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/15 text-green-300 flex items-center justify-center">
                        <Trophy size={22} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-100">
                            {fmtNum(data.total_hires)}
                        </div>
                        <div className="text-sm text-slate-500">کل استخدام‌ها</div>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-100">
                            {data.avg_time_to_hire?.toLocaleString("fa-IR")} روز
                        </div>
                        <div className="text-sm text-slate-500">میانگین زمان تا استخدام</div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="درخواست‌ها بر اساس وضعیت">
                    <PieChart>
                        <Pie
                            data={byStatus}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={90}
                        >
                            {byStatus.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                </ChartCard>

                <ChartCard title="مصاحبه‌ها بر اساس نوع">
                    <PieChart>
                        <Pie
                            data={byType}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={90}
                        >
                            {byType.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                </ChartCard>

                <ChartCard title="بیشترین درخواست بر اساس آگهی">
                    <BarChart data={byJob} layout="vertical" margin={{ right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            width={110}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ChartCard>

                <ChartCard title="توزیع امتیاز کاندیداها">
                    <BarChart data={ratings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} width={28} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ChartCard>

                {byDept.length > 0 && (
                    <ChartCard title="آگهی‌ها بر اساس دپارتمان">
                        <BarChart data={byDept}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} width={28} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ChartCard>
                )}
            </div>
        </div>
    );
}
