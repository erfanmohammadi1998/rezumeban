import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, Trash2, X } from "lucide-react";

import { talentPoolsApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import { Field, Input, Textarea } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import StarRating from "../../components/ui/StarRating";

function CreateModal({ open, onClose, onDone }) {
    const toast = useToast();
    const [form, setForm] = useState({ name: "", description: "" });
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (!form.name.trim()) return;
        setBusy(true);
        try {
            await talentPoolsApi.create(form);
            toast.success("استخر ساخته شد");
            setForm({ name: "", description: "" });
            onDone();
            onClose();
        } catch {
            toast.error("ساخت استخر ناموفق بود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="استخر استعداد جدید"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={busy} onClick={submit}>
                        ساخت
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="نام" required>
                    <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        autoFocus
                    />
                </Field>
                <Field label="توضیح">
                    <Textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    />
                </Field>
            </div>
        </Modal>
    );
}

export default function PoolsPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useAsync(() => talentPoolsApi.list(), []);
    const [createOpen, setCreateOpen] = useState(false);
    const [openId, setOpenId] = useState(null);

    const pools = data?.results || data || [];
    const detail = useAsync(
        () => (openId ? talentPoolsApi.get(openId) : Promise.resolve(null)),
        [openId]
    );

    if (error) return <ErrorState error={error} onRetry={reload} />;

    const removePool = async (id) => {
        if (!confirm("این استخر حذف شود؟")) return;
        try {
            await talentPoolsApi.remove(id);
            toast.success("حذف شد");
            reload();
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    const removeCandidate = async (poolId, cid) => {
        await talentPoolsApi.removeCandidates(poolId, [cid]);
        detail.reload();
        reload();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">استخرهای استعداد</h1>
                    <p className="text-slate-500 mt-1">
                        دسته‌بندی کاندیداها برای موقعیت‌های آینده
                    </p>
                </div>
                <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                    استخر جدید
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : pools.length === 0 ? (
                <EmptyState
                    icon={FolderOpen}
                    title="استخری ساخته نشده"
                    description="از فهرست کاندیداها چند نفر را انتخاب و به یک استخر اضافه کنید."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pools.map((p) => (
                        <Card key={p.id} className="p-5">
                            <div className="flex items-start justify-between">
                                <button
                                    onClick={() => setOpenId(p.id)}
                                    className="text-right"
                                >
                                    <div className="font-semibold text-slate-100">
                                        {p.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {p.candidate_count?.toLocaleString("fa-IR") || "۰"}{" "}
                                        کاندیدا
                                    </div>
                                </button>
                                <button
                                    onClick={() => removePool(p.id)}
                                    className="text-slate-600 hover:text-red-400"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {p.description && (
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                    {p.description}
                                </p>
                            )}
                            <button
                                onClick={() => setOpenId(p.id)}
                                className="text-sm text-blue-400 hover:text-blue-300 mt-3"
                            >
                                مشاهدهٔ اعضا
                            </button>
                        </Card>
                    ))}
                </div>
            )}

            <CreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onDone={reload}
            />

            <Modal
                open={Boolean(openId)}
                onClose={() => setOpenId(null)}
                size="lg"
                title={detail.data?.name || "استخر"}
            >
                {!detail.data ? (
                    <Skeleton className="h-40" />
                ) : detail.data.candidates?.length ? (
                    <div className="space-y-2">
                        {detail.data.candidates.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3"
                            >
                                <Avatar name={c.full_name} src={c.photo} size="sm" />
                                <Link
                                    to={`/candidates/${c.id}`}
                                    className="text-sm text-slate-100 hover:text-blue-400 flex-1 truncate"
                                >
                                    {c.full_name}
                                </Link>
                                <StarRating value={c.rating} readOnly size={13} />
                                <button
                                    onClick={() => removeCandidate(openId, c.id)}
                                    className="text-slate-500 hover:text-red-400"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 py-6 text-center">
                        این استخر خالی است.
                    </p>
                )}
            </Modal>
        </div>
    );
}
