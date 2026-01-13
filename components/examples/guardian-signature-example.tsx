'use client';

import { useState } from 'react';
import { useGuardianSignatures } from '@/lib/hooks/useGuardianSignatures';
import { formatEther, parseEther, type Address } from 'viem';

/**
 * Example component demonstrating guardian signature workflow
 * 
 * This shows the complete flow:
 * 1. Saver creates a withdrawal request
 * 2. Guardians view and sign the request
 * 3. Once quorum is met, anyone can execute
 */
export function GuardianSignatureExample({ vaultAddress }: { vaultAddress: Address }) {
    const {
        isLoading,
        error,
        getPendingRequests,
        getGuardians,
        isUserGuardian,
        createWithdrawalRequest,
        signRequest,
        executeWithdrawal,
        getSignatureStatus,
        verifyRequest,
    } = useGuardianSignatures(vaultAddress);

    const [guardians, setGuardians] = useState<Address[]>([]);
    const [isGuardian, setIsGuardian] = useState(false);

    // Load data
    const loadData = async () => {
        try {
            const [guardiansData, guardianStatus] = await Promise.all([
                getGuardians(),
                isUserGuardian(),
            ]);
            setGuardians(guardiansData);
            setIsGuardian(guardianStatus);
        } catch (err) {
            console.error('Error loading data:', err);
        }
    };

    // Create a new withdrawal request (Saver)
    const handleCreateRequest = async () => {
        try {
            const request = await createWithdrawalRequest(
                '0x0000000000000000000000000000000000000000', // ETH
                parseEther('0.1'), // 0.1 ETH
                '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // recipient
                'Emergency medical expenses'
            );
            console.log('Request created:', request);
            alert(`Request created with ID: ${request.id}`);
        } catch (err) {
            console.error('Error creating request:', err);
            alert('Failed to create request');
        }
    };

    // Sign a request (Guardian)
    const handleSignRequest = async (requestId: string) => {
        try {
            await signRequest(requestId);
            alert('Request signed successfully!');
        } catch (err) {
            console.error('Error signing request:', err);
            alert('Failed to sign request');
        }
    };

    // Execute withdrawal (Anyone, once quorum met)
    const handleExecuteWithdrawal = async (requestId: string) => {
        try {
            const txHash = await executeWithdrawal(requestId);
            alert(`Withdrawal executed! TX: ${txHash}`);
        } catch (err) {
            console.error('Error executing withdrawal:', err);
            alert('Failed to execute withdrawal');
        }
    };

    // View signature status
    const handleViewStatus = async (requestId: string) => {
        try {
            const status = await getSignatureStatus(requestId);
            console.log('Signature status:', status);
            
            const verification = await verifyRequest(requestId);
            console.log('Verification:', verification);
            
            alert(`
Signatures: ${verification.valid.length}/${verification.requiredQuorum}
Meets Quorum: ${verification.meetsQuorum ? 'Yes' : 'No'}
Valid: ${verification.valid.length}
Invalid: ${verification.invalid.length}
            `.trim());
        } catch (err) {
            console.error('Error viewing status:', err);
            alert('Failed to view status');
        }
    };

    const pendingRequests = getPendingRequests();

    return (
        <div className="space-y-6 p-6">
            <div className="border rounded-lg p-4">
                <h2 className="text-xl font-bold mb-4">Guardian Signature Management</h2>
                
                <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    {isLoading ? 'Loading...' : 'Load Data'}
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}

                <div className="mt-4 space-y-2">
                    <p><strong>Vault:</strong> {vaultAddress}</p>
                    <p><strong>Total Guardians:</strong> {guardians.length}</p>
                    <p><strong>You are a Guardian:</strong> {isGuardian ? 'Yes' : 'No'}</p>
                </div>

                <div className="mt-4">
                    <h3 className="font-semibold">Guardians:</h3>
                    <ul className="list-disc list-inside">
                        {guardians.map((guardian) => (
                            <li key={guardian} className="font-mono text-sm">
                                {guardian}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Create Request Section (for Saver) */}
            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Create Withdrawal Request</h3>
                <button
                    onClick={handleCreateRequest}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                >
                    Create Test Request (0.1 ETH)
                </button>
            </div>

            {/* Pending Requests */}
            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">
                    Pending Requests ({pendingRequests.length})
                </h3>
                
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-500">No pending requests</p>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="border rounded p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{request.request.reason}</p>
                                        <p className="text-sm text-gray-600">
                                            Amount: {formatEther(request.request.amount)} ETH
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Recipient: {request.request.recipient}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Nonce: {request.request.nonce.toString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`
                                            px-3 py-1 rounded text-sm font-medium
                                            ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                            ${request.status === 'executed' ? 'bg-blue-100 text-blue-800' : ''}
                                            ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                        `}>
                                            {request.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium">
                                        Signatures: {request.signatures.length}/{request.requiredQuorum}
                                    </p>
                                    {request.signatures.length > 0 && (
                                        <ul className="text-xs space-y-1 mt-2">
                                            {request.signatures.map((sig) => (
                                                <li key={sig.signer} className="font-mono">
                                                    ✓ {sig.signer.slice(0, 10)}...{sig.signer.slice(-8)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {isGuardian && request.status === 'pending' && (
                                        <button
                                            onClick={() => handleSignRequest(request.id)}
                                            disabled={isLoading || request.signatures.some(
                                                sig => sig.signer.toLowerCase() === guardians[0]?.toLowerCase()
                                            )}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                                        >
                                            Sign Request
                                        </button>
                                    )}
                                    
                                    {request.status === 'approved' && (
                                        <button
                                            onClick={() => handleExecuteWithdrawal(request.id)}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                                        >
                                            Execute Withdrawal
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => handleViewStatus(request.id)}
                                        disabled={isLoading}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm disabled:opacity-50"
                                    >
                                        View Status
                                    </button>
                                </div>

                                {request.executionTxHash && (
                                    <p className="text-xs text-gray-600">
                                        TX: {request.executionTxHash}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
