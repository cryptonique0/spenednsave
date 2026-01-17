# Multi-Token Integration Guide for Developers

## 🚀 Getting Started

### Installation

The multi-token system is already integrated into SpendGuard. No additional dependencies required.

### Basic Setup

```typescript
// Import what you need
import { getAllTokens, getToken, addCustomToken } from '@/lib/tokens';
import { useTokenPrice, convertToUSD, formatUSDPrice } from '@/lib/hooks/useTokenPrice';
import { useApproveToken, useDepositToken } from '@/lib/hooks/useTokenOperations';
import { EnhancedTokenDepositForm } from '@/components/dashboard/enhanced-token-deposit-form';
import { TokenRegistry } from '@/components/dashboard/token-registry';
```

## 📚 Common Integration Patterns

### 1. Display All Available Tokens

```typescript
import { getAllTokens } from '@/lib/tokens';

function TokenList() {
  const chainId = 84532; // Base Sepolia
  const tokens = getAllTokens(chainId);

  return (
    <div>
      {tokens.map((token) => (
        <div key={token.symbol}>
          <span>{token.icon}</span>
          <span>{token.name}</span>
          <span>{token.symbol}</span>
        </div>
      ))}
    </div>
  );
}
```

### 2. Get Real-Time Token Prices

```typescript
import { useTokenPrice, formatUSDPrice } from '@/lib/hooks/useTokenPrice';

function PriceDisplay() {
  const chainId = 84532;
  const { data: priceData, isLoading } = useTokenPrice(chainId, 'USDC');

  if (isLoading) return <div>Loading price...</div>;
  
  const price = Number(priceData[1]) / 10 ** 8; // Chainlink decimals
  return <div>USDC Price: {formatUSDPrice(price)}</div>;
}
```

### 3. Convert Token Amount to USD

```typescript
import { useTokenPrice, convertToUSD } from '@/lib/hooks/useTokenPrice';

function AmountConverter({ tokenSymbol, amount }) {
  const chainId = 84532;
  const token = getToken(chainId, tokenSymbol);
  const { data: priceData } = useTokenPrice(chainId, tokenSymbol);

  if (!token || !priceData) return null;

  const price = Number(priceData[1]) / 10 ** 8;
  const usdValue = convertToUSD(amount, token.decimals, price);

  return <div>${usdValue.toFixed(2)}</div>;
}
```

### 4. Get User Token Balance

```typescript
import { useTokenBalance } from '@/lib/hooks/useTokenOperations';

function UserBalance({ userAddress }) {
  const chainId = 84532;
  const { data: balance } = useTokenBalance(chainId, 'USDC', userAddress);

  return <div>Balance: {balance?.toString()}</div>;
}
```

### 5. Handle Token Approvals

```typescript
import { useApproveToken } from '@/lib/hooks/useTokenOperations';

function ApproveButton({ token, vaultAddress }) {
  const chainId = 84532;
  const { approve, isApproving, isApproved } = useApproveToken(
    chainId,
    token,
    vaultAddress
  );

  return (
    <>
      {!isApproved ? (
        <button onClick={() => approve('1000.50')} disabled={isApproving}>
          {isApproving ? 'Approving...' : 'Approve Token'}
        </button>
      ) : (
        <span>✓ Approved</span>
      )}
    </>
  );
}
```

### 6. Handle Token Deposits

```typescript
import { useDepositToken } from '@/lib/hooks/useTokenOperations';

function DepositButton({ token, amount, vaultAddress }) {
  const chainId = 84532;
  const { deposit, isDepositing, isSuccess } = useDepositToken(
    chainId,
    token,
    vaultAddress
  );

  return (
    <>
      <button 
        onClick={() => deposit(amount)} 
        disabled={isDepositing}
      >
        {isDepositing ? 'Depositing...' : 'Deposit'}
      </button>
      {isSuccess && <span>✓ Deposit successful!</span>}
    </>
  );
}
```

### 7. Get Multiple Token Prices

```typescript
import { useTokenPrices } from '@/lib/hooks/useTokenPrice';

function PortfolioValue() {
  const chainId = 84532;
  const { prices, isLoading } = useTokenPrices(chainId, ['ETH', 'USDC', 'DAI']);

  return (
    <div>
      {Object.entries(prices).map(([symbol, price]) => (
        <div key={symbol}>
          {symbol}: ${price?.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
```

### 8. Calculate Total Portfolio Value

```typescript
import { useTotalVaultValueUSD } from '@/lib/hooks/useTokenPrice';

function VaultValue() {
  const chainId = 84532;
  const balances = {
    ETH: BigInt('1000000000000000000'), // 1 ETH
    USDC: BigInt('1000000000'),         // 1000 USDC
  };

  const { totalUSD, breakdown, isLoading } = useTotalVaultValueUSD(
    chainId,
    balances
  );

  return (
    <div>
      <div>Total: ${totalUSD.toFixed(2)}</div>
      {Object.entries(breakdown).map(([token, value]) => (
        <div key={token}>{token}: ${value.toFixed(2)}</div>
      ))}
    </div>
  );
}
```

### 9. Add Custom Token

```typescript
import { addCustomToken } from '@/lib/tokens';

function AddTokenForm() {
  const [tokenData, setTokenData] = useState({
    symbol: 'ABC',
    name: 'My Custom Token',
    address: '0x...',
    decimals: 18,
    chainId: 84532,
    type: 'erc20' as const,
    description: 'Custom token',
  });

  const handleAdd = () => {
    const customToken = addCustomToken(84532, tokenData);
    console.log('Token added:', customToken);
  };

  return (
    <button onClick={handleAdd}>Add Token</button>
  );
}
```

### 10. Integrate Enhanced Deposit Form

