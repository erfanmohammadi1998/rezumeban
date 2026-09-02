import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy, GitMerge } from "lucide-react";

import { candidatesApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Card,
    Badge,
    Button,
    PageLoader,
    ErrorState,
    EmptyState,
} from "../../components/ui";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";
import { fmtRelative, SOURCE_LABELS } from "../../lib/format";

export default function DuplicatesPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useAsync(
        () => candidatesApi.duplicates(),
        []
    );
    const [merging, setMerging] = useState(null);

    if (error) return <ErrorState error={error} onRetry={reload} />;
    if (loading || !data) return <PageLoader />;

    const merge = async (keepId, dropId) => {
        setMerging(dropId);
        try {
            await candidatesApi.merge(keepId, dropId);
            toast.success("کاندیداها ادغام شدند");
            reload();
        } catch (err) {
            toast.error(err.response?.data?.detail || "ادغام ناموفق بود");
        } finally {
            setMerging(null);
        }
    };

    return (
        <div className="space-y-6">
            <Link
                to="/candidates"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
                <ArrowRight size={16} />
                کاندیداها
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-100">کاندیداهای تکراری</h1>
                <p className="text-slate-500 mt-1">
                    {data.count.toLocaleString("fa-IR")} گروه با ایمیل یا تلفن یکسان
                </p>
            </div>

            {data.groups.length === 0 ? (
                <EmptyState
                    icon={Copy}
                    title="موردی پیدا نشد"
                    description="هیچ دو کاندیدایی ایمیل یا شمارهٔ یکسان ندارند."
                />
            ) : (
                <div className="space-y-4">
                    {data.groups.map((g, gi) => (
                        <Card key={gi} className="p-5">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <Badge color="amber">
                                    {g.match_on === "email" ? "ایمیل یکسان" : "تلفن یکسان"}
                                </Badge>
                                <span dir="ltr">{g.value}</span>
                            </div>
                            <div className="space-y-2">
                                {g.candidates.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3"
                                    >
                                        <Avatar name={c.full_name} src={c.photo} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                to={`/candidates/${c.id}`}
                                                className="text-sm text-slate-100 hover:text-blue-400"
                                            >
                                                {c.full_name}
                                            </Link>
                                            <div className="text-xs text-slate-500">
                                                {SOURCE_LABELS[c.source] || c.source} ·{" "}
                                                {fmtRelative(c.created_at)} ·{" "}
                                                {c.application_count?.toLocaleString("fa-IR") ||
                                                    "۰"}{" "}
                                                درخواست
                                            </div>
                                        </div>
                                        <StarRating value={c.rating} readOnly size={13} />
                                        <div className="flex gap-1.5">
                                            {g.candidates
                                                .filter((o) => o.id !== c.id)
                                                .map((o) => (
                                                    <Button
                                                        key={o.id}
                                                        size="sm"
                                                        variant="secondary"
                                                        icon={GitMerge}
                                                        loading={merging === o.id}
                                                        onClick={() => merge(c.id, o.id)}
                                                        title={`ادغام «${o.full_name}» در این`}
                                                    >
                                                        نگه‌داشتن این
                                                    </Button>
                                                ))
                                                .slice(0, 1)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
