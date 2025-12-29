import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RequestDetailView } from "@/components/activity/request-detail-view";

export default function RequestDetailPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-start w-full">
                <RequestDetailView />
            </main>
            <Footer />
        </div>
    );
}
