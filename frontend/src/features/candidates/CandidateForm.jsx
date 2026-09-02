import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { candidatesApi, metaApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import { Button, IconButton, SectionTitle } from "../../components/ui";
import { Field, Input, Textarea, Select, Checkbox } from "../../components/ui/form";
import StarRating from "../../components/ui/StarRating";
import { SOURCE_LABELS, SKILL_LEVEL_LABELS } from "../../lib/format";

const EMPTY = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    headline: "",
    location: "",
    summary: "",
    source: "website",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    expected_salary: "",
    rating: 0,
    is_favorite: false,
    tag_ids: [],
    work_experiences: [],
    educations: [],
    skills: [],
};

const blankExp = () => ({
    company_name: "",
    position: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
});
const blankEdu = () => ({
    degree: "",
    field_of_study: "",
    university: "",
    start_year: "",
    graduation_year: "",
    description: "",
});
const blankSkill = () => ({ name: "", level: "Intermediate" });

function fromCandidate(c) {
    return {
        ...EMPTY,
        ...c,
        expected_salary: c.expected_salary ?? "",
        tag_ids: (c.tags || []).map((t) => t.id),
        work_experiences: (c.work_experiences || []).map((e) => ({
            ...blankExp(),
            ...e,
            end_date: e.end_date || "",
        })),
        educations: (c.educations || []).map((e) => ({
            ...blankEdu(),
            ...e,
            start_year: e.start_year ?? "",
            graduation_year: e.graduation_year ?? "",
        })),
        skills: (c.skills || []).map((s) => ({ ...blankSkill(), ...s })),
    };
}

function toPayload(form) {
    const clean = (v) => (v === "" ? null : v);
    return {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        headline: form.headline,
        location: form.location,
        summary: form.summary,
        source: form.source,
        linkedin_url: form.linkedin_url,
        github_url: form.github_url,
        portfolio_url: form.portfolio_url,
        expected_salary: clean(form.expected_salary),
        rating: form.rating,
        is_favorite: form.is_favorite,
        tag_ids: form.tag_ids,
        work_experiences: form.work_experiences.map((e) => ({
            company_name: e.company_name,
            position: e.position,
            start_date: e.start_date,
            end_date: e.is_current ? null : clean(e.end_date),
            is_current: e.is_current,
            description: e.description,
        })),
        educations: form.educations.map((e) => ({
            degree: e.degree,
            field_of_study: e.field_of_study,
            university: e.university,
            start_year: clean(e.start_year),
            graduation_year: clean(e.graduation_year),
            description: e.description,
        })),
        skills: form.skills
            .filter((s) => s.name.trim())
            .map((s) => ({ name: s.name, level: s.level })),
    };
}