```typescript
import { EnhancedTokenDepositForm } from '@/components/dashboard/enhanced-token-deposit-form';

function DepositPage({ vaultAddress }) {
  return (
    <EnhancedTokenDepositForm
      vaultAddress={vaultAddress}
      onDepositSuccess={() => {
        console.log('Deposit successful!');
        // Refresh balances, show success message, etc.
      }}
    />
  );
}
```

### 11. Integrate Token Registry

```typescript
import { TokenRegistry } from '@/components/dashboard/token-registry';

function SettingsPage() {
  return (
    <div>
      <h2>Manage Tokens</h2>
      <TokenRegistry />
    </div>
  );
}
```

## 🔄 Advanced Patterns

### Monitor Token Balances

```typescript
import { useTokenBalances } from '@/lib/hooks/useTokenOperations';

function BalanceMonitor({ userAddress }) {
  const chainId = 84532;
  const symbols = ['ETH', 'USDC', 'DAI'];
  const { balances, isLoading } = useTokenBalances(chainId, symbols, userAddress);

  return (
    <div>
      {isLoading ? 'Loading...' : (
        Object.entries(balances).map(([symbol, balance]) => (
          <div key={symbol}>
            {symbol}: {balance?.toString()}
          </div>
        ))
      )}
    </div>
  );
}
```

### Real-Time Portfolio Dashboard

```typescript
import { useTotalVaultValueUSD } from '@/lib/hooks/useTokenPrice';
import { getAllTokens } from '@/lib/tokens';

function PortfolioDashboard({ vaultBalances }) {
  const chainId = 84532;
  const { totalUSD, breakdown } = useTotalVaultValueUSD(chainId, vaultBalances);
  const tokens = getAllTokens(chainId);

  return (
    <div>
      <h2>Portfolio: ${totalUSD.toFixed(2)}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {tokens.map((token) => (
          <div key={token.symbol}>
            <span>{token.icon} {token.symbol}</span>
            <span>${breakdown[token.symbol]?.toFixed(2) || '0.00'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Custom Token Verification

```typescript
import { useTokenDetails } from '@/lib/hooks/useTokenOperations';

function VerifyToken({ tokenAddress }) {
  const chainId = 84532;
  // Custom hook to verify token on-chain
  const { name, symbol, decimals } = useTokenDetails(chainId, symbol);

  return (
    <div>
      <p>Name: {name}</p>
      <p>Symbol: {symbol}</p>
      <p>Decimals: {decimals}</p>
    </div>
  );
}
```

## 🛠️ Helper Functions Reference

### Token Registry

```typescript
getTokensByChain(chainId)                    // Get all tokens for network
getToken(chainId, symbol)                    // Get token by symbol
getTokensArray(chainId)                      // Get tokens as array
getTokenByAddress(chainId, address)          // Get token by address
getAllTokens(chainId)                        // Get verified + custom
getCustomTokens(chainId)                     // Get custom tokens only
addCustomToken(chainId, token)               // Add custom token
removeCustomToken(chainId, symbol)           // Remove custom token
isValidTokenAddress(address)                 // Validate address format
```

### Price Feeds

```typescript
useTokenPrice(chainId, symbol)               // Single price feed
useTokenPrices(chainId, symbols)             // Multiple prices
useTokenPriceDecimals(chainId, symbol)       // Oracle decimals
useTotalVaultValueUSD(chainId, balances)     // Portfolio value
convertToUSD(amount, decimals, price)        // Amount conversion
formatUSDPrice(amount, decimals)             // Format currency
getChainOracles(chainId)                     // Get all oracles
```

### Token Operations

```typescript
useApproveToken(chainId, symbol, spender)    // Approval hook
useDepositToken(chainId, symbol, vault)      // Deposit hook
useTokenBalance(chainId, symbol, user)       // Balance query
useTokenBalances(chainId, symbols, user)     // Multi-balance
useTokenDetails(chainId, symbol)             // Token metadata
```

## 🔍 Debugging Tips

### Check Available Tokens
```typescript
import { getAllTokens } from '@/lib/tokens';
console.log(getAllTokens(84532));
```

### Verify Price Feed
```typescript
const { data, isLoading, isError } = useTokenPrice(84532, 'USDC');
console.log('Price data:', data);
console.log('Is loading:', isLoading);
console.log('Error:', isError);
```

### Test Custom Token Addition
```typescript
const token = addCustomToken(84532, {
  symbol: 'TEST',
  name: 'Test Token',
  address: '0x...',
  decimals: 18,
  chainId: 84532,
  type: 'erc20',
  description: 'Test',
});
console.log('Added token:', token);
```

## 📋 Checklist for Integration

- [ ] Import necessary functions/hooks
- [ ] Set correct chainId (84532 or 8453)
- [ ] Test token selection
- [ ] Verify price feeds working
- [ ] Test approvals
- [ ] Test deposits
- [ ] Test custom token addition
- [ ] Verify USD conversions
- [ ] Check dark mode rendering
- [ ] Test mobile responsiveness

## 🚀 Deployment Checklist

- [ ] Test on Base Sepolia testnet
- [ ] Verify Chainlink oracles responding
- [ ] Test all 6 pre-configured tokens
- [ ] Test custom token addition
- [ ] Verify prices updating every 30s
- [ ] Check error handling
- [ ] Monitor gas usage
- [ ] Deploy to Base Mainnet
- [ ] Monitor production oracles

## 📞 Support

For issues:
1. Check [MULTI_TOKEN_EXPANSION.md](MULTI_TOKEN_EXPANSION.md)
2. Review [MULTI_TOKEN_QUICKREF.md](MULTI_TOKEN_QUICKREF.md)
3. Check browser console for errors
4. Verify chain ID and token symbols
5. Test on testnet first

---

**Last Updated**: January 17, 2026  
**Version**: 2.0
