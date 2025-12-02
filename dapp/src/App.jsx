import React, { useMemo, useState } from 'react'
import './App.css'
import { useAccount, useDisconnect, useSignMessage, useConnect } from 'wagmi'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import NetworkInfo from './components/NetworkInfo'
import StatusBar from './components/StatusBar'
import BalanceOf from './components/BalanceOf'
import { TOKENS } from './config/tokens'
import SwitchNetwork from './components/SwitchNetwork'
import TokenSelector from './components/TokenSelector'
import TransactionDemo from './components/TransactionDemo'
import TransactionHistory from './components/TransactionHistory'
import MultiWalletSupport from './components/MultiWalletSupport'
import StakingDashboard from './components/StakingDashboard'
import NFTMinting from './components/NFTMinting'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import ThemeToggle from './components/ThemeToggle'
import TransactionSimulator from './components/TransactionSimulator'
import MultiSigIntegration from './components/MultiSigIntegration'
import GovernanceDashboard from './components/GovernanceDashboard'
import NotificationSystem from './components/NotificationSystem'
import SwapComponent from './components/SwapComponent'
import LendingComponent from './components/LendingComponent'
import UserProfile from './components/UserProfile'
import TokenSwap from './components/TokenSwap'
import PortfolioAggregator from './components/PortfolioAggregator'
import QRCodePayment from './components/QRCodePayment'
import PriceCharts from './components/PriceCharts'
import AddressBook from './components/AddressBook'
import NFTGallery from './components/NFTGallery'
import TokenApprovalManager from './components/TokenApprovalManager'
import ENSResolver from './components/ENSResolver'
import TransactionScheduler from './components/TransactionScheduler'
import { ThemeProvider } from './contexts/ThemeContext'
import { formatAddress } from './lib/format'

export default function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const [sig, setSig] = useState(null)

  async function onSign() {
    try {
      const message = 'Sign this message to prove you own the wallet.'
      const signature = await signMessageAsync({ message })
      setSig(signature)
    } catch (err) {
      console.error(err)
      setSig(null)
    }
  }

  const wcConnector = connectors.find((c) => c instanceof WalletConnectConnector)
  const injectedConnector = useMemo(
    () => connectors.find((c) => c.id === 'injected'),
    [connectors]
  )

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
  const missingProjectId = !projectId || projectId === 'your_project_id_here'
  const [selectedToken, setSelectedToken] = useState(TOKENS.cUSD.address)

  const connectorsReady = connectors && connectors.length > 0

  return (
    <ThemeProvider>
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>WCT DApp (WalletConnect on Celo Alfajores)</h1>
          <ThemeToggle />
        </div>

        <StatusBar />
        <SwitchNetwork />
        <div style={{ marginTop: 12 }}>
          {isConnected ? (
            <div>
              <div>Connected address: {formatAddress(address)}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => disconnect()}>Disconnect</button>
                <button onClick={onSign} style={{ marginLeft: 8 }}>
                  Sign message
                </button>
              </div>
              <NetworkInfo />
              <TokenSelector tokens={TOKENS} value={selectedToken} onChange={setSelectedToken} />
              <BalanceOf tokenAddress={TOKENS.cUSD.address} label="cUSD" />
              {selectedToken && selectedToken !== TOKENS.cUSD.address && (
                <BalanceOf tokenAddress={selectedToken} label="Selected token" />
              )}
              <TransactionDemo tokenAddress={selectedToken} />
              <TransactionHistory />
              <PortfolioAggregator />
              <PriceCharts />
              <TokenSwap />
              <QRCodePayment />
              <AddressBook />
              <TransactionScheduler />
              <ENSResolver />
              <NFTGallery />
              <TokenApprovalManager />
              <StakingDashboard tokenAddress={selectedToken} />
              <NFTMinting nftContractAddress={selectedToken} /> {/* Placeholder; use actual NFT contract */}
              <AnalyticsDashboard />
              <GovernanceDashboard governanceContractAddress={selectedToken} /> {/* Placeholder */}
              <NotificationSystem />
              <SwapComponent tokenIn={TOKENS.cUSD.address} tokenOut={selectedToken} />
              <LendingComponent tokenAddress={selectedToken} />
              <UserProfile />
              <TransactionSimulator txData={{ to: selectedToken, data: '0x', value: '0x0' }} /> {/* Placeholder txData */}
              <MultiSigIntegration txData={{ to: selectedToken, data: '0x', value: '0x0' }} /> {/* Placeholder txData */}
              {sig && (
                <pre style={{ marginTop: 12, maxWidth: 800, whiteSpace: 'break-spaces' }}>{sig}</pre>
              )}
            </div>
          ) : (
            <MultiWalletSupport />
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
