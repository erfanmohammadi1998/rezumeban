import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import { Field, Input } from "../../components/ui/form";
import AuthLayout from "./AuthLayout";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            navigate("/", { replace: true });
        } catch (err) {
            const data = err.response?.data;
            const first =
                data && typeof data === "object" && Object.values(data)[0];
            setError(
                (Array.isArray(first) ? first[0] : first) || "ثبت‌نام ناموفق بود"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="ساخت حساب کاربری" subtitle="در چند ثانیه شروع کنید">
            <form onSubmit={submit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Field label="نام">
                        <Input name="first_name" value={form.first_name} onChange={change} />
                    </Field>
                    <Field label="نام خانوادگی">
                        <Input name="last_name" value={form.last_name} onChange={change} />
                    </Field>
                </div>

                <Field label="نام کاربری" required>
                    <Input name="username" value={form.username} onChange={change} required />
                </Field>

                <Field label="ایمیل">
                    <Input name="email" type="email" value={form.email} onChange={change} />
                </Field>

                <Field label="رمز عبور" required hint="حداقل ۸ کاراکتر">
                    <Input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={change}
                        required
                    />
                </Field>

                <Button type="submit" loading={loading} className="w-full" size="lg">
                    ثبت‌نام
                </Button>
            </form>

            <p className="text-sm text-slate-400 mt-6 text-center">
                قبلاً ثبت‌نام کرده‌اید؟{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">
                    وارد شوید
                </Link>
            </p>
        </AuthLayout>
    );
}
