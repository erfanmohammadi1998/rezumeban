import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckSquare, Square, Trash2, Calendar } from "lucide-react";

import { tasksApi, authApi } from "../../api/client";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import {
    Button,
    Card,
    Skeleton,
    EmptyState,
    ErrorState,
} from "../../components/ui";
import { Field, Input, Textarea, Select } from "../../components/ui/form";
import Modal from "../../components/ui/Modal";
import FilterBar from "../../components/FilterBar";
import { fmtDate } from "../../lib/format";

function overdue(t) {
    return !t.done && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());
}

export function TaskRow({ task, onToggle, onDelete }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <button
                onClick={() => onToggle(task)}
                className={task.done ? "text-green-400" : "text-slate-500 hover:text-slate-300"}
            >
                {task.done ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <div className="flex-1 min-w-0">
                <div
                    className={`text-sm ${
                        task.done ? "text-slate-500 line-through" : "text-slate-200"
                    }`}
                >
                    {task.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                    {task.assignee && <span>{task.assignee.full_name}</span>}
                    {task.due_date && (
                        <span
                            className={`flex items-center gap-1 ${
                                overdue(task) ? "text-red-400" : ""
                            }`}
                        >
                            <Calendar size={11} />
                            {fmtDate(task.due_date)}
                        </span>
                    )}
                    {task.candidate_name && (
                        <Link
                            to={`/candidates/${task.candidate}`}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            {task.candidate_name}
                        </Link>
                    )}
                    {task.job_slug && (
                        <Link
                            to={`/jobs/${task.job_slug}`}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            {task.job_title}
                        </Link>
                    )}
                </div>
            </div>
            {onDelete && (
                <button
                    onClick={() => onDelete(task)}
                    className="text-slate-600 hover:text-red-400"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

function TaskModal({ open, onClose, onDone }) {
    const toast = useToast();
    const { data: team } = useAsync(() => authApi.team(), []);
    const [form, setForm] = useState({
        title: "",
        description: "",
        due_date: "",
        assignee_id: "",
    });
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (!form.title.trim()) return;
        setBusy(true);
        try {
            await tasksApi.create({
                title: form.title,
                description: form.description,
                due_date: form.due_date || null,
                assignee_id: form.assignee_id || null,
            });
            toast.success("وظیفه اضافه شد");
            setForm({ title: "", description: "", due_date: "", assignee_id: "" });
            onDone();
            onClose();
        } catch {
            toast.error("افزودن ناموفق بود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="وظیفهٔ جدید"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        انصراف
                    </Button>
                    <Button loading={busy} onClick={submit}>
                        افزودن
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="عنوان" required>
                    <Input
                        autoFocus
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="مهلت">
                        <Input
                            type="date"
                            value={form.due_date}
                            onChange={(e) =>
                                setForm({ ...form, due_date: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="مسئول">
                        <Select
                            value={form.assignee_id}
                            onChange={(e) =>
                                setForm({ ...form, assignee_id: e.target.value })
                            }
                        >
                            <option value="">خودم</option>
                            {(team || []).map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || u.username}
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>
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

export default function TasksPage() {
    const toast = useToast();
    const [scope, setScope] = useState("mine");
    const [showDone, setShowDone] = useState(false);
    const [open, setOpen] = useState(false);

    const query = useMemo(
        () => ({
            mine: scope === "mine" ? "true" : undefined,
            done: showDone ? undefined : "false",
        }),
        [scope, showDone]
    );
    const { data, loading, error, reload } = useAsync(
        () => tasksApi.list(query),
        [JSON.stringify(query)]
    );
    const tasks = data?.results || data || [];

    const toggle = async (t) => {
        await tasksApi.toggle(t.id);
        reload();
    };
    const del = async (t) => {
        if (!confirm(`«${t.title}» حذف شود؟`)) return;
        try {
            await tasksApi.remove(t.id);
            reload();
        } catch {
            toast.error("حذف ناموفق بود");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">وظایف</h1>
                    <p className="text-slate-500 mt-1">
                        {(data?.count ?? tasks.length).toLocaleString("fa-IR")} وظیفه
                    </p>
                </div>
                <Button icon={Plus} onClick={() => setOpen(true)}>
                    وظیفهٔ جدید
                </Button>
            </div>

            <FilterBar
                toggles={[
                    {
                        key: "mine",
                        label: scope === "mine" ? "فقط کارهای من" : "همهٔ تیم",
                        active: scope === "mine",
                        onClick: () => setScope((s) => (s === "mine" ? "all" : "mine")),
                    },
                    {
                        key: "done",
                        label: "نمایش انجام‌شده‌ها",
                        active: showDone,
                        onClick: () => setShowDone((s) => !s),
                    },
                ]}
            />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
                <Skeleton className="h-40" />
            ) : tasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="وظیفه‌ای نیست" />
            ) : (
                <Card className="p-2">
                    <div className="divide-y divide-slate-800 px-2">
                        {tasks.map((t) => (
                            <TaskRow
                                key={t.id}
                                task={t}
                                onToggle={toggle}
                                onDelete={del}
                            />
                        ))}
                    </div>
                </Card>
            )}

            <TaskModal open={open} onClose={() => setOpen(false)} onDone={reload} />
        </div>
    );
}
