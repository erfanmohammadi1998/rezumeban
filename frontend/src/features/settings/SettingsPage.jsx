import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { authApi, metaApi } from "../../api/client";
import { MODULES } from "../../config/modules";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useAsync from "../../hooks/useAsync";
import { Button, Card, Badge, SectionTitle, Skeleton } from "../../components/ui";
import { Field, Input, Select } from "../../components/ui/form";
import Avatar from "../../components/ui/Avatar";
import Tabs from "../../components/ui/Tabs";

const TAG_COLORS = ["slate", "blue", "green", "amber", "red", "purple", "pink"];

/* ------------------------------------------------------------------ profile */
function ProfileSection() {
    const { user, setUser } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
    });
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await authApi.updateProfile(form);
            setUser((u) => ({ ...u, ...updated }));
            toast.success("پروفایل به‌روزرسانی شد");
        } catch {
            toast.error("به‌روزرسانی ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>اطلاعات پروفایل</SectionTitle>
            <form onSubmit={save} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="نام">
                        <Input
                            value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        />
                    </Field>
                    <Field label="نام خانوادگی">
                        <Input
                            value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        />
                    </Field>
                </div>
                <Field label="ایمیل">
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </Field>
                <Field label="نام کاربری">
                    <Input value={user?.username || ""} disabled />
                </Field>
                <Button type="submit" loading={saving}>
                    ذخیره
                </Button>
            </form>
        </Card>
    );
}

/* ----------------------------------------------------------------- security */
function SecuritySection() {
    const toast = useToast();
    const [pwd, setPwd] = useState({ old_password: "", new_password: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await authApi.changePassword(pwd);
            setPwd({ old_password: "", new_password: "" });
            toast.success("رمز عبور تغییر کرد");
        } catch (err) {
            const data = err.response?.data;
            const first = data && typeof data === "object" && Object.values(data)[0];
            setError((Array.isArray(first) ? first[0] : first) || "تغییر رمز ناموفق بود");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>تغییر رمز عبور</SectionTitle>
            <form onSubmit={save} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                        {error}
                    </div>
                )}
                <Field label="رمز عبور فعلی" required>
                    <Input
                        type="password"
                        value={pwd.old_password}
                        onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })}
                        required
                    />
                </Field>
                <Field label="رمز عبور جدید" required hint="حداقل ۸ کاراکتر">
                    <Input
                        type="password"
                        value={pwd.new_password}
                        onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                        required
                    />
                </Field>
                <Button type="submit" loading={saving}>
                    تغییر رمز
                </Button>
            </form>
        </Card>
    );
}

/* --------------------------------------------------------------------- tags */
function TagsSection() {
    const toast = useToast();
    const { data, loading, reload } = useAsync(() => metaApi.tags(), []);
    const [name, setName] = useState("");
    const [color, setColor] = useState("blue");

    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await metaApi.createTag({ name: name.trim(), color });
            setName("");
            reload();
        } catch {
            toast.error("افزودن برچسب ناموفق بود");
        }
    };

    const del = async (id) => {
        try {
            await metaApi.removeTag(id);
            reload();
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>برچسب‌ها</SectionTitle>
            <form onSubmit={add} className="flex gap-2 mb-4">
                <Input
                    placeholder="نام برچسب"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Select className="w-32" value={color} onChange={(e) => setColor(e.target.value)}>
                    {TAG_COLORS.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </Select>
                <Button type="submit" icon={Plus} />
            </form>
            {loading ? (
                <Skeleton className="h-20" />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {(data || []).map((t) => (
                        <span
                            key={t.id}
                            className="flex items-center gap-1.5 rounded-full bg-slate-800 pr-3 pl-1.5 py-1"
                        >
                            <Badge color={t.color}>{t.name}</Badge>
                            <button
                                onClick={() => del(t.id)}
                                className="text-slate-500 hover:text-red-400"
                            >
                                <Trash2 size={13} />
                            </button>
                        </span>
                    ))}
                    {!data?.length && (
                        <p className="text-sm text-slate-500">برچسبی ثبت نشده.</p>
                    )}
                </div>
            )}
        </Card>
    );
}

/* -------------------------------------------------------------- departments */
function DepartmentsSection() {
    const toast = useToast();
    const { data, loading, reload } = useAsync(() => metaApi.departments(), []);
    const [name, setName] = useState("");

    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await metaApi.createDepartment({ name: name.trim() });
            setName("");
            reload();
        } catch {
            toast.error("افزودن دپارتمان ناموفق بود");
        }
    };

    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>دپارتمان‌ها</SectionTitle>
            <form onSubmit={add} className="flex gap-2 mb-4">
                <Input
                    placeholder="نام دپارتمان"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Button type="submit" icon={Plus} />
            </form>
            {loading ? (
                <Skeleton className="h-20" />
            ) : (
                <div className="divide-y divide-slate-800">
                    {(data || []).map((d) => (
                        <div key={d.id} className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-slate-200">{d.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-600">
                                    {d.job_count?.toLocaleString("fa-IR") || "۰"} آگهی
                                </span>
                                <button
                                    onClick={() =>
                                        metaApi.removeDepartment(d.id).then(reload).catch(() =>
                                            toast.error("حذف ناموفق بود")
                                        )
                                    }
                                    className="text-slate-500 hover:text-red-400"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!data?.length && (
                        <p className="text-sm text-slate-500 py-2">دپارتمانی ثبت نشده.</p>
                    )}
                </div>
            )}
        </Card>
    );
}

