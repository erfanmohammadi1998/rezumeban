import { Component } from "react";

export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("UI crash:", error, info);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold">مشکلی پیش آمد</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        این صفحه به‌درستی بارگذاری نشد. صفحه را تازه کنید یا به داشبورد برگردید.
                    </p>
                    <pre className="text-xs text-slate-600 mt-4 overflow-x-auto text-left bg-slate-900 rounded-lg p-3">
                        {String(this.state.error?.message || this.state.error)}
                    </pre>
                    <div className="flex gap-3 justify-center mt-5">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm"
                        >
                            تازه‌سازی
                        </button>
                        <a
                            href="/"
                            className="px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-sm"
                        >
                            داشبورد
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
