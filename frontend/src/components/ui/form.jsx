import { forwardRef } from "react";

const baseField =
    "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-500 placeholder:text-slate-500 disabled:opacity-50";

export function Field({ label, error, hint, required, children, className = "" }) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm text-slate-300 mb-1.5">
                    {label}
                    {required && <span className="text-red-400 mr-1">*</span>}
                </label>
            )}
            {children}
            {hint && !error && (
                <p className="text-xs text-slate-500 mt-1">{hint}</p>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}

export const Input = forwardRef(function Input(
    { className = "", ...props },
    ref
) {
    return <input ref={ref} className={`${baseField} ${className}`} {...props} />;
});

export const Textarea = forwardRef(function Textarea(
    { className = "", rows = 4, ...props },
    ref
) {
    return (
        <textarea
            ref={ref}
            rows={rows}
            className={`${baseField} resize-y ${className}`}
            {...props}
        />
    );
});

export const Select = forwardRef(function Select(
    { className = "", children, ...props },
    ref
) {
    return (
        <select ref={ref} className={`${baseField} ${className}`} {...props}>
            {children}
        </select>
    );
});

export function Checkbox({ label, className = "", ...props }) {
    return (
        <label
            className={`flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none ${className}`}
        >
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/40"
                {...props}
            />
            {label}
        </label>
    );
}
