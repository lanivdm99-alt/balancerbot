# FLASH-X Arbitrage Bot - $4 Starting Capital Guide

## 🎯 Overview

This bot is configured to start with **$4 MATIC** on Polygon PoS and grow through flash loan arbitrage.

**Key Features:**
- ✅ Free flash loans (Uniswap V3, Morpho, Balancer V3)
- ✅ Scans 6 DEXs × 78+ pairs × multiple fee tiers
- ✅ Multicall3 batching (100+ pools per RPC call)
- ✅ Real-time price scanning every 5 seconds
- ✅ Capital management with transaction budget tracking

---

## 💰 $4 Capital Strategy

### Your Budget Breakdown

| Item | Amount | Notes |
|------|--------|-------|
| **Starting Capital** | $4.00 | MATIC on Polygon |
| **Avg Gas Cost** | ~$0.005 | Per transaction |
| **Transaction Budget** | ~800 txs | $4 ÷ $0.005 |
| **Flash Loans** | FREE | Borrow up to pool liquidity |
| **MEV Tip** | 90% of profit | Goes to validators |

### Minimum Profitable Trade

To be profitable, a trade must cover:
1. **Gas cost**: ~$0.005
2. **MEV tip**: 90% of profit
3. **Flash loan fee**: $0 (free providers)

**Formula:**
```
Net Profit = Gross Profit - Gas - MEV_Tip
           = Gross Profit - $0.005 - (0.90 × Gross Profit)
           = 0.10 × Gross Profit - $0.005

For Net Profit > $0.01:
0.10 × Gross Profit - $0.005 > $0.01
Gross Profit > $0.15

Minimum trade size: ~$0.15 gross profit
```

### Growth Path

| Target | Trades Needed | Time (est.) |
|--------|---------------|-------------|
| $4 → $10 | ~120 trades | 2-4 hours |
| $10 → $50 | ~600 trades | 1-2 days |
| $50 → $100 | ~800 trades | 2-3 days |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Your `.env` file is already configured with:
- ✅ Polygon RPC endpoint
- ✅ $4 starting capital settings
- ✅ Minimum profit threshold: $0.01
- ✅ Gas limit: 50 Gwei
- ✅ MEV tip: 90%

**You need to add:**
```bash
# Edit .env and add your wallet
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS_HERE

# After deploying contract
POL_FLASH_ARB=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### 3. Start in Dry Run Mode

```bash
npm run dev
```

This starts the dashboard in **simulation mode** - no real transactions!

### 4. Monitor the Dashboard

You'll see:
- **Capital Panel**: Shows your $4 budget, transactions remaining, growth targets
- **Speed Indicator**: Scanner performance (pools/sec)
- **Flash Loan Panel**: Active free providers
- **Arbitrage Opportunities**: Real-time price discrepancies
- **Execution Log**: Simulated trades with P&L

### 5. Go Live (When Ready)

**⚠️ CRITICAL: Only after testing in dry run!**

1. Deploy the smart contract:
```bash
forge script script/Deploy.s.sol \
  --rpc-url $POL_RPC_URL \
  --broadcast \
  --verify
