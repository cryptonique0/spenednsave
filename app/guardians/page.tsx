import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ManageGuardiansView } from "@/components/guardians/manage-view";

export default function GuardiansPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8">
                <ManageGuardiansView />
            </main>
            <Footer />
        </div>
    );
}
