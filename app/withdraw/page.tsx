"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WithdrawalForm } from "@/components/withdrawal/withdraw-form";
import { ScheduledWithdrawalsList } from "@/components/withdrawal/scheduled-list";

function WithdrawPage() {
    // Handler to execute a scheduled withdrawal (calls API)
    const handleExecute = async (id: number) => {
        try {
            const res = await fetch(`/api/scheduled-withdrawals/${id}/execute`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to execute withdrawal');
            } else {
                alert('Withdrawal executed!');
                window.location.reload();
            }
        } catch (err: any) {
            alert(err.message || 'Failed to execute withdrawal');
        }
    };
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col items-center justify-center px-6 py-8 md:px-8 md:py-12 gap-12">
                <WithdrawalForm />
                <div className="w-full max-w-2xl">
                    <h2 className="text-xl font-bold mb-4">Scheduled Withdrawals</h2>
                    <ScheduledWithdrawalsList onExecute={handleExecute} />
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default WithdrawPage;
