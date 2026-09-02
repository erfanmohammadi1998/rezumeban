import { Link } from "react-router-dom";
import {
    Users,
    Briefcase,
    KanbanSquare,
    CalendarClock,
    Radar,
    BarChart3,
    Command,
    Upload,
    FileSignature,
    FolderOpen,
    ClipboardCheck,
    Copy,
    GitCompare,
    Globe,
    FileText,
    Mail,
} from "lucide-react";

import { APP_NAME } from "../../config/modules";
import { Card, Badge } from "../../components/ui";

function Step({ n, title, children }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                {n}
            </div>
            <div className="pb-6 border-r-2 border-slate-800 pr-4 -mr-4 last:border-transparent">
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <div className="text-sm text-slate-400 mt-1 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Feature({ icon: Icon, title, to, children }) {
    const body = (
        <Card className="p-5 h-full hover:border-slate-700 transition">
            <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Icon size={17} className="text-blue-400" />
                </span>
                <h3 className="font-semibold text-slate-100">{title}</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{children}</p>
        </Card>
    );
    return to ? <Link to={to}>{body}</Link> : body;
}

const FLOW = [
    "آگهی شغلی",
    "دریافت / افزودن کاندیدا",
    "اتصال به آگهی (درخواست)",
    "پایپ‌لاین",
    "مصاحبه + کارت امتیاز",
    "پیشنهاد همکاری",
    "استخدام",
];

