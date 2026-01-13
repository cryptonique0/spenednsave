import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmergencyView } from "@/components/emergency/emergency-view";

export default function EmergencyPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
                <EmergencyView />
            </main>
            <Footer />
        </>
    );
}
