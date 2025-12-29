import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ActivityLogView } from "@/components/activity/activity-view";

export default function ActivityPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8">
                <ActivityLogView />
            </main>
            <Footer />
        </div>
    );
}