export default function CandidateForm({ open, onClose, candidate, onSaved }) {
    const toast = useToast();
    const editing = Boolean(candidate);
    const [form, setForm] = useState(EMPTY);
    const [tags, setTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [files, setFiles] = useState({ photo: null, resume: null });

    // re-seed the form each time the modal opens (or the target candidate changes)
    const seedKey = open ? candidate?.id ?? "new" : null;
    const [seededFor, setSeededFor] = useState(null);
    if (seededFor !== seedKey) {
        setSeededFor(seedKey);
        if (open) {
            setForm(candidate ? fromCandidate(candidate) : EMPTY);
            setErrors({});
            setFiles({ photo: null, resume: null });
        }
    }

    useEffect(() => {
        if (!open) return;
        metaApi.tags().then(setTags).catch(() => setTags([]));
    }, [open]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const field = (e) => set(e.target.name, e.target.value);

    const setRow = (list, i, patch) =>
        set(
            list,
            form[list].map((row, idx) => (idx === i ? { ...row, ...patch } : row))
        );
    const addRow = (list, blank) => set(list, [...form[list], blank()]);
    const removeRow = (list, i) =>
        set(list, form[list].filter((_, idx) => idx !== i));

    const toggleTag = (id) =>
        set(
            "tag_ids",
            form.tag_ids.includes(id)
                ? form.tag_ids.filter((t) => t !== id)
                : [...form.tag_ids, id]
        );

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = toPayload(form);
            let saved = editing
                ? await candidatesApi.update(candidate.id, payload)
                : await candidatesApi.create(payload);

            if (files.photo || files.resume) {
                const fd = new FormData();
                if (files.photo) fd.append("photo", files.photo);
                if (files.resume) fd.append("resume", files.resume);
                saved = await candidatesApi.uploadFiles(saved.id, fd);
            }

            toast.success(editing ? "کاندیدا به‌روزرسانی شد" : "کاندیدا اضافه شد");
            onSaved?.(saved);
            onClose();
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            toast.error("ذخیره ناموفق بود — ورودی‌ها را بررسی کنید");
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
            size="xl"
            title={editing ? "ویرایش کاندیدا" : "افزودن کاندیدا"}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} type="button">
                        انصراف
                    </Button>
                    <Button onClick={submit} loading={saving} type="button">
                        {editing ? "ذخیره تغییرات" : "افزودن"}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="نام" required error={err("first_name")}>
                        <Input name="first_name" value={form.first_name} onChange={field} required />
                    </Field>
                    <Field label="نام خانوادگی" required error={err("last_name")}>
                        <Input name="last_name" value={form.last_name} onChange={field} required />
                    </Field>
                    <Field label="ایمیل" required error={err("email")}>
                        <Input name="email" type="email" value={form.email} onChange={field} required />
                    </Field>
                    <Field label="تلفن" error={err("phone")}>
                        <Input name="phone" value={form.phone} onChange={field} />
                    </Field>
                    <Field label="عنوان شغلی" error={err("headline")}>
                        <Input name="headline" value={form.headline} onChange={field} />
                    </Field>
                    <Field label="موقعیت مکانی" error={err("location")}>
                        <Input name="location" value={form.location} onChange={field} />
                    </Field>
                    <Field label="منبع جذب">
                        <Select name="source" value={form.source} onChange={field}>
                            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="حقوق درخواستی (تومان)" error={err("expected_salary")}>
                        <Input
                            name="expected_salary"
                            type="number"
                            value={form.expected_salary}
                            onChange={field}
                        />
                    </Field>
                    <Field label="لینکدین" error={err("linkedin_url")}>
                        <Input name="linkedin_url" value={form.linkedin_url} onChange={field} />
                    </Field>
                    <Field label="گیت‌هاب" error={err("github_url")}>
                        <Input name="github_url" value={form.github_url} onChange={field} />
                    </Field>
                    <Field label="نمونه‌کار" error={err("portfolio_url")}>
                        <Input name="portfolio_url" value={form.portfolio_url} onChange={field} />
                    </Field>
                    <Field label="امتیاز">
                        <div className="pt-1.5">
                            <StarRating
                                value={form.rating}
                                onChange={(v) => set("rating", v)}
                            />
                        </div>
                    </Field>
                </div>

                <Field label="خلاصه" error={err("summary")}>
                    <Textarea name="summary" value={form.summary} onChange={field} />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                        label="عکس پروفایل"
                        hint={
                            editing && candidate?.photo && !files.photo
                                ? "عکس فعلی حفظ می‌شود مگر جدید انتخاب کنید"
                                : undefined
                        }
                        error={err("photo")}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setFiles((f) => ({ ...f, photo: e.target.files[0] || null }))
                            }
                            className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-slate-200 hover:file:bg-slate-700"
                        />
                    </Field>
                    <Field label="فایل رزومه" error={err("resume")}>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                                setFiles((f) => ({ ...f, resume: e.target.files[0] || null }))
                            }
                            className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-slate-200 hover:file:bg-slate-700"
                        />
                    </Field>
                </div>

                <Checkbox
                    label="افزودن به نشان‌شده‌ها"
                    checked={form.is_favorite}
                    onChange={(e) => set("is_favorite", e.target.checked)}
                />

                {tags.length > 0 && (
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">برچسب‌ها</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleTag(t.id)}
                                    className={`px-3 py-1 rounded-full text-xs border transition ${
                                        form.tag_ids.includes(t.id)
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                                    }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Work experience */}
                <div>
                    <SectionTitle
                        action={
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                icon={Plus}
                                onClick={() => addRow("work_experiences", blankExp)}
                            >
                                سابقه کاری
                            </Button>
                        }
                    >
                        سوابق کاری
                    </SectionTitle>
                    <div className="space-y-4">
                        {form.work_experiences.map((exp, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-slate-800 p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                                        <Input
                                            placeholder="شرکت"
                                            value={exp.company_name}
                                            onChange={(e) =>
                                                setRow("work_experiences", i, {
                                                    company_name: e.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="سمت"
                                            value={exp.position}
                                            onChange={(e) =>
                                                setRow("work_experiences", i, {
                                                    position: e.target.value,
                                                })
                                            }
                                        />
                                        <label className="text-xs text-slate-500">
                                            شروع
                                            <Input
                                                type="date"
                                                value={exp.start_date}
                                                onChange={(e) =>
                                                    setRow("work_experiences", i, {
                                                        start_date: e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                        <label className="text-xs text-slate-500">
                                            پایان
                                            <Input
                                                type="date"
                                                value={exp.end_date}
                                                disabled={exp.is_current}
                                                onChange={(e) =>
                                                    setRow("work_experiences", i, {
                                                        end_date: e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>
                                    <IconButton
                                        icon={Trash2}
                                        type="button"
                                        onClick={() => removeRow("work_experiences", i)}
                                    />
                                </div>
                                <Checkbox
                                    label="هنوز شاغل هستم"
                                    checked={exp.is_current}
                                    onChange={(e) =>
                                        setRow("work_experiences", i, {
                                            is_current: e.target.checked,
                                        })
                                    }
                                />
                                <Textarea
                                    rows={2}
                                    placeholder="شرح وظایف"
                                    value={exp.description}
                                    onChange={(e) =>
                                        setRow("work_experiences", i, {
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div>
                    <SectionTitle
                        action={
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                icon={Plus}
                                onClick={() => addRow("educations", blankEdu)}
                            >
                                تحصیلات
                            </Button>
                        }
                    >
                        تحصیلات
                    </SectionTitle>
                    <div className="space-y-4">
                        {form.educations.map((edu, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-slate-800 p-4"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                                        <Input
                                            placeholder="مقطع"
                                            value={edu.degree}
                                            onChange={(e) =>
                                                setRow("educations", i, {
                                                    degree: e.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="رشته"
                                            value={edu.field_of_study}
                                            onChange={(e) =>
                                                setRow("educations", i, {
                                                    field_of_study: e.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="دانشگاه"
                                            value={edu.university}
                                            onChange={(e) =>
                                                setRow("educations", i, {
                                                    university: e.target.value,
                                                })
                                            }
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number"
                                                placeholder="سال شروع"
                                                value={edu.start_year}
                                                onChange={(e) =>
                                                    setRow("educations", i, {
                                                        start_year: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                type="number"
                                                placeholder="سال فراغت"
                                                value={edu.graduation_year}
                                                onChange={(e) =>
                                                    setRow("educations", i, {
                                                        graduation_year: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <IconButton
                                        icon={Trash2}
                                        type="button"
                                        onClick={() => removeRow("educations", i)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <SectionTitle
                        action={
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                icon={Plus}
                                onClick={() => addRow("skills", blankSkill)}
                            >
                                مهارت
                            </Button>
                        }
                    >
                        مهارت‌ها
                    </SectionTitle>
                    <div className="space-y-2">
                        {form.skills.map((skill, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    placeholder="نام مهارت"
                                    value={skill.name}
                                    onChange={(e) =>
                                        setRow("skills", i, { name: e.target.value })
                                    }
                                />
                                <Select
                                    className="w-40"
                                    value={skill.level}
                                    onChange={(e) =>
                                        setRow("skills", i, { level: e.target.value })
                                    }
                                >
                                    {Object.entries(SKILL_LEVEL_LABELS).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                                <IconButton
                                    icon={Trash2}
                                    type="button"
                                    onClick={() => removeRow("skills", i)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
