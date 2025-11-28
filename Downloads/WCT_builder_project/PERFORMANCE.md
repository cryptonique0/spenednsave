# Performance Optimization Guide

## Frontend Performance

### Bundle Size Optimization

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Optimize imports - use specific imports instead of barrel imports
# Bad:
import { Button, Input, Modal } from 'library'

# Good:
import Button from 'library/Button'
import Input from 'library/Input'
```

### Code Splitting

```javascript
// Use dynamic imports for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### React Performance

```javascript
// Memoize expensive calculations
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])

// Prevent unnecessary re-renders
const MemoizedComponent = memo(Component)

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  doSomething(a, b)
}, [a, b])
```

## Smart Contract Gas Optimization

### General Tips

1. **Use `uint256` instead of smaller uints** - EVM operates on 256-bit words
2. **Pack variables** - Group variables of the same size
3. **Use events instead of storage** - Much cheaper for data that doesn't need to be read on-chain
4. **Minimize storage writes** - Most expensive operation
5. **Use `calldata` for external function parameters**

### Example Optimizations

```solidity
// Before (expensive)
function transfer(address[] memory recipients, uint256[] memory amounts) external {
    for (uint i = 0; i < recipients.length; i++) {
        _transfer(msg.sender, recipients[i], amounts[i]);
    }
}

// After (optimized)
function transfer(address[] calldata recipients, uint256[] calldata amounts) external {
    uint256 length = recipients.length;
    for (uint256 i; i < length; ) {
        _transfer(msg.sender, recipients[i], amounts[i]);
        unchecked { ++i; }
    }
}
```

## RPC Performance

### Rate Limiting

```javascript
// Batch requests when possible
const [balance, nonce, gasPrice] = await Promise.all([
  provider.getBalance(address),
  provider.getTransactionCount(address),
  provider.getGasPrice()
])

// Use multicall for multiple contract reads
import { Multicall } from 'ethers-multicall'
```

### Caching

```javascript
// Cache frequently accessed data
const cache = new Map()

function getCachedBalance(address) {
  if (cache.has(address)) {
    const { value, timestamp } = cache.get(address)
    if (Date.now() - timestamp < 60000) { // 1 minute cache
      return value
    }
  }
  
  const balance = await provider.getBalance(address)
  cache.set(address, { value: balance, timestamp: Date.now() })
  return balance
}
```

## Database & Backend

### Indexing

```javascript
// Index frequently queried fields
db.collection('transactions').createIndex({ 
  from: 1, 
  timestamp: -1 
})
```

### Pagination

```javascript
// Use cursor-based pagination for large datasets
async function getTransactions(cursor, limit = 20) {
  return db.collection('transactions')
    .find(cursor ? { _id: { $gt: cursor } } : {})
    .limit(limit)
    .toArray()
}
```

## Monitoring

### Web3 Performance Metrics

```javascript
// Track transaction times
const startTime = Date.now()
const tx = await contract.transfer(to, amount)
await tx.wait()
const duration = Date.now() - startTime
console.log(`Transaction took ${duration}ms`)

// Monitor RPC response times
const rpcStart = Date.now()
await provider.getBlockNumber()
const rpcDuration = Date.now() - rpcStart
console.log(`RPC call took ${rpcDuration}ms`)
```

### Frontend Metrics

```javascript
// Use Performance API
performance.mark('start-render')
// ... render logic
performance.mark('end-render')
performance.measure('render-time', 'start-render', 'end-render')

const measure = performance.getEntriesByName('render-time')[0]
console.log(`Render took ${measure.duration}ms`)
```

## Testing Performance

```bash
# Run Hardhat gas reporter
npm install --save-dev hardhat-gas-reporter
# Add to hardhat.config.js:
# gasReporter: { enabled: true }

# Run tests with gas reporting
npx hardhat test

# Benchmark frontend
npx lighthouse http://localhost:3000 --view
```

## Production Checklist

- [ ] Enable production build optimizations
- [ ] Minimize bundle size (< 200KB initial load)
- [ ] Implement code splitting
- [ ] Use CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Optimize images (WebP, lazy loading)
- [ ] Configure caching headers
- [ ] Use service workers for offline support
- [ ] Monitor Core Web Vitals
- [ ] Set up error tracking (Sentry, etc.)
