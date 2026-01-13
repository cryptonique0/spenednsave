import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-8 border-t border-surface-border bg-white/90 dark:bg-background-dark/90 mt-auto">
            <div className="w-full px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                        verified_user
                    </span>
                    <span>Secured by Smart Contracts on Base</span>
                </div>
                <div className="flex gap-6">
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        href="#"
                    >
                        Terms
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        href="#"
                    >
                        Privacy
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
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