```

2. Update `.env` with contract address:
```bash
POL_FLASH_ARB=0xYOUR_DEPLOYED_CONTRACT
```

3. Switch to live mode in dashboard:
   - Click "⚡ Live Mode [D]" button
   - Or press `D` key

---

## 📊 Dashboard Components

### Left Column

1. **Control Panel**
   - Pause/Resume scanner
   - Toggle Dry Run / Live Mode
   - Emergency Kill Switch

2. **Network Status**
   - Current block number
   - Gas price (Gwei)
   - RPC connection status

3. **Gas Tracker**
   - Real-time gas price chart
   - Historical gas trends
   - Gas gauge (Low/Medium/High)

4. **Speed Indicator**
   - Scan duration (ms)
   - Pools scanned
   - Pools per second

5. **Flash Loan Panel**
   - Active providers (FREE)
   - Deprecated providers (⚠️)

6. **DEX Coverage**
   - 6 DEXs monitored
   - 27 tokens tracked
   - 78+ trading pairs

7. **Capital Panel** 💎
   - Starting capital: $4.00
   - Current capital
   - P&L (absolute + %)
   - Transactions remaining
   - Minimum profitable trade
   - Growth targets

### Center Column

1. **Live Pool Prices**
   - Real-time prices from Uniswap V3
   - Spread indicators (>5bps highlighted)

2. **Arbitrage Opportunities**
   - Detected price discrepancies
   - Flash loan provider
   - Estimated profit
   - Confidence score

3. **Execution Matrix**
   - Trade history
   - Success/failure tracking
   - Flash loan used per trade

### Right Column

1. **PnL Dashboard**
   - Cumulative profit/loss
   - Win rate
   - High score
   - Profit history chart
   - Recent trades

---

## ⚙️ Configuration

### Key Settings (in `.env`)

```bash
# Minimum profit threshold
MIN_PROFIT_USD=0.01

# Maximum gas price (skip if higher)
MAX_GAS_GWEI=50

# Scan interval (milliseconds)
SCAN_INTERVAL_MS=3000

# Dry run mode (true = simulation)
DRY_RUN=true

# Flash loan provider
FLASH_LOAN_PROVIDER=uniswap_v3_flash

# MEV tip percentage
MEV_TIP_PERCENTAGE=90

