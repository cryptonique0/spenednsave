import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SetupWizard } from "@/components/vault-setup/setup-wizard";

export default function VaultSetupPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <SetupWizard />
            </main>
            <Footer />
        </>
    );
}
