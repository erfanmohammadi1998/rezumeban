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
import { Clock, Trophy, Download } from "lucide-react";

import { statsApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import useAsync from "../../hooks/useAsync";
import { Card, Skeleton, SectionTitle, ErrorState, Button } from "../../components/ui";
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
    const toast = useToast();
    const { data, loading, error, reload } = useAsync(() => statsApi.reports(), []);

    const exportCsv = async () => {
        try {
            const res = await statsApi.reportsExport();
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = "hiring-funnel.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("خروجی گرفتن ناموفق بود");
        }
    };

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
    const funnel = (data.funnel || []).map((r) => ({
        name: r.stage,
        reached: r.reached,
        current: r.current,
        kind: r.kind,
    }));
    const timeInStage = (data.time_in_stage || []).map((r) => ({
        name: r.stage,
        avg_days: r.avg_days,
    }));
    const sources = data.source_effectiveness || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-100">گزارش‌ها</h1>
                <Button variant="secondary" icon={Download} onClick={exportCsv}>
                    خروجی قیف (CSV)
                </Button>
            </div>

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

            {funnel.length > 0 && (
                <ChartCard title="قیف استخدام — تعداد ورودی به هر مرحله">
                    <BarChart data={funnel}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            allowDecimals={false}
                            width={28}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="reached" name="کل ورودی" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="current" name="اکنون" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ChartCard>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {timeInStage.some((t) => t.avg_days > 0) && (
                    <ChartCard title="میانگین روز در هر مرحله">
                        <BarChart data={timeInStage} layout="vertical" margin={{ right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                width={90}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="avg_days" name="روز" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ChartCard>
                )}

                {sources.length > 0 && (
                    <Card className="p-6">
                        <SectionTitle>اثربخشی منابع جذب</SectionTitle>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-500 text-xs">
                                    <th className="text-right pb-2">منبع</th>
                                    <th className="text-left pb-2">درخواست</th>
                                    <th className="text-left pb-2">استخدام</th>
                                    <th className="text-left pb-2">نرخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((s) => (
                                    <tr key={s.source} className="border-t border-slate-800">
                                        <td className="py-2 text-slate-300">{s.source}</td>
                                        <td className="py-2 text-left text-slate-400">
                                            {s.applicants.toLocaleString("fa-IR")}
                                        </td>
                                        <td className="py-2 text-left text-slate-400">
                                            {s.hired.toLocaleString("fa-IR")}
                                        </td>
                                        <td className="py-2 text-left text-green-400">
                                            ٪{s.hire_rate.toLocaleString("fa-IR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

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
