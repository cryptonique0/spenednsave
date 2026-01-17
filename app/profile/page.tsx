import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ProfilePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
                <div className="max-w-2xl mx-auto w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            My Profile
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage your profile information and social connections
                        </p>
                    </div>

                    {/* Profile Settings */}
                    <div className="space-y-6">
                        {/* Profile Picture Section */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Picture</h2>
                            
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Current Picture */}
                                <div className="flex-shrink-0">
                                    <div className="size-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                                        <svg className="size-12" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Default Avatar</p>
                                </div>

                                {/* Upload Area */}
                                <div className="flex-grow">
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                        <svg className="size-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            id="profile-pic-input"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                        Your profile picture will be displayed on your vault and guardian voting cards.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Social Links</h2>
                            
                            <div className="space-y-4">
                                {/* Twitter/X */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-5 9-5s1 1 2 3a10.94 10.94 0 002.96-1.79z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Twitter / X</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="@your_handle"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* Discord */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.211.375-.445.865-.607 1.252a18.27 18.27 0 00-5.487 0c-.162-.387-.395-.877-.607-1.252a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.042-.106c-.657-.249-1.282-.578-1.955-.842a.079.079 0 01-.008-.129c.131-.102.262-.209.387-.319a.077.077 0 01.08-.011c4.1 1.874 8.55 1.874 12.596 0a.077.077 0 01.083.011c.125.11.256.217.387.319a.079.079 0 01-.007.129c-.673.263-1.298.592-1.955.842a.077.077 0 00-.042.107c.353.699.764 1.364 1.226 1.994a.076.076 0 00.084.028a19.86 19.86 0 006.002-3.03.077.077 0 00.032-.057c.5-4.506.852-8.94.029-13.314a.076.076 0 00-.031-.057zM8.02 15.278c-1.122 0-2.04-1.029-2.04-2.291s.92-2.291 2.04-2.291c1.133 0 2.06 1.029 2.04 2.291 0 1.262-.92 2.291-2.04 2.291zm7.974 0c-1.122 0-2.04-1.029-2.04-2.291s.92-2.291 2.04-2.291c1.133 0 2.06 1.029 2.04 2.291 0 1.262-.907 2.291-2.04 2.291z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Discord</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="YourUsername#0000"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* GitHub */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">GitHub</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="github_username"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* Website/Portfolio */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Website / Portfolio</span>
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://yourwebsite.com"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* Telegram */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.365-1.35.122-.433-.243-1.37-.67-1.634-.77-.267-.1-.691-.093-.999.067-.309.159-.985.48-.968.979.026.511.487.853 1.156 1.075.502.165 1.662.113 2.342-.146 1.332-.559 3.557-1.847 4.605-2.853.202-.223.385-.445.542-.667 1.119-1.479 1.633-3.76.904-4.514-.173-.181-.36-.245-.564-.25z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Telegram</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="@your_telegram_handle"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* LinkedIn */}
                                <div>
                                    <label className="flex items-center gap-3 mb-2">
                                        <svg className="size-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.81 0-9.728h3.554v1.375c.425-.654 1.187-1.584 2.882-1.584 2.105 0 3.684 1.375 3.684 4.331v5.606zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.953.77-1.715 1.958-1.715 1.187 0 1.927.762 1.927 1.715 0 .953-.74 1.715-1.97 1.715zm1.6 11.597H3.819V9.624h3.119v10.828zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">LinkedIn</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="your-linkedin-profile"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Bio</h2>
                            <textarea 
                                placeholder="Tell the community about yourself... (max 500 characters)"
                                maxLength={500}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                This bio will be visible on your guardian voting cards and vault profile.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-3">
                            <button className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors">
                                Save Changes
                            </button>
                            <button className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-surface-dark text-slate-900 dark:text-white border border-gray-200 dark:border-surface-border font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                Cancel
                            </button>
                        </div>

                        {/* Success Message */}
                        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl hidden">
                            <p className="text-sm text-green-900 dark:text-green-300">
                                ✓ Profile updated successfully!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
