import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Trash2, Briefcase, GitCompare, X } from "lucide-react";

import { candidatesApi, metaApi, jobsApi, applicationsApi } from "../../api/client";
import { MODULES } from "../../config/modules";
import { useToast } from "../../context/ToastContext";
import useAsync from "../../hooks/useAsync";
import { Button } from "../../components/ui";
import { Select } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";

function TagModal({ ids, onClose, onDone }) {
    const toast = useToast();
    const { data: tags } = useAsync(() => metaApi.tags(), []);
    const [picked, setPicked] = useState([]);
    const [saving, setSaving] = useState(false);

    const toggle = (id) =>
        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const apply = async () => {
        setSaving(true);
        try {
            await candidatesApi.bulkTag(ids, picked);
            toast.success(`${ids.length} کاندیدا برچسب خورد`);
            onDone();
            onClose();
        } catch {
            toast.error("عملیات ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={`برچسب‌گذاری ${ids.length} کاندیدا`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={saving} disabled={!picked.length} onClick={apply}>
                        اعمال
                    </Button>
                </>
            }
        >
            <div className="flex flex-wrap gap-2">
                {(tags || []).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => toggle(t.id)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            picked.includes(t.id)
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                    >
                        {t.name}
                    </button>
                ))}
                {!tags?.length && (
                    <p className="text-sm text-slate-500">
                        هنوز برچسبی ساخته نشده — از تنظیمات اضافه کنید.
                    </p>
                )}
            </div>
        </Modal>
    );
}

function AddToJobModal({ ids, onClose, onDone }) {
    const toast = useToast();
    const { data: jobs } = useAsync(
        () => jobsApi.list({ status: "open", page_size: 100 }),
        []
    );
    const [slug, setSlug] = useState("");
    const [saving, setSaving] = useState(false);

    const apply = async () => {
        const job = (jobs?.results || []).find((j) => j.slug === slug);
        if (!job) return;
        setSaving(true);
        let ok = 0;
        for (const id of ids) {
            try {
                await applicationsApi.create({ candidate_id: id, job_id: job.id });
                ok += 1;
            } catch {
                /* likely already applied — skip */
            }
        }
        toast.success(`${ok} کاندیدا به «${job.title}» اضافه شد`);
        setSaving(false);
        onDone();
        onClose();
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={`افزودن ${ids.length} کاندیدا به آگهی`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={saving} disabled={!slug} onClick={apply}>
                        افزودن
                    </Button>
                </>
            }
        >
            <Select value={slug} onChange={(e) => setSlug(e.target.value)}>
                <option value="">— انتخاب آگهی —</option>
                {(jobs?.results || []).map((j) => (
                    <option key={j.slug} value={j.slug}>
                        {j.title}
                    </option>
                ))}
            </Select>
        </Modal>
    );
}

export default function BulkActions({ ids, query, onClear, onChanged }) {
    const toast = useToast();
    const navigate = useNavigate();
    const [modal, setModal] = useState(null);
    const canCompare = ids.length >= 2 && ids.length <= 4;

    const exportCsv = async () => {
        try {
            const res = await candidatesApi.export(query);
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = "candidates.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("خروجی گرفتن ناموفق بود");
        }
    };

    const del = async () => {
        if (!confirm(`${ids.length} کاندیدا برای همیشه حذف شوند؟`)) return;
        try {
            await candidatesApi.bulkDelete(ids);
            toast.success(`${ids.length} کاندیدا حذف شد`);
            onChanged();
            onClear();
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    return (
        <>
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl px-3 py-2"
            >
                <span className="text-sm text-slate-300 px-2">
                    {ids.length.toLocaleString("fa-IR")} انتخاب‌شده
                </span>
                {canCompare && (
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={GitCompare}
                        onClick={() => navigate(`/candidates/compare?ids=${ids.join(",")}`)}
                    >
                        مقایسه
                    </Button>
                )}
                <Button size="sm" variant="secondary" icon={Tag} onClick={() => setModal("tag")}>
                    برچسب
                </Button>
                {MODULES.jobs && (
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Briefcase}
                        onClick={() => setModal("job")}
                    >
                        افزودن به آگهی
                    </Button>
                )}
                <Button size="sm" variant="secondary" onClick={exportCsv}>
                    خروجی CSV
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={del}>
                    حذف
                </Button>
                <button onClick={onClear} className="text-slate-400 hover:text-white p-1.5">
                    <X size={16} />
                </button>
            </motion.div>

            {modal === "tag" && (
                <TagModal ids={ids} onClose={() => setModal(null)} onDone={onChanged} />
            )}
            {modal === "job" && (
                <AddToJobModal ids={ids} onClose={() => setModal(null)} onDone={onChanged} />
            )}
        </>
    );
}
