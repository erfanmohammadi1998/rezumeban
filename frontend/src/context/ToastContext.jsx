/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";


const ToastContext = createContext(null);

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

const STYLES = {
    success: "border-green-500/40 bg-green-500/10 text-green-300",
    error: "border-red-500/40 bg-red-500/10 text-red-300",
    info: "border-blue-500/40 bg-blue-500/10 text-blue-300",
};


export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);

    const push = useCallback(
        (message, type = "info", timeout = 3500) => {
            const id = ++idRef.current;
            setToasts((t) => [...t, { id, message, type }]);
            if (timeout) setTimeout(() => dismiss(id), timeout);
        },
        [dismiss]
    );

    const toast = {
        success: (m) => push(m, "success"),
        error: (m) => push(m, "error"),
        info: (m) => push(m, "info"),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 w-80">
                <AnimatePresence>
                    {toasts.map((t) => {
                        const Icon = ICONS[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, x: -40, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -40, scale: 0.9 }}
                                className={`flex items-start gap-3 rounded-xl border p-4 backdrop-blur-md shadow-lg ${STYLES[t.type]}`}
                            >
                                <Icon size={20} className="mt-0.5 shrink-0" />
                                <p className="text-sm flex-1 leading-relaxed">
                                    {t.message}
                                </p>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}


export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}
