import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WithdrawalForm } from "@/components/withdrawal/withdraw-form";

export default function WithdrawalPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <WithdrawalForm />
            </main>
            <Footer />
        </>
    );
}
