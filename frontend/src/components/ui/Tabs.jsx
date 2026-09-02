import { motion } from "framer-motion";

export default function Tabs({ tabs, active, onChange }) {
    return (
        <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto">
            {tabs.map((tab) => {
                const key = tab.key ?? tab;
                const label = tab.label ?? tab;
                const isActive = key === active;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                            isActive
                                ? "text-white"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            {label}
                            {tab.count != null && (
                                <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </span>
                        {isActive && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500"
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
