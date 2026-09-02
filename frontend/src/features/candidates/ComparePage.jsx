import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

import { candidatesApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { Card, PageLoader, ErrorState, Badge, Button } from "../../components/ui";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";
import {
    SOURCE_LABELS,
    fmtMoney,
    fmtDate,
    SKILL_LEVEL_LABELS,
} from "../../lib/format";

const ROWS = [
    { key: "headline", label: "عنوان شغلی", get: (c) => c.headline || "—" },
    { key: "location", label: "موقعیت", get: (c) => c.location || "—" },
    {
        key: "source",
        label: "منبع",
        get: (c) => SOURCE_LABELS[c.source] || c.source,
    },
    {
        key: "expected_salary",
        label: "حقوق درخواستی",
        get: (c) => fmtMoney(c.expected_salary),
    },
    {
        key: "experience",
        label: "سوابق کاری",
        get: (c) =>
            c.work_experiences?.length
                ? `${c.work_experiences.length} مورد`
                : "—",
    },
    {
        key: "education",
        label: "تحصیلات",
        get: (c) =>
            c.educations?.length
                ? c.educations
                      .map((e) => `${e.degree} ${e.field_of_study}`.trim())
                      .join("، ")
                : "—",
    },
    {
        key: "created",
        label: "تاریخ ثبت",
        get: (c) => fmtDate(c.created_at),
    },
];

export default function ComparePage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const ids = (params.get("ids") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const { data, loading, error, reload } = useAsync(
        () => Promise.all(ids.map((id) => candidatesApi.get(id))),
        [params.get("ids")]
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !data) return <PageLoader />;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
                <ArrowRight size={16} />
                بازگشت
            </button>
            <h1 className="text-2xl font-bold text-slate-100">مقایسه کاندیداها</h1>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-32" />
                            {data.map((c) => (
                                <th key={c.id} className="p-4 align-top min-w-52">
                                    <Card className="p-4">
                                        <Avatar
                                            name={c.full_name}
                                            src={c.photo}
                                            size="lg"
                                            className="mx-auto"
                                        />
                                        <Link
                                            to={`/candidates/${c.id}`}
                                            className="block text-center font-semibold text-slate-100 hover:text-blue-400 mt-2"
                                        >
                                            {c.full_name}
                                        </Link>
                                        <div className="flex justify-center mt-2">
                                            <StarRating value={c.rating} readOnly size={14} />
                                        </div>
                                        {c.is_favorite && (
                                            <div className="flex justify-center mt-1">
                                                <Star
                                                    size={13}
                                                    className="fill-amber-400 text-amber-400"
                                                />
                                            </div>
                                        )}
                                    </Card>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((row) => (
                            <tr key={row.key} className="border-t border-slate-800">
                                <td className="p-4 text-sm text-slate-500 font-medium align-top">
                                    {row.label}
                                </td>
                                {data.map((c) => (
                                    <td
                                        key={c.id}
                                        className="p-4 text-sm text-slate-200 align-top"
                                    >
                                        {row.get(c)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="border-t border-slate-800">
                            <td className="p-4 text-sm text-slate-500 font-medium align-top">
                                مهارت‌ها
                            </td>
                            {data.map((c) => (
                                <td key={c.id} className="p-4 align-top">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(c.skills || []).map((s) => (
                                            <Badge key={s.id} color="slate">
                                                {s.name}
                                                <span className="text-slate-500">
                                                    {" "}
                                                    · {SKILL_LEVEL_LABELS[s.level] || s.level}
                                                </span>
                                            </Badge>
                                        ))}
                                        {!c.skills?.length && (
                                            <span className="text-sm text-slate-500">—</span>
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <Button variant="outline" onClick={() => navigate("/candidates")}>
                بازگشت به فهرست
            </Button>
        </div>
    );
}
