import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WithdrawalForm } from "@/components/withdrawal/withdraw-form";

export default function WithdrawalPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-8 md:px-8 md:py-12">
                <WithdrawalForm />
            </main>
            <Footer />
        </div>
    );
}
