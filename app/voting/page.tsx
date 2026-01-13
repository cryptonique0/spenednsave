import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { VotingView } from "@/components/voting/voting-view";

export default function VotingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-8 md:px-8 md:py-12 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <VotingView />
            </main>
            <Footer />
        </div>
    );
}
