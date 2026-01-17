import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmartSuggestionsCompact } from "@/components/smart-suggestions";
import { Mail, MessageSquare, Github, HelpCircle, Zap, Shield } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
                <div className="max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Support & Help Center
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Get help, report issues, and connect with the community
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* Email Support */}
                        <a href="mailto:support@spendguard.io" className="group">
                            <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Mail size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Send us an email for detailed inquiries
                                </p>
                                <div className="text-primary font-semibold text-sm group-hover:underline">
                                    support@spendguard.io →
                                </div>
                            </div>
                        </a>

                        {/* Discord Community */}
                        <a href="https://discord.gg/spendguard" target="_blank" rel="noopener noreferrer" className="group">
                            <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                    <MessageSquare size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Discord Community</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Chat with our team and community members
                                </p>
                                <div className="text-primary font-semibold text-sm group-hover:underline">
                                    Join Discord →
                                </div>
                            </div>
                        </a>

                        {/* GitHub Issues */}
                        <a href="https://github.com/spendguard/spendguard" target="_blank" rel="noopener noreferrer" className="group">
                            <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Github size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">GitHub Issues</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Report bugs or request features
                                </p>
                                <div className="text-primary font-semibold text-sm group-hover:underline">
                                    Open an Issue →
                                </div>
                            </div>
                        </a>

                        {/* Security Advisories */}
                        <a href="/security-advisories" className="group">
                            <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="size-12 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Security Advisories</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    View security updates and advisories
                                </p>
                                <div className="text-primary font-semibold text-sm group-hover:underline">
                                    View Advisories →
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* FAQ Section */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                        </div>

                        {/* Smart Suggestions */}
                        <div className="mb-8">
                            <SmartSuggestionsCompact
                              userContext={{
                                isNewUser: false,
                                hasSetSpendingLimits: false,
                                hasSetTimelock: false,
                                isSecurityAware: false,
                                referralProgram: false
                              }}
                              limit={3}
                            />
                        </div>
                        
                        <div className="space-y-4">
                            {/* FAQ Item 1 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>How do I create a vault?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    Navigate to the Vault section and click "Create New Vault". Configure your spending limits, 
                                    time-locks, and add guardians. Your vault will be deployed as a smart contract on the Base Sepolia testnet. 
                                    You'll need ETH to pay gas fees.
                                </p>
                            </details>

                            {/* FAQ Item 2 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>What is a guardian?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    A guardian is a trusted person or entity that helps protect your vault. Guardians must approve 
                                    withdrawal requests, vote on emergency decisions, and help recover your account if needed. They can be 
                                    family members, friends, or professional guardians.
                                </p>
                            </details>

                            {/* FAQ Item 3 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>How do spending limits work?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    Spending limits restrict how much you can withdraw per transaction or per period. 
                                    If you exceed the limit, your withdrawal is queued and requires guardian approval. 
                                    You can set different limits for different time periods (daily, weekly, monthly).
                                </p>
                            </details>

                            {/* FAQ Item 4 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>What are time-locked withdrawals?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    Time-locks delay withdrawals by a specified period (e.g., 48 hours). Once you initiate a withdrawal, 
                                    it enters a queue and can only be executed after the time-lock expires. This prevents impulsive decisions 
                                    and gives guardians time to intervene if needed.
                                </p>
                            </details>

                            {/* FAQ Item 5 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>How do I withdraw funds?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    Go to the Withdraw section and enter the amount. If it's within your spending limit, the withdrawal 
                                    is queued. If it exceeds the limit or is time-locked, guardians must approve it. Once conditions are met, 
                                    execute the withdrawal to receive funds in your wallet.
                                </p>
                            </details>

                            {/* FAQ Item 6 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>What happens in an emergency?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    You can trigger an emergency freeze to lock your vault immediately. This is useful if you suspect 
                                    unauthorized access or fraud. Guardians must vote to unfreeze the vault. This mechanism prevents unauthorized 
                                    withdrawals during security incidents.
                                </p>
                            </details>

                            {/* FAQ Item 7 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>Is my data private?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    SpendGuard is non-custodial, so we never hold your funds or private keys. However, blockchain transactions 
                                    are public by nature. Your wallet address and transaction amounts are visible on the blockchain forever. 
                                    See our Privacy Policy for more details.
                                </p>
                            </details>

                            {/* FAQ Item 8 */}
                            <details className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group">
                                <summary className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white select-none">
                                    <HelpCircle size={20} className="text-primary flex-shrink-0" />
                                    <span>What happens if my guardian is unavailable?</span>
                                    <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-4 ml-8">
                                    You can have multiple guardians. If one is unavailable, others can still approve withdrawals 
                                    if the multi-sig threshold is met. You can also add backup guardians or use guardian delegation 
                                    to assign voting rights to a replacement.
                                </p>
                            </details>
                        </div>
                    </div>

                    {/* Troubleshooting Section */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Troubleshooting</h2>
                        
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                    <Zap size={20} className="text-yellow-500" />
                                    Transaction Failed
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">
                                    If your transaction failed:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                                    <li>Check that you have sufficient ETH for gas fees</li>
                                    <li>Ensure your wallet is connected to Base Sepolia testnet</li>
                                    <li>Try again with a higher gas price if the network is congested</li>
                                    <li>Check the transaction hash on BlockScout for error details</li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                    <Shield size={20} className="text-red-500" />
                                    Wallet Connection Issues
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">
                                    If your wallet won't connect:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                                    <li>Refresh the page and try again</li>
                                    <li>Disconnect and reconnect your wallet</li>
                                    <li>Check that your wallet extension is enabled</li>
                                    <li>Clear browser cache if issues persist</li>
                                    <li>Try a different wallet provider (MetaMask, WalletConnect, etc.)</li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                    <HelpCircle size={20} className="text-blue-500" />
                                    Can't Withdraw Funds
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">
                                    If you can't withdraw:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                                    <li>Check if your withdrawal exceeds the spending limit</li>
                                    <li>Wait for the time-lock period to expire</li>
                                    <li>Ensure guardians have approved your withdrawal</li>
                                    <li>Verify the vault is not frozen</li>
                                    <li>Check the Activity Log for status updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Section */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/5 dark:to-primary/5 border border-primary/20 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Still Need Help?
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 mb-6">
                            Our support team is ready to help. Reach out through any of these channels:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <a 
                                href="mailto:support@spendguard.io"
                                className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl hover:shadow-md transition-all"
                            >
                                <Mail size={20} className="text-primary flex-shrink-0" />
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">Email</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">support@spendguard.io</div>
                                </div>
                            </a>
                            <a 
                                href="https://discord.gg/spendguard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl hover:shadow-md transition-all"
                            >
                                <MessageSquare size={20} className="text-indigo-500 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">Discord</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Join our community</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Response Time Notice */}
                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm text-slate-600 dark:text-slate-400">
                        <p>
                            <span className="font-semibold">Response Time:</span> Email support typically responds within 24-48 hours. 
                            For urgent issues, join our Discord for faster assistance.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
