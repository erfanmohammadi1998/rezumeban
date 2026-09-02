import { Link } from "react-router-dom";
import {
    Users,
    KanbanSquare,
    CalendarClock,
    Radar,
    BarChart3,
    Command,
    Upload,
    Tag,
    GitCompare,
    Globe,
} from "lucide-react";

import { MODULES, APP_NAME } from "../../config/modules";
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

function Feature({ icon: Icon, title, children, to }) {
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

export default function GuidePage() {
    const full = MODULES.jobs;

    return (
        <div className="space-y-10 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">راهنمای {APP_NAME}</h1>
                <p className="text-slate-500 mt-2">
                    {full
                        ? "گردش کار استخدام از ثبت آگهی تا استخدام نهایی."
                        : "گردش کار مدیریت بانک رزومه."}
                </p>
            </div>

            {/* workflow */}
            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-5">
                    گردش کار پیشنهادی
                </h2>
                <div className="space-y-0">
                    {full ? (
                        <>
                            <Step n={1} title="ثبت آگهی شغلی">
                                از بخش <Link to="/jobs" className="text-blue-400">آگهی‌های شغلی</Link>{" "}
                                یک آگهی بسازید (عنوان، دپارتمان، نوع همکاری، حقوق، شرح و الزامات).
                                وضعیت «باز» آن را در پورتال عمومی نمایان می‌کند.
                            </Step>
                            <Step n={2} title="جذب کاندیدا">
                                کاندیداها از سه راه وارد می‌شوند: فرم عمومی{" "}
                                <Link to="/careers" className="text-blue-400">پورتال مشاغل</Link>،
                                افزودن دستی در بانک رزومه، یا{" "}
                                <Link to="/sourcing" className="text-blue-400">منبع‌یابی</Link> از
                                منابع بیرونی.
                            </Step>
                            <Step n={3} title="افزودن به آگهی">
                                در صفحه‌ی هر کاندیدا یا از فهرست (انتخاب گروهی ← «افزودن به آگهی»)
                                او را به آگهی موردنظر متصل کنید تا یک «درخواست» ساخته شود.
                            </Step>
                            <Step n={4} title="حرکت در پایپ‌لاین">
                                در <Link to="/pipeline" className="text-blue-400">پایپ‌لاین استخدام</Link>{" "}
                                کارت هر کاندیدا را با کشیدن‌ورهاکردن بین مراحل جابه‌جا کنید.
                                مراحل را از تنظیمات می‌سازید.
                            </Step>
                            <Step n={5} title="مصاحبه و بازخورد">
                                از <Link to="/interviews" className="text-blue-400">مصاحبه‌ها</Link>{" "}
                                جلسه تنظیم کنید و پس از برگزاری، امتیاز و توصیه ثبت کنید.
                            </Step>
                            <Step n={6} title="استخدام یا رد">
                                انتقال کارت به مرحله‌ی «استخدام»، درخواست را استخدام‌شده و انتقال
                                به «رد» آن را رد می‌کند. روند در{" "}
                                <Link to="/reports" className="text-blue-400">گزارش‌ها</Link> دیده می‌شود.
                            </Step>
                        </>
                    ) : (
                        <>
                            <Step n={1} title="افزودن رزومه">
                                در <Link to="/candidates" className="text-blue-400">کاندیداها</Link>{" "}
                                دکمه «افزودن کاندیدا» — اطلاعات پایه، سوابق کاری، تحصیلات، مهارت‌ها،
                                عکس و فایل رزومه.
                            </Step>
                            <Step n={2} title="منبع‌یابی خودکار">
                                از <Link to="/sourcing" className="text-blue-400">منبع‌یابی</Link>{" "}
                                کاندیدا را از GitHub و منابع دیگر پیدا و با یک کلیک وارد کنید.
                            </Step>
                            <Step n={3} title="امتیازدهی و سازمان‌دهی">
                                ستاره بزنید، نشان کنید، برچسب بزنید و یادداشت تیمی بگذارید تا
                                بانک رزومه مرتب بماند.
                            </Step>
                            <Step n={4} title="جستجو و مقایسه">
                                با فیلترهای پیشرفته کاندیدای مناسب را پیدا کنید و چند نفر را
                                کنار هم مقایسه کنید.
                            </Step>
                        </>
                    )}
                </div>
            </section>

            {/* features */}
            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-5">امکانات کلیدی</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Feature icon={Command} title="جستجوی سریع">
                        کلید <Badge color="slate">Ctrl / ⌘ + K</Badge> را بزنید تا هر جای برنامه
                        بروید یا کاندیدا/آگهی را فوری پیدا کنید.
                    </Feature>
                    <Feature icon={Users} title="فیلتر پیشرفته" to="/candidates">
                        فیلتر بر اساس منبع، امتیاز، برچسب، وضعیت نشان‌شده و مرتب‌سازی — همه در
                        نشانی صفحه ذخیره می‌شوند و قابل اشتراک‌گذاری‌اند.
                    </Feature>
                    <Feature icon={Upload} title="آپلود فایل">
                        عکس پروفایل و فایل رزومه برای هر کاندیدا؛ در فرم پورتال هم رزومه پیوست
                        می‌شود.
                    </Feature>
                    <Feature icon={Tag} title="عملیات گروهی" to="/candidates">
                        چند کاندیدا را تیک بزنید: برچسب گروهی، خروجی CSV، حذف گروهی
                        {full ? "، افزودن به آگهی" : ""}.
                    </Feature>
                    <Feature icon={GitCompare} title="مقایسه کاندیدا">
                        ۲ تا ۴ کاندیدا را از نوار انتخاب گروهی کنار هم بگذارید.
                    </Feature>
                    <Feature icon={Radar} title="منبع‌یابی" to="/sourcing">
                        آگهی و کاندیدا از منابع واقعی (جاب‌ویژن، ای‌استخدام، GitHub، …).
                    </Feature>
                    {full && (
                        <Feature icon={KanbanSquare} title="پایپ‌لاین کانبان" to="/pipeline">
                            برد کشیدنی برای هر آگهی؛ جابه‌جایی مرحله بلافاصله ثبت می‌شود.
                        </Feature>
                    )}
                    {full && (
                        <Feature icon={Globe} title="پورتال عمومی" to="/careers">
                            صفحه‌ی فرصت‌های شغلی برای انتشار عمومی و دریافت درخواست.
                        </Feature>
                    )}
                    {full && (
                        <Feature icon={CalendarClock} title="مصاحبه‌ها" to="/interviews">
                            زمان‌بندی، فیلتر بر اساس آگهی/نوع/وضعیت، و ثبت بازخورد ساختاریافته.
                        </Feature>
                    )}
                    {full && (
                        <Feature icon={BarChart3} title="گزارش‌ها" to="/reports">
                            نرخ استخدام، میانگین زمان تا استخدام و نمودارهای تحلیلی.
                        </Feature>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-slate-200 mb-3">میان‌برهای کیبورد</h2>
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
