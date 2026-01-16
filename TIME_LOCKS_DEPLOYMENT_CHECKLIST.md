# Time-Locked Withdrawals - Deployment Checklist

## 📋 Pre-Deployment Phase (Week -1)

### Smart Contract Preparation

- [ ] **Code Review**
  - [ ] Read through [contracts/SpendVault.sol](contracts/SpendVault.sol) time-lock functions
  - [ ] Have security team review multi-guardian freeze logic
  - [ ] Verify NatSpec documentation is complete
  - [ ] Check for any hardcoded values that need parameterization

- [ ] **Testing**
  - [ ] Run unit test suite: `npx hardhat test contracts/SpendVault.timeLocks.test.ts`
  - [ ] Run integration tests: `npx hardhat test contracts/SpendVault.timeLocks.integration.test.ts`
  - [ ] Verify all 26 tests pass
  - [ ] Run coverage report: `npx hardhat coverage`
  - [ ] Target minimum 95% coverage for new functions

- [ ] **Configuration Planning**
  - [ ] [ ] Decide on `timeLockDelay`:
    - [ ] Development: 1 hour (3600 seconds)? _____
    - [ ] Staging: 6 hours (21600 seconds)? _____
    - [ ] Production: 2 days (172800 seconds)? _____
  - [ ] [ ] Decide on `largeTxThreshold`:
    - [ ] ETH amount: _____ ether
    - [ ] Per-token amounts: _________________
  - [ ] [ ] Plan per-token thresholds if needed
  - [ ] [ ] Document all configuration rationale

- [ ] **Security Audit**
  - [ ] Internal security team review complete
  - [ ] All audit findings addressed
  - [ ] Audit report available for stakeholders
  - [ ] Zero critical/high severity issues remain

### Frontend Preparation

- [ ] **Component Testing**
  - [ ] Test `WithdrawalQueue` component with real data
  - [ ] Test `ExecutionCountdown` timer accuracy
  - [ ] Test `GuardianActions` with testnet wallet
  - [ ] Verify dark mode styling
  - [ ] Test responsive design on mobile

- [ ] **API Integration**
  - [ ] Verify `/api/withdrawals/queued` endpoint works
  - [ ] Verify `/api/withdrawals/[id]` endpoint works
  - [ ] Test with real vault contract address
  - [ ] Confirm response formats match expectations
  - [ ] Test error handling and edge cases

- [ ] **Wallet Integration**
  - [ ] Test signature generation (EIP-712)
  - [ ] Test MetaMask wallet integration
  - [ ] Test RainbowKit integration
  - [ ] Verify gas estimation accuracy

### Documentation Preparation

- [ ] **User Guides**
  - [ ] [ ] Write simple "how to queue withdrawal" guide for users
  - [ ] [ ] Write "why your withdrawal was frozen" guide
  - [ ] [ ] Write "guardian responsibilities" guide
  - [ ] [ ] Translate key docs to non-English languages (if applicable)

- [ ] **Internal Docs**
  - [ ] [ ] Guardian team training document
  - [ ] [ ] Ops runbook for emergency procedures
  - [ ] [ ] On-call guide for frozen withdrawals
  - [ ] [ ] Escalation procedures

- [ ] **Public Docs**
  - [ ] [ ] Blog post explaining time-locks feature
  - [ ] [ ] FAQ page for common questions
  - [ ] [ ] Glossary of time-lock terms
  - [ ] [ ] Video tutorial (optional)

---

## 🧪 Staging Deployment Phase (Week 0 - Mon/Tue)

### Testnet Deployment

- [ ] **Contract Deployment**
  - [ ] Deploy to Base Sepolia using deployment script
  - [ ] Verify deployment transaction: `_____________`
  - [ ] Record deployed addresses:
    - [ ] SpendVault: `0x________________________`
    - [ ] GuardianSBT: `0x________________________`
    - [ ] VaultFactory: `0x________________________`
  - [ ] Verify contract code on Basescan
  - [ ] Run initialization script with test thresholds

