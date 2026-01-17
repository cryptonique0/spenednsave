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
                <div className="flex gap-6 flex-wrap justify-center md:justify-end">
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        href="/terms"
                    >
                        Terms
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        href="/privacy"
                    >
                        Privacy
                    </Link>
                    <Link
                        className="text-xs text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        href="/support"
                    >
                        Support
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    {/* Social Media Icons */}
                    <a
                        href="https://twitter.com/spendguard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        aria-label="Follow us on X (Twitter)"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-5 9-5s1 1 2 3a10.94 10.94 0 002.96-1.79z"/>
                        </svg>
                    </a>
                    <a
                        href="https://t.me/spendguard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        aria-label="Join us on Telegram"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.365-1.35.122-.433-.243-1.37-.67-1.634-.77-.267-.1-.691-.093-.999.067-.309.159-.985.48-.968.979.026.511.487.853 1.156 1.075.502.165 1.662.113 2.342-.146 1.332-.559 3.557-1.847 4.605-2.853.202-.223.385-.445.542-.667 1.119-1.479 1.633-3.76.904-4.514-.173-.181-.36-.245-.564-.25z"/>
                        </svg>
                    </a>
                    <a
                        href="mailto:support@spendguard.io"
                        className="text-slate-400 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                        aria-label="Email us at support@spendguard.io"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </a>
                </div>
                <p className="text-xs text-slate-400 md:hidden lg:block">
                    © 2024 SpendGuard.
                </p>
            </div>
        </footer>
    );
}