export default function GuidePage() {
    return (
        <div className="space-y-10 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">راهنمای {APP_NAME}</h1>
                <p className="text-slate-500 mt-2">
                    {APP_NAME} برای کارفرماست: دریافت، سازمان‌دهی و مدیریت رزومه تا استخدام
                    نهایی. اگر تازه‌واردید، همین ترتیب را دنبال کنید.
                </p>
            </div>

            {/* flow strip */}
            <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {FLOW.map((s, i) => (
                        <span key={s} className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-200">
                                {s}
                            </span>
                            {i < FLOW.length - 1 && (
                                <span className="text-slate-600">←</span>
                            )}
                        </span>
                    ))}
                </div>
            </Card>

            {/* workflow */}
            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-5">
                    گردش کار قدم‌به‌قدم
                </h2>
                <div className="space-y-0">
                    <Step n={1} title="ثبت آگهی شغلی">
                        در{" "}
                        <Link to="/jobs" className="text-blue-400">
                            آگهی‌های شغلی
                        </Link>{" "}
                        آگهی بسازید (عنوان، دپارتمان، نوع همکاری، حقوق، شرح، الزامات). برای
                        سرعت، از{" "}
                        <Link to="/settings" className="text-blue-400">
                            قالب آگهی
                        </Link>{" "}
                        استفاده کنید. وضعیت «باز» آگهی را در پورتال عمومی نمایان می‌کند.
                    </Step>
                    <Step n={2} title="ورود کاندیداها">
                        سه راه: <b>فرم عمومی</b> در{" "}
                        <Link to="/careers" className="text-blue-400">
                            پورتال مشاغل
                        </Link>{" "}
                        (بدون لاگین، با آپلود رزومه) · <b>افزودن دستی</b> یا{" "}
                        <b>ورود گروهی از CSV</b> در صفحهٔ کاندیداها · <b>منبع‌یابی</b> از{" "}
                        <Link to="/sourcing" className="text-blue-400">
                            GitHub / Stack Overflow / dev.to
                        </Link>
                        .
                    </Step>
                    <Step n={3} title="پاک‌سازی و سازمان‌دهی بانک رزومه">
                        بنر «کاندیدای تکراری» را بررسی و رکوردها را{" "}
                        <Link to="/candidates/duplicates" className="text-blue-400">
                            ادغام
                        </Link>{" "}
                        کنید. ستاره بزنید، برچسب و یادداشت تیمی اضافه کنید، و کاندیداهای
                        خوب را در{" "}
                        <Link to="/pools" className="text-blue-400">
                            استخر استعداد
                        </Link>{" "}
                        نگه دارید.
                    </Step>
                    <Step n={4} title="اتصال کاندیدا به آگهی">
                        در صفحهٔ کاندیدا یا با انتخاب گروهی در فهرست («افزودن به آگهی»)، هر
                        کاندیدا را به آگهی متصل کنید تا یک «درخواست» ساخته شود.
                    </Step>
                    <Step n={5} title="حرکت در پایپ‌لاین">
                        در{" "}
                        <Link to="/pipeline" className="text-blue-400">
                            پایپ‌لاین استخدام
                        </Link>{" "}
                        کارت هر کاندیدا را با کشیدن‌ورهاکردن بین مراحل جابه‌جا کنید. مراحل
                        را در تنظیمات می‌سازید. رد کردن با دلیل از روی کارت انجام می‌شود.
                    </Step>
                    <Step n={6} title="مصاحبه و ارزیابی">
                        از{" "}
                        <Link to="/interviews" className="text-blue-400">
                            مصاحبه‌ها
                        </Link>{" "}
                        جلسه تنظیم کنید. بعد از برگزاری، در مودال «بازخورد» یک{" "}
                        <b>کارت امتیازدهی</b> انتخاب کنید و هر معیار را ۱–۵ بدهید؛ امتیاز
                        کل وزنی خودکار محاسبه می‌شود.
                    </Step>
                    <Step n={7} title="پیشنهاد همکاری">
                        از کارت پایپ‌لاین (آیکن سبز) پیش‌نویس پیشنهاد بسازید، در صفحهٔ{" "}
                        <Link to="/offers" className="text-blue-400">
                            پیشنهادها
                        </Link>{" "}
                        ارسالش کنید (ایمیل به کاندیدا)، و پذیرش/رد را ثبت کنید. پذیرش، کاندیدا
                        را به مرحلهٔ «استخدام» می‌برد.
                    </Step>
                    <Step n={8} title="تحلیل">
                        <Link to="/reports" className="text-blue-400">
                            گزارش‌ها
                        </Link>{" "}
                        نرخ استخدام، میانگین زمان تا استخدام و توزیع کاندیداها را نشان
                        می‌دهد.
                    </Step>
                </div>
            </section>

            {/* features */}
            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-5">امکانات کلیدی</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Feature icon={Command} title="جستجوی سریع">
                        <Badge color="slate">Ctrl / ⌘ + K</Badge> — پرش به هر بخش یا پیدا
                        کردن فوری کاندیدا و آگهی.
                    </Feature>
                    <Feature icon={Users} title="فیلتر پیشرفته" to="/candidates">
                        منبع، امتیاز، برچسب، نشان‌شده و مرتب‌سازی — همه در نشانی صفحه ذخیره
                        و قابل اشتراک.
                    </Feature>
                    <Feature icon={Upload} title="ورود گروهی از CSV" to="/candidates">
                        فایل اکسل کاندیداها را مستقیم وارد بانک رزومه کنید (ستون فارسی یا
                        انگلیسی).
                    </Feature>
                    <Feature icon={Copy} title="تشخیص و ادغام تکراری" to="/candidates/duplicates">
                        کاندیداهای با ایمیل یا تلفن یکسان شناسایی و در یک رکورد ادغام
                        می‌شوند.
                    </Feature>
                    <Feature icon={GitCompare} title="مقایسهٔ کاندیدا">
                        ۲ تا ۴ کاندیدا را از نوار انتخاب گروهی کنار هم بگذارید.
                    </Feature>
                    <Feature icon={FileText} title="پیش‌نمایش رزومه">
                        فایل PDF رزومه داخل صفحهٔ کاندیدا نمایش داده می‌شود.
                    </Feature>
                    <Feature icon={FolderOpen} title="استخر استعداد" to="/pools">
                        کاندیداها را برای موقعیت‌های آینده دسته‌بندی کنید.
                    </Feature>
                    <Feature icon={Radar} title="منبع‌یابی کاندیدا" to="/sourcing">
                        متخصص از APIهای عمومی (GitHub، Stack Overflow، dev.to) با جستجوی
                        ذخیره‌شده.
                    </Feature>
                    <Feature icon={KanbanSquare} title="پایپ‌لاین کانبان" to="/pipeline">
                        برد کشیدنی برای هر آگهی؛ جابه‌جایی مرحله بلافاصله ثبت می‌شود.
                    </Feature>
                    <Feature icon={ClipboardCheck} title="کارت امتیاز مصاحبه" to="/settings">
                        قالب معیارهای وزن‌دار؛ در بازخورد مصاحبه امتیاز کل وزنی محاسبه
                        می‌شود.
                    </Feature>
                    <Feature icon={FileSignature} title="مدیریت پیشنهاد" to="/offers">
                        پیش‌نویس، ارسال، پذیرش/رد. پذیرش → کاندیدا استخدام‌شده.
                    </Feature>
                    <Feature icon={Briefcase} title="قالب آگهی" to="/settings">
                        آگهی‌های پرتکرار را یک‌بار بسازید و در فرم آگهی «شروع از قالب» را
                        بزنید.
                    </Feature>
                    <Feature icon={Globe} title="پورتال عمومی" to="/careers">
                        صفحهٔ فرصت‌های شغلی برای انتشار عمومی و دریافت درخواست آنلاین.
                    </Feature>
                    <Feature icon={CalendarClock} title="مصاحبه‌ها" to="/interviews">
                        نمای فهرست/روزشمار، فیلتر بر اساس آگهی/نوع/وضعیت.
                    </Feature>
                    <Feature icon={Mail} title="اعلان ایمیلی کاندیدا">
                        هنگام تغییر مرحله/رد (اختیاری) و ارسال پیشنهاد، به کاندیدا ایمیل
                        می‌رود.
                    </Feature>
                    <Feature icon={BarChart3} title="گزارش‌ها" to="/reports">
                        نرخ استخدام، میانگین زمان تا استخدام و نمودارهای تحلیلی.
                    </Feature>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-3">
                    میان‌برهای کیبورد
                </h2>
                <Card className="p-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">باز کردن جستجوی سریع</span>
                        <Badge color="slate">Ctrl / ⌘ + K</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">بستن پنجره‌ها</span>
                        <Badge color="slate">Esc</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">حرکت در نتایج جستجوی سریع</span>
                        <Badge color="slate">↑ / ↓ / Enter</Badge>
                    </div>
                </Card>
            </section>
        </div>
    );
}
