import { motion } from "framer-motion";
import { Loader2, AlertTriangle, RotateCw } from "lucide-react";

// --------------------------------------------------------------------------- //
const VARIANTS = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    ghost: "hover:bg-slate-800 text-slate-300",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    outline: "border border-slate-700 hover:border-slate-500 text-slate-200",
};

const SIZES = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 rounded-xl",
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon: Icon,
    className = "",
    children,
    ...props
}) {
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                Icon && <Icon size={16} />
            )}
            {children}
        </button>
    );
}

export function IconButton({ icon: Icon, className = "", ...props }) {
    return (
        <button
            className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${className}`}
            {...props}
        >
            <Icon size={18} />
        </button>
    );
}

// --------------------------------------------------------------------------- //
const BADGE_COLORS = {
    slate: "bg-slate-700/60 text-slate-300",
    blue: "bg-blue-500/15 text-blue-300",
    green: "bg-green-500/15 text-green-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
    purple: "bg-purple-500/15 text-purple-300",
    pink: "bg-pink-500/15 text-pink-300",
};

export function Badge({ color = "slate", children, className = "" }) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${BADGE_COLORS[color] || BADGE_COLORS.slate} ${className}`}
        >
            {children}
        </span>
    );
}

// --------------------------------------------------------------------------- //
export function Card({ className = "", children, ...props }) {
    return (
        <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function Spinner({ className = "" }) {
    return <Loader2 className={`animate-spin text-blue-500 ${className}`} />;
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center py-24">
            <Spinner className="w-8 h-8" />
        </div>
    );
}

export function Skeleton({ className = "" }) {
    return (
        <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-16 px-6"
        >
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                    <Icon size={28} className="text-slate-500" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
            {description && (
                <p className="text-slate-500 mt-1 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </motion.div>
    );
}

export function ErrorState({ error, onRetry, title = "بارگذاری ناموفق بود" }) {
    const status = error?.response?.status;
    const msg =
        status === 404
            ? "این مورد یافت نشد یا حذف شده است."
            : status === 403
            ? "دسترسی لازم را ندارید."
            : error?.response?.data?.detail ||
              "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
            <p className="text-slate-500 mt-1 max-w-sm">{msg}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-sm text-slate-200"
                >
                    <RotateCw size={15} />
                    تلاش دوباره
                </button>
            )}
        </div>
    );
}

export function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-200">{children}</h2>
            {action}
        </div>
    );
}
