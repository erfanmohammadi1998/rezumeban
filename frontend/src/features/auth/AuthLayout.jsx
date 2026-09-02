import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { APP_NAME, APP_TAGLINE, APP_MODE } from "../../config/modules";

const HIGHLIGHTS =
    APP_MODE === "cv"
        ? [
              "بانک متمرکز رزومه‌ها با جستجوی پیشرفته",
              "منبع‌یابی خودکار کاندیدا از GitHub و منابع دیگر",
              "امتیازدهی، برچسب‌گذاری و یادداشت تیمی",
          ]
        : [
              "پایپ‌لاین استخدام کانبان با کشیدن‌ورهاکردن",
              "منبع‌یابی کاندیدا و آگهی از منابع واقعی",
              "داشبورد و گزارش‌های تحلیلی زنده",
              "پورتال عمومی دریافت درخواست شغلی",
          ];

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex">
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-12">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-xl font-bold">
                        {APP_NAME[0]}
                    </div>
                    <div>
                        <div className="font-bold text-lg">{APP_NAME}</div>
                        <div className="text-sm text-white/70">{APP_TAGLINE}</div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2 className="text-3xl font-bold leading-snug mb-8">
                        استخدام سریع‌تر، تصمیم‌گیری هوشمندتر
                    </h2>
                    <ul className="space-y-4">
                        {HIGHLIGHTS.map((h) => (
                            <li key={h} className="flex items-center gap-3 text-white/90">
                                <CheckCircle2 size={20} className="text-blue-200 shrink-0" />
                                {h}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <p className="text-sm text-white/50">
                    © {new Date().getFullYear()} {APP_NAME}
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                >
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                            {APP_NAME[0]}
                        </div>
                        <span className="font-bold">{APP_NAME}</span>
                    </div>

                    <h1 className="text-2xl font-bold mb-1">{title}</h1>
                    <p className="text-slate-400 mb-8">{subtitle}</p>

                    {children}
                </motion.div>
            </div>
        </div>
    );
}
