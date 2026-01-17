import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/auth-guard";
import { SimulationDemo } from "@/components/simulation/SimulationDemo";
import { AIHelpAssistant } from "@/components/ai-help-assistant";
import { FAQChatbot } from "@/components/faq-chatbot";
import Toaster from "@/components/ui/toaster";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SpendGuard",
  description: "Your Personal Fortress on Base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AuthGuard>
              {children}
              <SimulationDemo />
              <AIHelpAssistant />
              <FAQChatbot />
              <Toaster />
            </AuthGuard>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
