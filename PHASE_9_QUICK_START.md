# Phase 9: Quick Start Guide

## What's New?

Four powerful features just shipped:

### 1. 💬 **FAQ Chatbot**
- Floating button on every page (bottom-right)
- Ask questions about vaults, guardians, withdrawals, security
- 18 FAQs with natural language matching
- Quick action buttons for common questions

**Try it:** Click the message icon on this page

### 2. 💡 **Smart Suggestions**
- Personalized recommendations on support page
- "Add Your First Guardian" (if needed)
- "Set Spending Limits" (security tip)
- "Earn Rewards with Referrals" (engagement)

**Find it:** [/support](/support) page - top of FAQ section

### 3. 💰 **Referral Program**
- Earn 5-12% commission on each referral
- 4-tier system: Starter → Friend → Ambassador → Advocate
- Track earnings in real-time
- Share via Twitter, Discord, WhatsApp, or copy link

**Access it:** [/referral-program](/referral-program) from navbar or [click here](/referral-program)

### 4. 🔗 **Updated Navigation**
- New "Referrals" link in main navigation
- FAQ Chatbot globally available
- Smart Suggestions on support pages

---

## How to Use Each Feature

### FAQ Chatbot

**On Desktop:**
1. Look for the floating message bubble (bottom-right)
2. Click it to open the chat window
3. Type your question or click a quick button
4. Get instant answers from our knowledge base

**On Mobile:**
1. Scroll to bottom-right
2. Tap the message button
3. Chat interface adapts to mobile screen
4. Copy answers easily

**Example Questions:**
- "How do I create a vault?"
- "What is a guardian?"
- "How do I withdraw funds?"
- "Is my vault secure?"
- "Can I change my vault settings?"

The chatbot is smart - it understands natural language:
- "How do guardians work?" → Returns guardian FAQ
- "withdraw" → Returns withdrawal instructions
- "security" → Returns security & safety info

### Smart Suggestions

**On Support Page:**
1. Visit [/support](/support)
2. Look at the top of the FAQ section
3. See 3 personalized recommendations
4. Each has an action button (e.g., "Go to Settings")
5. Dismiss unwanted suggestions with X button

**Suggestions Change Based On:**
- Whether you're a new user
- If you've added guardians
- If you've set spending limits
- Your security configuration
- Activity level

### Referral Program

**To Share Your Link:**
1. Go to [/referral-program](/referral-program)
2. See your unique referral URL
3. Click "Copy" button
4. Share on:
   - Twitter/X
   - Discord
   - WhatsApp
   - Email (paste manually)

**To Track Earnings:**
1. View earnings dashboard at top
2. See total earnings and referral count
3. Check progress to next tier (visual bar)
4. View earnings history by type:
   - All Rewards
   - Commissions
   - Tier Bonuses
   - Milestones

**Tier Progression:**
```
Starter (0 referrals)
  → 5% commission, basic support
  
Friend (5 referrals)
  → +$50 bonus, 7% commission, premium support
  
Ambassador (20 referrals)
  → +$200 bonus, 10% commission, VIP treatment, leaderboard
  
Advocate (50 referrals)
  → +$500 bonus, 12% commission, account manager, quarterly bonus
```

**FAQs Section:**
- When do I get paid? (Weekly on Fridays)
- Do referrals have to withdraw? (No, first transaction counts)
- Can I lose tier status? (No, permanent once earned)
- Is there a limit to earnings? (No limits!)

---

## Navigation Changes

### Updated Navbar
**Desktop view now includes:**
- Dashboard
- Analytics
- Guardians
- Voting
- Activity
- Emergency
- **Updates** ← New hub
- **Referrals** ← Brand new
- Blog
- Support

### Mobile Menu
- Same links, responsive layout
- All features accessible on small screens

---

## Integration Map

### Where Things Live

```
FAQ Chatbot
├── Component: /components/faq-chatbot.tsx
├── Location: Global (appears on all pages)
├── Access: Floating button, bottom-right
└── Data: 18 FAQs with NLP matching

Smart Suggestions
├── Component: /components/smart-suggestions.tsx
├── Location: /support page (before FAQ section)
├── Display: 3 personalized recommendations
└── Logic: Based on user context/behavior

Referral Program
├── Page: /app/referral-program/page.tsx
├── Route: /referral-program
├── Access: Navbar → "Referrals"
├── Stats: Earnings, tiers, progression
└── Actions: Copy link, view earnings, share

Updated Navbar
├── File: /components/layout/navbar.tsx
├── Added: "Referrals" link
├── Position: Between "Updates" and "Blog"
└── Mobile: Responsive on all devices
```

---

## Feature Details

### FAQ Database

**18 Comprehensive FAQs covering:**

Getting Started
- What is SpendGuard?
- How do I create a vault?
- How do I enable notifications?

Guardians (3 FAQs)
- What are guardians?
- How do I add a guardian?
- What is a quorum?

Withdrawals (3 FAQs)
- How do I withdraw funds?
- What is a timelock?
- Can I recover a rejected withdrawal?

Security (3 FAQs)
- Can I emergency freeze my vault?
- Is my vault secure?
- What happens if a guardian is unavailable?

