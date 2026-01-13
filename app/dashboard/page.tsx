import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    // In Next.js 15+ searchParams is a Promise. In 14 it's an object. 
    // We'll await it just in case, or handle it based on version. 16.1.1 implies awaiting.
    const params = await searchParams;
    const view = params.view;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
                <DashboardContent forcedView={view} />
            </main>
            <Footer />
        </div>
    );
}
