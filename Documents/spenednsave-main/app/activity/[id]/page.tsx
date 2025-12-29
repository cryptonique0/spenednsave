import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RequestDetailView } from "@/components/activity/request-detail-view";

export default function RequestDetailPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-start w-full">
                <RequestDetailView />
            </main>
            <Footer />
        </>
    );
}
