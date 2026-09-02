import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileSignature, Send, Check, X } from "lucide-react";

import { offersApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Card,
    Badge,
    Button,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import FilterBar from "../../components/FilterBar";
import Avatar from "../../components/ui/Avatar";
import { fmtMoney, fmtDate, fmtRelative } from "../../lib/format";

const STATUS_COLORS = {
    draft: "slate",
    sent: "blue",
    accepted: "green",
    declined: "red",
    expired: "amber",
};
const STATUS_LABELS = {
    draft: "پیش‌نویس",
    sent: "ارسال‌شده",
    accepted: "پذیرفته‌شده",
    declined: "رد شده",
    expired: "منقضی",
};

export default function OffersPage() {
    const toast = useToast();
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(null);

    const query = useMemo(
        () => ({ status: status || undefined, ordering: "-created_at" }),
        [status]
    );
    const { data, loading, error, reload } = useAsync(
        () => offersApi.list(query),
        [JSON.stringify(query)]
    );
    const offers = data?.results || data || [];

    const act = async (id, fn, label) => {
        setBusy(id);
        try {
            await fn(id);
            toast.success(label);
            reload();
        } catch (err) {
            toast.error(err.response?.data?.detail || "عملیات ناموفق بود");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">پیشنهادهای همکاری</h1>
                <p className="text-slate-500 mt-1">
                    {(data?.count ?? offers.length).toLocaleString("fa-IR")} پیشنهاد
                </p>
            </div>

            <FilterBar
                selects={[
                    {
                        key: "status",
                        value: status,
                        onChange: setStatus,
                        allLabel: "همه وضعیت‌ها",
                        options: Object.entries(STATUS_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        })),
                    },
                ]}
                activeCount={status ? 1 : 0}
                onClear={() => setStatus("")}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            ) : offers.length === 0 ? (
                <EmptyState
                    icon={FileSignature}
                    title="پیشنهادی ثبت نشده"
                    description="از برد پایپ‌لاین، برای یک کاندیدا پیشنهاد همکاری بسازید."
                />
            ) : (
                <div className="grid gap-3">
                    {offers.map((o) => (
                        <Card key={o.id} className="p-5">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={o.candidate?.full_name}
                                        src={o.candidate?.photo}
                                    />
                                    <div>
                                        <Link
                                            to={`/candidates/${o.candidate?.id}`}
                                            className="font-medium text-slate-100 hover:text-blue-400"
                                        >
                                            {o.candidate?.full_name}
                                        </Link>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {o.job?.title}
                                            {o.title ? ` · ${o.title}` : ""}
                                        </div>
                                    </div>
                                </div>
                                <Badge color={STATUS_COLORS[o.status]}>
                                    {o.status_display || STATUS_LABELS[o.status]}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400 mt-4">
                                {o.salary && <span>{fmtMoney(o.salary)}</span>}
                                {o.start_date && <span>شروع: {fmtDate(o.start_date)}</span>}
                                {o.expires_on && (
                                    <span>مهلت: {fmtDate(o.expires_on)}</span>
                                )}
                                <span className="text-slate-600">
                                    ساخته‌شده {fmtRelative(o.created_at)}
                                </span>
                            </div>

                            {(o.status === "draft" || o.status === "sent") && (
                                <div className="flex gap-2 mt-4">
                                    {o.status === "draft" && (
                                        <Button
                                            size="sm"
                                            icon={Send}
                                            loading={busy === o.id}
                                            onClick={() =>
                                                act(o.id, offersApi.send, "پیشنهاد ارسال شد")
                                            }
                                        >
                                            ارسال به کاندیدا
                                        </Button>
                                    )}
                                    {o.status === "sent" && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={Check}
                                                loading={busy === o.id}
                                                onClick={() =>
                                                    act(
                                                        o.id,
                                                        offersApi.accept,
                                                        "به‌عنوان پذیرفته‌شده ثبت شد"
                                                    )
                                                }
                                            >
                                                پذیرفته شد
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                icon={X}
                                                loading={busy === o.id}
                                                onClick={() =>
                                                    act(
                                                        o.id,
                                                        offersApi.decline,
                                                        "به‌عنوان رد‌شده ثبت شد"
                                                    )
                                                }
                                            >
                                                رد شد
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
