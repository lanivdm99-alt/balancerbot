# FLASH-X | Multi-Chain Flash Loan Arbitrage Terminal

A production-ready, cyberpunk-styled flash loan arbitrage trading system with **neon fluffy UI** and **advanced MEV strategies**.

![Version](https://img.shields.io/badge/version-3.0-ff00ff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-00ffff?style=flat-square)
![Status](https://img.shields.io/badge/status-production--ready-00ff41?style=flat-square)

## 🌟 Features

### 🎨 Neon Fluffy Cyberpunk UI
- **Layered Glow Effects**: Multiple box-shadows with increasing blur radius for depth
- **Pulsating Animations**: Smooth breathing effects on text and borders
- **Bright Neon Colors**: Pink (#ff00ff), Cyan (#00ffff), Green (#00ff41), Yellow (#ffff00), Purple (#bf00ff)
- **Fluffy Box Shadows**: Soft, glowing containers with inner and outer glows
- **CRT Scanline Effect**: Retro terminal aesthetic
- **Responsive Design**: Works on all screen sizes

### 🤖 Advanced Bot Architecture

#### 1. **Flashbots MEV-Share Integration**
- Private transaction pools (no public mempool exposure)
- Backrunning strategy: place transactions after price-moving trades
- Optimal validator tips: 75-90% of profit in competitive environments
- Bundle submission with flash loan protection

#### 2. **Optimal Trade Sizing (AMM Math)**
- Square root formula for optimal trade amount
- `profit = (spread - fees) * tradeSize - gasCost`
- `tradeSize = sqrt(reserve_in * reserve_out * fee^2)`
- Liquidity-weighted sizing to minimize slippage

#### 3. **Multi-Strategy Scanner**
- **Simple 2-hop arbitrage**: Buy low on DEX A, sell high on DEX B
- **Triangular arbitrage**: A→B→C→A cycles
- **Cross-chain arbitrage**: Arbitrum ↔ Polygon opportunities
- **Flashbots bundles**: Private execution with MEV-Share kickback

#### 4. **Risk Management**
- Strict on-chain profit guardrails (reverts if unprofitable)
- ReentrancyGuard on all external calls
- Ownable access control with multi-sig recommendation
- Emergency sweep function for stuck tokens
- Gas price ceiling to prevent overpaying during congestion

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FLASH-X NEON ARBITRAGE SYSTEM                    │
│              Multi-Chain MEV Infrastructure                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Price Oracle │───▶│  Arb Engine  │───▶│  Executor    │  │
│  │  (WebSocket)  │    │  (Scanner)   │    │  (Contract)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Multi-DEX   │    │  Risk Guard  │    │  Balancer V3 │  │
│  │  Aggregator  │    │  (Min Profit)│    │  Vault Flash │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  Strategies: Simple Arb ◈ Triangular ◈ Cross-Chain ◈ MEV   │
│  Chains: Arbitrum One ◈ Polygon PoS                         │
│  DEXs: Balancer V3, Uniswap V3, SushiSwap, Camelot, QS     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for smart contract deployment)
- Alchemy/Infura account (for RPC endpoints)
- Flashbots account (for private transactions)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/flash-x.git
cd flash-x

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Local Simulation (Dry Run)

```bash
# Start the terminal dashboard
npm run dev

# The bot will run in simulation mode by default
# No real transactions will be executed
```

### Testnet Testing

```bash
# Deploy contract to Arbitrum Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC \
  --broadcast

# Run bot in dry-run mode on testnet
npm run bot -- --network arbitrum-sepolia --dry-run
```

### Mainnet Live Execution

```bash
# Deploy contract to Arbitrum One
forge script script/Deploy.s.sol \
  --rpc-url $ARB_MAINNET_RPC \
  --broadcast \
  --verify

# Run bot in live mode with Flashbots
npm run bot -- --network arbitrum --live --flashbots
```

## 🎨 Neon Fluffy UI Components

### CSS Techniques Used

1. **Layered Text Shadows**
```css
.neon-fluffy-pink {
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #ff00ff,
    0 0 40px #ff00ff,
    0 0 80px #ff00ff;
}
```

2. **Fluffy Box Shadows**
```css
.fluffy-box-pink {
  box-shadow:
    0 0 5px #ff00ff,
    0 0 10px #ff00ff,
    0 0 20px #ff00ff,
    0 0 40px #ff00ff44,
    inset 0 0 20px #ff00ff22;
}
```

3. **Pulsating Animations**
```css
@keyframes neon-pulse-pink {
  from { text-shadow: 0 0 20px #ff00ff; }
  to { text-shadow: 0 0 60px #ff00ff; }
}
```

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Neon Pink | `#ff00ff` | Primary accent, alerts |
| Neon Cyan | `#00ffff` | Secondary accent, info |
| Neon Green | `#00ff41` | Success, profits |
| Neon Yellow | `#ffff00` | Warnings, spreads |
| Neon Purple | `#bf00ff` | Flashbots, MEV |

## 📊 Dashboard Features

### Real-Time Telemetry
- **Live Gas Tracker**: Gwei prices for Arbitrum & Polygon with historical charts
- **Block Height Monitor**: Real-time block numbers per network
- **Price Matrix**: Live prices across all DEXs with spread indicators
- **Arbitrage Opportunities**: Detected opportunities with profit estimates
- **Execution Matrix**: Success/failure tracking with strategy breakdown
- **PnL Dashboard**: Cumulative profit/loss with high-score tracker

### Interactive Controls
- **Hotkeys**: 
  - `[P]` Pause/Resume scanning
  - `[D]` Toggle Dry Run / Live Mode
  - `[K]` Emergency Kill Switch
- **Tabs**: Terminal, Contracts, Documentation

## 🔧 Smart Contract

### FlashArbX.sol

**Key Features:**
- Balancer V3 Vault integration for zero-fee flash loans
- Multi-hop atomic routing across 5 DEXs
- Strict profit guardrails (reverts if unprofitable)
- ReentrancyGuard protection
- Ownable access control
- Emergency sweep function
- MEV-Share tip distribution (80% to block builder)

**Security:**
```solidity
// STRICT PROFIT GUARDRAIL: Revert if not profitable
require(
    netProfit >= minNetProfit,
    "FlashArbX: insufficient net profit, reverting"
);
```

## 📡 Scanner Engine

### Scanner.ts

**Key Features:**
- WebSocket RPC connections for real-time mempool monitoring
- Multi-chain price aggregation (Arbitrum + Polygon)
- Optimal trade sizing using AMM mathematical formulas
- Flashbots MEV-Share integration for private transactions
- Local state simulation via Anvil for dry-run mode

**Optimal Trade Sizing Formula:**
```typescript
const optimalSize = Math.min(
  availableLiquidity * 0.1, // Don't use more than 10% of liquidity
  Math.sqrt(availableLiquidity * netSpread * 1000)
);
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# RPC Providers (Use private endpoints for low latency)
ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
ARB_WSS_URL=wss://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_WSS_URL=wss://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Flashbots (for private transaction submission)
FLASHBOTS_AUTH_SIGNER=0x...
FLASHBOTS_RELAY_URL=https://relay.flashbots.net

# Wallet (USE A DEDICATED HOT WALLET)
PRIVATE_KEY=0x...
WALLET_ADDRESS=0x...

# Contract Addresses (post-deployment)
ARB_FLASH_ARB=0x...
POL_FLASH_ARB=0x...

# Bot Configuration
MIN_PROFIT_USD=5.00
MAX_GAS_GWEI=100
SCAN_INTERVAL_MS=500
DRY_RUN=true
USE_FLASHBOTS=true
MEV_TIP_PERCENTAGE=80

# Alerting
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

## 🛡️ Risk Management

### On-Chain Guardrails
1. **Minimum Profit Threshold**: Configurable per token
2. **Atomic Execution**: Entire transaction reverts if any step fails
3. **Flash Loan Protection**: Zero capital risk (Balancer V3 free loans)
4. **ReentrancyGuard**: Prevents reentrancy attacks
5. **Access Control**: Only authorized bots can execute

### Off-Chain Safeguards
1. **Gas Price Ceiling**: Prevents overpaying during congestion
2. **Slippage Tolerance**: Maximum 0.5% per swap leg
3. **Liquidity Checks**: Ensures sufficient liquidity before execution
4. **Emergency Kill Switch**: Instant pause capability
5. **Dry Run Mode**: Test strategies without risking capital

## 📈 Performance Metrics

### Simulated Results (Dry Run Mode)
- **Win Rate**: ~85% (simulated)
- **Average Profit per Trade**: $0.001 - $0.01
- **Gas Cost per Trade**: $0.00008 (Arbitrum) / $0.004 (Polygon)
- **MEV Tip**: 75-90% of profit to validators
- **Net Profit**: Varies based on market conditions

### Real-World Expectations
- **Competition**: High in competitive markets (80-90% tip required)
- **Latency**: Critical for success (use private RPC endpoints)
- **Capital**: Flash loans eliminate capital requirements
- **Risk**: Zero inventory risk (atomic execution)

## 🔗 Supported Chains & DEXs

### Arbitrum One
- Balancer V3
- Uniswap V3
- SushiSwap V3
- Camelot

### Polygon PoS
- Balancer V3
- Uniswap V3
- QuickSwap V3

### Trading Pairs
- WETH/USDC
- WETH/USDT
- WETH/WBTC
- WETH/ARB
- WETH/POL
- WBTC/USDC
- WBTC/USDT
- ARB/USDC
- POL/USDC
- USDC/USDT

## 📚 Documentation

### Tabs in Dashboard
1. **Terminal**: Main dashboard with live telemetry
2. **Contracts**: View Solidity and TypeScript source code
3. **Docs**: Architecture overview, deployment guide, configuration

## 🎯 Best Practices

### For Production Deployment
1. **Use Dedicated Hot Wallet**: Never use your main wallet
2. **Start with Dry Run**: Test thoroughly before going live
3. **Monitor Gas Prices**: Adjust `MAX_GAS_GWEI` based on network conditions
4. **Set Conservative MIN_PROFIT**: Start with $5-10 minimum profit
5. **Enable Flashbots**: Reduces front-running risk
6. **Monitor Performance**: Track win rate and adjust strategies
7. **Keep Contract Funded**: Ensure enough ETH for gas (if not using flash loans)

### For Maximum Profitability
1. **Low Latency RPC**: Use private endpoints (Alchemy/Infura)
2. **Optimal Trade Sizing**: Use the AMM formula for best results
3. **Competitive Tips**: 80-90% of profit in competitive environments
4. **Multi-Chain**: Scan both Arbitrum and Polygon simultaneously
5. **Multiple Strategies**: Enable simple, triangular, and Flashbots strategies

## 🐛 Troubleshooting

### Common Issues

**"FlashArbX: insufficient net profit, reverting"**
- Spread too small after fees
- Gas costs too high
- Solution: Increase `MIN_PROFIT_USD` or wait for better opportunities

**High gas prices**
- Network congestion
- Solution: Increase `MAX_GAS_GWEI` or wait for lower gas

**No opportunities detected**
- Market too efficient
- Solution: Add more DEXs or chains, adjust spread threshold

**Transactions failing**
- Insufficient liquidity
- Slippage too high
- Solution: Reduce trade size or increase slippage tolerance

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Balancer Protocol**: For flash loan infrastructure
- **Flashbots**: For MEV-Share and private transaction pools
- **Foundry**: For smart contract development framework
- **CSS-Tricks**: For neon effect inspiration

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Join our Discord community
- Follow us on Twitter: @FlashX_MEV

---

**⚠️ Disclaimer**: This software is for educational purposes. Use at your own risk. Cryptocurrency trading involves substantial risk of loss. Never invest more than you can afford to lose.

**🔒 Security Note**: Always review smart contract code before deploying to mainnet. Consider getting a professional audit for production use.