Settings & Tokens (2 FAQs)
- How do I change vault settings?
- What tokens does SpendGuard support?

Support
- How do I contact support?
- What is the fee?

### Referral Tier Benefits

| Feature | Starter | Friend | Ambassador | Advocate |
|---------|---------|--------|-----------|----------|
| Commission | 5% | 7% | 10% | 12% |
| Bonus | — | $50 | $200 | $500 |
| Support | Email | Priority | VIP | Dedicated |
| Analytics | Basic | Advanced | Premium | Real-time |
| Community | — | Discord | Leaderboard | Featured |

---

## Tips & Tricks

### For Users
1. **Save time with quick buttons** - Click FAQ button instead of typing
2. **Share your referral link widely** - More referrals = more rewards
3. **Check suggestions regularly** - New recommendations as you use SpendGuard
4. **Copy FAQ answers** - Use the copy button to save answers offline
5. **Track earnings** - Monitor referral progress in dashboard

### For Developers
1. **Add new FAQs** - Update FAQS array in faq-chatbot.tsx
2. **Add NLP keywords** - Update NLP_KEYWORDS object
3. **Customize suggestions** - Edit generateContextualSuggestions() function
4. **Modify tiers** - Update REFERRAL_TIERS array
5. **Connect to API** - Replace hardcoded data with API calls

### For Product Team
1. **Monitor chatbot usage** - Track which FAQs are most asked
2. **Measure referral growth** - Track tier progression rates
3. **Optimize suggestions** - A/B test different recommendation messages
4. **Update content regularly** - Keep FAQs current as product evolves
5. **Celebrate advocates** - Feature top referrers in community

---

## Troubleshooting

### FAQ Chatbot Issues

**Chatbot not showing?**
- ✓ Refresh page (Cmd+Shift+R or Ctrl+Shift+R)
- ✓ Clear browser cache
- ✓ Check if JavaScript enabled
- ✓ Try different browser

**Questions not getting answers?**
- Try different wording
- Use simpler keywords
- Check for typos
- Contact support if still stuck

### Referral Program Issues

**Can't copy link?**
- ✓ Check browser permissions
- ✓ Try different browser
- ✓ Disable browser extensions
- ✓ Contact support@spendguard.io

**Earnings not showing?**
- Wait 24-48 hours for sync
- Verify referrals have transacted
- Check email for updates
- Contact support if missing

### Navigation Issues

**Can't find referrals link?**
- ✓ Refresh page
- ✓ Scroll navbar on mobile
- ✓ Check if logged in
- ✓ Verify account status

**Smart suggestions missing?**
- ✓ Visit /support page specifically
- ✓ Check if above FAQ section
- ✓ Scroll to top of page
- ✓ Clear cache

---

## Next Steps

### For New Users
1. Try the FAQ chatbot - Ask any question
2. Check smart suggestions - Get personalized tips
3. Join the referral program - Start earning immediately
4. Read our docs - Learn more features

### For Existing Users
1. Review new features
2. Share your referral link
3. Use chatbot for quick help
4. Explore referral earning potential

### For Teams
1. Integrate smart suggestions in onboarding
2. Use referral program for growth
3. Monitor FAQ usage for content gaps
4. Optimize user experience based on metrics

---

## Feature Demo

### FAQ Chatbot Demo Convo

**User:** "How do I add guardians?"
**Bot:** Returns FAQ #4 with full instructions

**User:** "guardian voting"
**Bot:** Returns FAQ #5 about quorum and voting

**User:** "thanks"
**Bot:** "You are welcome! Happy to help!"

### Referral Program Demo

- Current Earnings: $29.25
- Referrals: 2 (out of 5 needed for Friend tier)
- Progress: 40% to next tier
- Quick win: 3 more referrals = $50 bonus!

### Smart Suggestions Demo

New user visiting /support sees:
1. "Add Your First Guardian" (HIGH priority)
2. "Set Your Spending Limits" (HIGH priority)
3. "Earn Rewards with Referrals" (MEDIUM priority)

---

## Support

### Getting Help
- **In-app:** Use FAQ chatbot for instant answers
- **Support page:** [/support](/support) with expanded FAQs
- **Email:** support@spendguard.io for complex issues
- **Discord:** Community for peer support
- **Docs:** Full guides at /updates and /feature-releases

### Reporting Issues
- Bug?: Create GitHub issue with details
- Feature request?: Email feature-requests@spendguard.io
- Security?: Report to security@spendguard.io

### Feedback
- Love the features? Share on Twitter/Discord
- Have ideas? We'd love to hear them
- Found a bug? Report via support

---

## Quick Links

| Page | URL | Purpose |
|------|-----|---------|
| FAQ Chatbot | Global | Instant help |
| Referral Program | [/referral-program](/referral-program) | Earn rewards |
| Support Hub | [/support](/support) | Comprehensive help |
| Feature Releases | [/feature-releases](/feature-releases) | What's new |
| Community | [/community](/community) | Connect & share |
| Updates | [/updates](/updates) | News & announcements |
| Security | [/security-advisories](/security-advisories) | Alerts & advisories |

---

**Last Updated:** January 17, 2026  
**Version:** Phase 9  
**Status:** Production Ready ✅

Questions? Use the FAQ chatbot on any page!
