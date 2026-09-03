import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import { Field, Input } from "../../components/ui/form";
import AuthLayout from "./AuthLayout";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const demo = import.meta.env.DEV;
    const [form, setForm] = useState(
        demo
            ? { username: "recruiter", password: "demo12345" }
            : { username: "", password: "" }
    );
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.username, form.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || "نام کاربری یا رمز عبور اشتباه است");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="ورود به حساب" subtitle="برای ادامه وارد شوید">
            <form onSubmit={submit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                        {error}
                    </div>
                )}

                <Field label="نام کاربری" required>
                    <Input name="username" value={form.username} onChange={change} required autoFocus />
                </Field>

                <Field label="رمز عبور" required>
                    <Input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={change}
                        required
                    />
                </Field>

                <Button type="submit" loading={loading} className="w-full" size="lg">
                    ورود
                </Button>
            </form>

            <p className="text-sm text-slate-400 mt-6 text-center">
                حساب ندارید؟{" "}
                <Link to="/register" className="text-blue-400 hover:text-blue-300">
                    ثبت‌نام کنید
                </Link>
            </p>

            {demo && (
                <p className="text-xs text-slate-600 mt-4 text-center">
                    حساب دمو: <span className="text-slate-400">recruiter / demo12345</span>
                </p>
            )}
        </AuthLayout>
    );
}