/* ------------------------------------------------------------------- stages */
const STAGE_KINDS = { active: "میانی", won: "استخدام", lost: "رد" };

function StagesSection() {
    const toast = useToast();
    const { data, loading, reload } = useAsync(() => metaApi.stages(), []);
    const [name, setName] = useState("");
    const [kind, setKind] = useState("active");

    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const order = (data || []).length
            ? Math.max(...data.map((s) => s.order)) + 1
            : 0;
        try {
            await metaApi.createStage({ name: name.trim(), kind, order });
            setName("");
            reload();
        } catch {
            toast.error("افزودن مرحله ناموفق بود");
        }
    };

    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>مراحل پایپ‌لاین استخدام</SectionTitle>
            <form onSubmit={add} className="flex gap-2 mb-4">
                <Input
                    placeholder="نام مرحله"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Select className="w-28" value={kind} onChange={(e) => setKind(e.target.value)}>
                    {Object.entries(STAGE_KINDS).map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </Select>
                <Button type="submit" icon={Plus} />
            </form>
            {loading ? (
                <Skeleton className="h-24" />
            ) : (
                <div className="divide-y divide-slate-800">
                    {(data || []).map((s) => (
                        <div key={s.id} className="flex items-center gap-2 py-2.5">
                            <GripVertical size={14} className="text-slate-700" />
                            <span className="text-sm text-slate-200 flex-1">{s.name}</span>
                            <Badge
                                color={
                                    s.kind === "won"
                                        ? "green"
                                        : s.kind === "lost"
                                        ? "red"
                                        : "slate"
                                }
                            >
                                {STAGE_KINDS[s.kind]}
                            </Badge>
                            <button
                                onClick={() =>
                                    metaApi.removeStage(s.id).then(reload).catch(() =>
                                        toast.error("حذف ناموفق بود")
                                    )
                                }
                                className="text-slate-500 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

/* --------------------------------------------------------------------- team */
function TeamSection() {
    const { data, loading } = useAsync(() => authApi.team(), []);
    return (
        <Card className="p-6 max-w-xl">
            <SectionTitle>اعضای تیم</SectionTitle>
            {loading ? (
                <Skeleton className="h-24" />
            ) : (
                <div className="divide-y divide-slate-800">
                    {(data || []).map((u) => (
                        <div key={u.id} className="flex items-center gap-3 py-2.5">
                            <Avatar name={u.full_name || u.username} size="sm" />
                            <div>
                                <div className="text-sm text-slate-200">
                                    {u.full_name || u.username}
                                </div>
                                <div className="text-xs text-slate-600">{u.email || "—"}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

/* --------------------------------------------------------------------- page */
export default function SettingsPage() {
    const tabs = [
        { key: "profile", label: "پروفایل" },
        { key: "security", label: "امنیت" },
        { key: "tags", label: "برچسب‌ها" },
        ...(MODULES.jobs ? [{ key: "departments", label: "دپارتمان‌ها" }] : []),
        ...(MODULES.pipeline ? [{ key: "stages", label: "مراحل استخدام" }] : []),
        { key: "team", label: "تیم" },
    ];
    const [tab, setTab] = useState("profile");

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100">تنظیمات</h1>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "profile" && <ProfileSection />}
            {tab === "security" && <SecuritySection />}
            {tab === "tags" && <TagsSection />}
            {tab === "departments" && <DepartmentsSection />}
            {tab === "stages" && <StagesSection />}
            {tab === "team" && <TeamSection />}
        </div>
    );
}