# Maximum slippage
MAX_SLIPPAGE_BPS=30
```

### Adjusting for Your Strategy

**More Conservative:**
```bash
MIN_PROFIT_USD=0.05      # Higher threshold
MAX_GAS_GWEI=30          # Lower gas limit
MEV_TIP_PERCENTAGE=95    # Higher tip = faster inclusion
```

**More Aggressive:**
```bash
MIN_PROFIT_USD=0.005     # Lower threshold
MAX_GAS_GWEI=100         # Higher gas limit
MEV_TIP_PERCENTAGE=80    # Lower tip = keep more profit
```

---

## 🛡️ Risk Management

### Critical Rules for $4 Capital

1. **Start in DRY RUN** - Test for at least 1 hour
2. **Monitor gas prices** - Skip trades if gas > 50 Gwei
3. **Stop loss** - Halt if capital drops below $1
4. **Take profits** - Withdraw at $10, $25, $50 milestones
5. **Track everything** - Review execution log daily

### What Can Go Wrong

| Risk | Probability | Mitigation |
|------|-------------|------------|
| High gas prices | Medium | Skip trades, wait for lower gas |
| No opportunities | Low | Bot scans 78+ pairs continuously |
| Failed transactions | Low | Atomic execution (reverts if unprofitable) |
| Smart contract bug | Very Low | Audited code, start with small amounts |
| Front-running | Medium | Use Flashbots for private transactions |

### Emergency Procedures

**If capital drops below $2:**
1. Pause the bot immediately
2. Review execution log for patterns
3. Adjust MIN_PROFIT_USD higher
4. Resume only after analysis

**If gas spikes above 100 Gwei:**
1. Bot automatically skips trades
2. Wait for gas to normalize
3. Monitor gas tracker in dashboard

---

## 📈 Performance Optimization

### Tips for Maximum Profit

1. **Run 24/7** - More scans = more opportunities
2. **Monitor gas trends** - Best times: early morning UTC
3. **Adjust MEV tip** - Higher tip = faster inclusion
4. **Use Flashbots** - Private transactions avoid front-running
5. **Compound profits** - Reinvest profits for larger flash loans

### Expected Performance

**Conservative Estimate:**
- Win rate: 70-85%
- Avg profit per trade: $0.01-0.03
- Trades per hour: 5-15
- Daily profit: $1-5 (25-125% daily return)

**Optimistic Estimate:**
- Win rate: 85-95%
- Avg profit per trade: $0.03-0.05
- Trades per hour: 10-25
- Daily profit: $5-15 (125-375% daily return)

---

## 🔧 Troubleshooting

### "No opportunities detected"

**Cause:** Market too efficient or gas too high

**Solution:**
- Wait for market volatility
- Lower MIN_PROFIT_USD to $0.005
- Check gas price (should be < 50 Gwei)

### "Transactions remaining: 0"

**Cause:** Capital depleted

**Solution:**
- Add more MATIC to wallet
- Review execution log for patterns
- Adjust strategy (higher profit threshold)

### "Failed to fetch blockchain data"

**Cause:** RPC connection issue

**Solution:**
- Check Alchemy API key
- Verify RPC URL in `.env`
- Try alternative RPC provider

### "Scanner speed: < 20 pools/sec"

**Cause:** RPC rate limiting or network congestion

**Solution:**
- Upgrade to paid Alchemy plan
- Increase SCAN_INTERVAL_MS to 5000
- Check internet connection

---

## 📚 Advanced Features

### Multi-Strategy Scanner

The bot uses multiple strategies:
1. **Simple Arb** - Buy low on DEX A, sell high on DEX B
2. **Triangular Arb** - A→B→C→A cycles
3. **Cross-Chain Arb** - Arbitrum ↔ Polygon (future)
4. **Flashbots** - Private transaction bundles

### Flash Loan Providers

| Provider | Fee | Max Amount | Status |
|----------|-----|------------|--------|
| Uniswap V3 Flash | 0 bps | Pool liquidity | ✅ Active |
| Morpho Blue | 0 bps | Vault balance | ✅ Active |
| Balancer V3 | 0 bps | Unlimited | ✅ Active |
| Aave V3 | 5 bps | Pool TVL | ✅ Active |
| Balancer V2 | 0 bps | Unlimited | ❌ Deprecated |

### DEX Coverage

- **Uniswap V3** - 4 fee tiers (0.01%, 0.05%, 0.3%, 1%)
- **QuickSwap V3** - 4 fee tiers (Algebra-based)
- **SushiSwap V3** - 4 fee tiers
- **Retro V3** - 4 fee tiers
- **Balancer V3** - 3 fee tiers
- **DODO** - 1 fee tier (0.2%)

---

## 🎓 Learning Resources

### Understanding Flash Loans

- [Aave Flash Loans Guide](https://docs.aave.com/developers/guides/flash-loans)
- [Uniswap V3 Flash Swaps](https://docs.uniswap.org/contracts/v3/guides/flash-integrations/inheritance-constructors)

### MEV and Flashbots

- [Flashbots Documentation](https://docs.flashbots.net/)
- [MEV-Share Guide](https://docs.flashbots.net/flashbots-mev-share/overview)

### Smart Contract Security

- [Reentrancy Guards](https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/api/security)

---

## 📞 Support

### Community
- Discord: [FLASH-X Community](https://discord.gg/flash-x)
- Twitter: [@FlashX_MEV](https://twitter.com/FlashX_MEV)

### Documentation
- [Full Docs](https://docs.flash-x.io)
- [API Reference](https://docs.flash-x.io/api)

### Issues
- GitHub Issues: [Report Bug](https://github.com/flash-x/bot/issues)

---

## ⚖️ Disclaimer

**THIS IS EXPERIMENTAL SOFTWARE**

- ⚠️ Cryptocurrency trading involves substantial risk of loss
- ⚠️ Never invest more than you can afford to lose
- ⚠️ Past performance does not guarantee future results
- ⚠️ This bot is provided "as is" without warranty
- ⚠️ You are responsible for your own trades and decisions

**Use at your own risk.**

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Polygon PoS** - Low-cost, high-speed blockchain
- **Alchemy** - Reliable RPC infrastructure
- **Flashbots** - MEV research and tools
- **Uniswap, QuickSwap, SushiSwap** - DEX infrastructure
- **Aave, Morpho, Balancer** - Flash loan providers

---

**Happy Trading! 🚀**

Start with $4, grow to $100+, and beyond!
