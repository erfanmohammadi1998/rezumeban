import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";

import { candidatesApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui";

export default function ImportModal({ open, onClose, onDone }) {
    const toast = useToast();
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);

    const reset = () => {
        setFile(null);
        setResult(null);
    };

    const submit = async () => {
        if (!file) return;
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await candidatesApi.importCsv(fd);
            setResult(res);
            if (res.created) {
                toast.success(`${res.created} کاندیدا وارد شد`);
                onDone?.();
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "ورود فایل ناموفق بود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                reset();
                onClose();
            }}
            title="ورود کاندیدا از فایل CSV"
            footer={
                result ? (
                    <Button
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                    >
                        بستن
                    </Button>
                ) : (
                    <>
                        <Button variant="ghost" onClick={onClose}>
                            انصراف
                        </Button>
                        <Button loading={busy} disabled={!file} onClick={submit}>
                            ورود
                        </Button>
                    </>
                )
            }
        >
            {result ? (
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 size={18} />
                        {result.created.toLocaleString("fa-IR")} کاندیدای جدید ساخته شد
                    </div>
                    {result.skipped > 0 && (
                        <div className="text-slate-400">
                            {result.skipped.toLocaleString("fa-IR")} مورد تکراری نادیده گرفته شد
                        </div>
                    )}
                    {result.errors?.length > 0 && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                            <div className="flex items-center gap-2 text-amber-400 mb-1">
                                <AlertTriangle size={15} />
                                {result.errors.length} سطر رد شد
                            </div>
                            {result.errors.map((e, i) => (
                                <div key={i} className="text-xs text-slate-500">
                                    {e}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">
                        فایل باید ستون‌های <span className="text-slate-300">نام</span>،{" "}
                        <span className="text-slate-300">نام خانوادگی</span> و{" "}
                        <span className="text-slate-300">ایمیل</span> داشته باشد (ستون‌های
                        تلفن، عنوان شغلی و موقعیت اختیاری‌اند). عنوان انگلیسی ستون‌ها هم
                        پذیرفته می‌شود.
                    </p>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-xl py-10 cursor-pointer hover:border-slate-500 transition">
                        <UploadCloud size={28} className="text-slate-500" />
                        <span className="text-sm text-slate-400">
                            {file ? file.name : "انتخاب فایل CSV"}
                        </span>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files[0] || null)}
                        />
                    </label>
                </div>
            )}
        </Modal>
    );
}
