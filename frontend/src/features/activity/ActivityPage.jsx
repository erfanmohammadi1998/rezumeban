import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity as ActivityIcon } from "lucide-react";

import { activityApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { Card, Skeleton, EmptyState, ErrorState, Button } from "../../components/ui";
import Avatar from "../../components/ui/Avatar";
import { fmtRelative, fmtDateTime } from "../../lib/format";

export default function ActivityPage() {
    const [page, setPage] = useState(1);
    const { data, loading, error, reload } = useAsync(
        () => activityApi.list({ page }),
        [page]
    );

    const items = data?.results || [];
    const hasNext = Boolean(data?.next);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">فعالیت‌ها</h1>
                <p className="text-slate-500 mt-1">
                    {(data?.count ?? 0).toLocaleString("fa-IR")} رویداد ثبت‌شده
                </p>
            </div>

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <div className="grid gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState icon={ActivityIcon} title="فعالیتی ثبت نشده" />
            ) : (
                <Card className="p-2">
                    <div className="divide-y divide-slate-800">
                        {items.map((a) => (
                            <div key={a.id} className="flex items-start gap-3 p-3">
                                <Avatar
                                    name={a.actor?.full_name || "سیستم"}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200">{a.verb}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                                        <span title={fmtDateTime(a.created_at)}>
                                            {fmtRelative(a.created_at)}
                                        </span>
                                        {a.candidate && (
                                            <Link
                                                to={`/candidates/${a.candidate}`}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                کاندیدا
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="flex justify-center gap-2">
                {page > 1 && (
                    <Button variant="outline" onClick={() => setPage((p) => p - 1)}>
                        جدیدتر
                    </Button>
                )}
                {hasNext && (
                    <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                        قدیمی‌تر
                    </Button>
                )}
            </div>
        </div>
    );
}
