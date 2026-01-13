import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SetupWizard } from "@/components/vault-setup/setup-wizard";

export default function VaultSetupPage() {
    return (
        <>
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-8 md:px-8 md:py-12">
                <SetupWizard />
            </main>
            <Footer />
        </>
    );
}
