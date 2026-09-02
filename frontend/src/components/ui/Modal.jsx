import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const SIZES = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export default function Modal({
    open,
    onClose,
    title,
    size = "md",
    children,
    footer,
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ type: "spring", damping: 24, stiffness: 280 }}
                        className={`relative w-full ${SIZES[size]} bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-auto`}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h3 className="font-semibold text-slate-100">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-5">{children}</div>
                        {footer && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
