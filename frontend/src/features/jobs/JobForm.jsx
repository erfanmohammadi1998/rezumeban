import { useEffect, useState } from "react";

import { jobsApi, metaApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import { Button } from "../../components/ui";
import { Field, Input, Textarea, Select, Checkbox } from "../../components/ui/form";
import { EMPLOYMENT_LABELS, JOB_STATUS_LABELS } from "../../lib/format";

const EMPTY = {
    title: "",
    department_id: "",
    location: "",
    employment_type: "full_time",
    is_remote: false,
    status: "open",
    openings: 1,
    salary_min: "",
    salary_max: "",
    description: "",
    requirements: "",
};

function fromJob(j) {
    return {
        ...EMPTY,
        ...j,
        department_id: j.department?.id ?? "",
        salary_min: j.salary_min ?? "",
        salary_max: j.salary_max ?? "",
    };
}

export default function JobForm({ open, onClose, job, onSaved }) {
    const toast = useToast();
    const editing = Boolean(job);
    const [form, setForm] = useState(EMPTY);
    const [departments, setDepartments] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [seededFor, setSeededFor] = useState(null);
    const seedKey = open ? job?.slug ?? "new" : null;
    if (seededFor !== seedKey) {
        setSeededFor(seedKey);
        if (open) {
            setForm(job ? fromJob(job) : EMPTY);
            setErrors({});
        }
    }

    useEffect(() => {
        if (open) metaApi.departments().then(setDepartments).catch(() => {});
    }, [open]);

    const field = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const clean = (v) => (v === "" ? null : v);
        const payload = {
            title: form.title,
            department_id: clean(form.department_id),
            location: form.location,
            employment_type: form.employment_type,
            is_remote: form.is_remote,
            status: form.status,
            openings: Number(form.openings) || 1,
            salary_min: clean(form.salary_min),
            salary_max: clean(form.salary_max),
            description: form.description,
            requirements: form.requirements,
        };
        try {
            const saved = editing
                ? await jobsApi.update(job.slug, payload)
                : await jobsApi.create(payload);
            toast.success(editing ? "آگهی به‌روزرسانی شد" : "آگهی ایجاد شد");
            onSaved?.(saved);
            onClose();
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            toast.error("ذخیره ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    const err = (k) => {
        const v = errors[k];
        return Array.isArray(v) ? v[0] : typeof v === "string" ? v : undefined;
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={editing ? "ویرایش آگهی" : "آگهی جدید"}
            footer={
                <>
                    <Button variant="ghost" type="button" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button type="button" loading={saving} onClick={submit}>
                        {editing ? "ذخیره" : "ایجاد"}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="عنوان شغلی" required error={err("title")}>
                    <Input name="title" value={form.title} onChange={field} required />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="دپارتمان">
                        <Select
                            name="department_id"
                            value={form.department_id}
                            onChange={field}
                        >
                            <option value="">—</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="موقعیت مکانی" error={err("location")}>
                        <Input name="location" value={form.location} onChange={field} />
                    </Field>
                    <Field label="نوع همکاری">
                        <Select
                            name="employment_type"
                            value={form.employment_type}
                            onChange={field}
                        >
                            {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="وضعیت">
                        <Select name="status" value={form.status} onChange={field}>
                            {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="تعداد نیرو" error={err("openings")}>
                        <Input
                            name="openings"
                            type="number"
                            min={1}
                            value={form.openings}
                            onChange={field}
                        />
                    </Field>
                    <div className="flex items-end pb-2">
                        <Checkbox
                            label="دورکاری"
                            checked={form.is_remote}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, is_remote: e.target.checked }))
                            }
                        />
                    </div>
                    <Field label="حداقل حقوق (تومان)" error={err("salary_min")}>
                        <Input
                            name="salary_min"
                            type="number"
                            value={form.salary_min}
                            onChange={field}
                        />
                    </Field>
                    <Field label="حداکثر حقوق (تومان)" error={err("salary_max")}>
                        <Input
                            name="salary_max"
                            type="number"
                            value={form.salary_max}
                            onChange={field}
                        />
                    </Field>
                </div>

                <Field label="شرح موقعیت" error={err("description")}>
                    <Textarea name="description" value={form.description} onChange={field} />
                </Field>
                <Field label="الزامات" error={err("requirements")}>
                    <Textarea
                        name="requirements"
                        value={form.requirements}
                        onChange={field}
                    />
                </Field>
            </form>
        </Modal>
    );
}