- [ ] **Testnet Configuration**
  - [ ] Set `timeLockDelay` to 1 hour (3600 seconds)
  - [ ] Set `largeTxThreshold` to 10 ether (for easy testing)
  - [ ] Create test guardian accounts:
    - [ ] Guardian 1: `0x________________________`
    - [ ] Guardian 2: `0x________________________`
    - [ ] Guardian 3: `0x________________________`
  - [ ] Mint guardian tokens to test accounts
  - [ ] Fund test vault with testnet ETH and tokens

- [ ] **Frontend Integration**
  - [ ] Update `.env.local` with testnet contract addresses
  - [ ] Update RPC URLs for testnet
  - [ ] Test all withdrawal queue functionality
  - [ ] Test time-lock countdown timers
  - [ ] Test guardian freeze/unfreeze actions
  - [ ] Verify API endpoints work with testnet vault

### Staging Testing

- [ ] **Happy Path Testing**
  - [ ] Queue a large withdrawal (> 10 ether)
  - [ ] Verify `WithdrawalQueued` event emitted
  - [ ] Check frontend shows pending status
  - [ ] Wait for time-lock to expire (1 hour in staging)
  - [ ] Execute withdrawal and verify funds transferred
  - [ ] Verify `WithdrawalExecuted` event emitted

