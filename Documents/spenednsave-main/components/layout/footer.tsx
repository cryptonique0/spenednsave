import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-8 border-t border-gray-200 dark:border-surface-border bg-white dark:bg-background-dark mt-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                        verified_user
                    </span>
                    <span>Secured by Smart Contracts on Base</span>
                </div>
                <div className="flex gap-6">
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors"
                        href="#"
                    >
                        Terms
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors"
                        href="#"
                    >
                        Privacy
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors"
                        href="#"
                    >
                        Support
                    </Link>
                </div>
                <p className="text-xs text-slate-400 md:hidden lg:block">
                    © 2024 SpendGuard.
                </p>
            </div>
        </footer>
    );
}
