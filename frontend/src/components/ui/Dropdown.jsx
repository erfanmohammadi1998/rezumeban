import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Dropdown({ trigger, children, align = "end" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        onClick={() => setOpen(false)}
                        className={`absolute z-40 mt-2 min-w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 ${
                            align === "end" ? "left-0" : "right-0"
                        }`}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DropdownItem({ icon: Icon, danger, children, ...props }) {
    return (
        <button
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-right transition hover:bg-slate-700/60 ${
                danger ? "text-red-400" : "text-slate-200"
            }`}
            {...props}
        >
            {Icon && <Icon size={15} />}
            {children}
        </button>
    );
}