- [ ] **Guardian Freeze Testing**
  - [ ] Queue new withdrawal
  - [ ] Have Guardian 1 freeze it
  - [ ] Verify status shows frozen on frontend
  - [ ] Have Guardian 2 also freeze it
  - [ ] Verify freeze count shows 2
  - [ ] Have Guardian 1 unfreeze
  - [ ] Verify still frozen (Guardian 2 hasn't unfrozen)
  - [ ] Have Guardian 2 unfreeze
  - [ ] Verify now unfrozen
  - [ ] Execute after time expires

- [ ] **Cancel Testing**
  - [ ] Queue new withdrawal
  - [ ] Have Guardian freeze it
  - [ ] Owner cancels despite freeze
  - [ ] Verify status shows cancelled
  - [ ] Verify can't execute after time expires
  - [ ] Verify `WithdrawalCancelled` event emitted

- [ ] **Configuration Testing**
  - [ ] Update `timeLockDelay` to 30 minutes
  - [ ] Queue new withdrawal with new delay
  - [ ] Verify new withdrawal uses 30 min delay
  - [ ] Update `largeTxThreshold` to 5 ether
  - [ ] Queue 3 ether withdrawal (below new threshold)
  - [ ] Verify auto-executes immediately

- [ ] **API Testing**
  - [ ] Test `/api/withdrawals/queued?vault=0x...`
    - [ ] Returns correct number of withdrawals
    - [ ] Status fields are accurate
    - [ ] Time remaining calculations correct
  - [ ] Test `/api/withdrawals/[id]?vault=0x...`
    - [ ] Returns detailed withdrawal info
    - [ ] Signer list present
    - [ ] Ready date formatted correctly

- [ ] **Edge Cases**
  - [ ] Try to execute before time-lock expires (should fail)
  - [ ] Try non-guardian freeze (should fail)
  - [ ] Try to execute cancelled withdrawal (should fail)
  - [ ] Queue withdrawal with wrong signatures (should fail)
  - [ ] Test with zero recipient address (should fail)
  - [ ] Test with zero amount (should fail)

### Stakeholder Review

- [ ] **Executive Review**
  - [ ] Demo working time-lock on staging
  - [ ] Review security audit results
  - [ ] Discuss configuration choices
  - [ ] Confirm business requirements met
  - [ ] Approve production deployment plan

- [ ] **Team Training**
  - [ ] Guardian team trained on freeze/unfreeze
  - [ ] Ops team trained on monitoring
  - [ ] Support team trained on user questions
  - [ ] Product team familiar with features
  - [ ] All team members can access documentation

---

## 🚀 Production Deployment Phase (Week 0 - Wed/Thu)

### Production Contract Deployment

- [ ] **Pre-Deployment Checks**
  - [ ] Verify all tests passing in CI/CD
  - [ ] Confirm all environment variables set
  - [ ] Backup existing vault state (if upgrading)
  - [ ] Notify guardians of deployment window
  - [ ] Create communication channels for deployment

- [ ] **Deploy to Base Mainnet**
  - [ ] Run production deployment script
  - [ ] Verify deployment transaction: `_____________`
  - [ ] Record deployed addresses:
    - [ ] SpendVault: `0x________________________`
    - [ ] GuardianSBT: `0x________________________`
  - [ ] Wait for 12 block confirmations
  - [ ] Verify code on Basescan
  - [ ] Add contract addresses to frontend `.env.production`

- [ ] **Production Configuration**
  - [ ] Set `timeLockDelay` to production value:
    - [ ] Value: _____ seconds
    - [ ] Tx hash: `_________________________`
  - [ ] Set `largeTxThreshold` to production value:
    - [ ] Value: _____ ether
    - [ ] Tx hash: `_________________________`
  - [ ] Set any per-token thresholds:
    - [ ] Token 1: Address: `0x...` Amount: `_____`
    - [ ] Token 2: Address: `0x...` Amount: `_____`
  - [ ] Mint guardian tokens to production guardians:
    - [ ] Guardian 1: `0x________________________`
    - [ ] Guardian 2: `0x________________________`
    - [ ] Guardian 3: `0x________________________`

- [ ] **Post-Deployment Verification**
  - [ ] Verify all configuration values set correctly
  - [ ] Query contract state and confirm values
  - [ ] Test one small withdrawal end-to-end
  - [ ] Verify events are being emitted
  - [ ] Monitor gas prices - keep record

### Frontend Production Deployment

- [ ] **Build and Deploy**
  - [ ] Update `.env.production` with mainnet addresses
  - [ ] Build production bundle: `npm run build`
  - [ ] Test build locally: `npm run start`
  - [ ] Deploy to production environment
  - [ ] Verify frontend loads without errors

- [ ] **Production Testing**
  - [ ] Smoke test: Load app and verify no errors
  - [ ] Test withdrawal queue displays correctly
  - [ ] Test API endpoints return real data
  - [ ] Test wallet connection with mainnet
  - [ ] Monitor console for any warnings/errors

### Backend Deployment

- [ ] **API Deployment**
  - [ ] Deploy API routes to production
  - [ ] Test `/api/withdrawals/queued?vault=0x...` works
  - [ ] Test `/api/withdrawals/[id]?vault=0x...` works
  - [ ] Verify response times acceptable
  - [ ] Set up monitoring/alerting for endpoints

- [ ] **Monitoring Setup**
  - [ ] Set up event indexing (The Graph or similar)
  - [ ] Configure alerts for `WithdrawalQueued` events
  - [ ] Configure alerts for `WithdrawalFrozen` events
  - [ ] Configure alerts for API errors
  - [ ] Set up dashboard for real-time monitoring

### Communications

- [ ] **Announce to Users**
  - [ ] Blog post published
  - [ ] In-app announcement banner
  - [ ] Email notification to users
  - [ ] Social media announcement
  - [ ] FAQ updated with time-lock info

- [ ] **Guardian Communication**
  - [ ] Send guardian welcome email
  - [ ] Provide guardian runbook
  - [ ] Establish Slack/Discord channel
  - [ ] Schedule training call
  - [ ] Provide emergency contact numbers

---

## 📊 Post-Deployment Phase (Week 1)

### Monitoring & Support

- [ ] **24/7 Monitoring**
  - [ ] Set up on-call rotation
  - [ ] Monitor event emissions
  - [ ] Monitor API response times
  - [ ] Monitor gas prices for operations
  - [ ] Track error rates

- [ ] **Initial Testing with Real Users**
  - [ ] Track first user withdrawals
  - [ ] Monitor guardian freeze/unfreeze actions
  - [ ] Collect user feedback
  - [ ] Monitor for any errors or issues
  - [ ] Be ready to respond to support requests

- [ ] **Performance Monitoring**
  - [ ] Record baseline gas costs for operations
  - [ ] Monitor contract state size
  - [ ] Track API endpoint performance
  - [ ] Monitor frontend load times
  - [ ] Collect metrics on user behavior

### Documentation Updates

- [ ] **User Docs Based on Real Usage**
  - [ ] Update FAQ with real questions
  - [ ] Add screenshots from production
  - [ ] Create how-to videos if helpful
  - [ ] Document any operational gotchas
  - [ ] Update troubleshooting guide

- [ ] **Internal Docs Updates**
  - [ ] Update runbooks with production addresses
  - [ ] Document actual gas costs
  - [ ] Record configuration decisions
  - [ ] Add production monitoring setup
  - [ ] Create incident response procedures

### Issue Tracking

- [ ] **Open Issues/Bugs List**
  - [ ] [  ] Issue: _________________________ Priority: ___
  - [ ] [  ] Issue: _________________________ Priority: ___
  - [ ] [  ] Issue: _________________________ Priority: ___

- [ ] **Enhancement Requests**
  - [ ] [  ] Enhancement: ___________________
  - [ ] [  ] Enhancement: ___________________

---

## ✅ Completion Criteria

### Must Have
- [ ] All 26 tests passing
- [ ] Zero critical security issues
- [ ] Time-lock delay verified working
- [ ] Guardian freeze/unfreeze working
- [ ] Frontend components deployed
- [ ] API endpoints functional
- [ ] Documentation complete
- [ ] Guardian team trained

### Should Have
- [ ] Event indexing set up
- [ ] Monitoring dashboard created
- [ ] User documentation published
- [ ] Video tutorial created
- [ ] Blog post published

### Nice To Have
- [ ] Analytics dashboard for withdrawals
- [ ] Advanced monitoring/alerting
- [ ] Integration with external services
- [ ] Mobile app support

---

## 📞 Support Contacts

**During Deployment**:
- [ ] Tech Lead: _________________ Phone: ____________
- [ ] Devops: _________________ Phone: ____________
- [ ] Product: _________________ Phone: ____________

**For Guardians**:
- [ ] Support Email: _____________________
- [ ] Support Slack: _____________________
- [ ] Emergency Contact: _________________ Phone: ____________

---

## 🔄 Rollback Plan

**If critical issues discovered during Week 1**:

1. [ ] **Immediate Actions**
   - [ ] Stop accepting new withdrawals (if possible)
   - [ ] Notify all users and guardians
   - [ ] Disable frontend if needed
   - [ ] Document issue details

2. [ ] **Analysis**
   - [ ] Identify root cause
   - [ ] Assess impact scope
   - [ ] Determine rollback feasibility

3. [ ] **Rollback Steps**
   - [ ] Deploy previous working version of contract (if possible)
   - [ ] Revert frontend to previous version
   - [ ] Update all documentation
   - [ ] Notify stakeholders

4. [ ] **Post-Rollback**
   - [ ] Conduct post-mortem
   - [ ] Fix identified issues
   - [ ] Plan re-deployment
   - [ ] Enhanced testing before re-deploy

---

## 📝 Sign-Off

- [ ] **Tech Lead Review**: _________________ Date: ______
- [ ] **Security Review**: _________________ Date: ______
- [ ] **Product Approval**: _________________ Date: ______
- [ ] **Executive Approval**: _________________ Date: ______

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Notes**: _________________________________________________

---

For questions during deployment, refer to [TIME_LOCKS_SPEC.md](TIME_LOCKS_SPEC.md) or contact your technical lead.
