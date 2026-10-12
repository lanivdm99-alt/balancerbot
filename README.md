# 🎮 FLASH-X - Flash Loan Arbitrage Game

A gamified flash loan arbitrage bot for Polygon PoS with real-time price scanning, achievement system, and Flashbots MEV-Share integration.

## 🚀 Features

### Game Elements
- **Level System**: 7 levels from Newbie to Flash God
- **XP & Achievements**: Earn XP, unlock achievements
- **Streak Tracking**: Track win/loss streaks
- **Capital Growth**: Start with $4, grow to $100+ to unlock Arbitrum
- **Real-time Stats**: Live PnL, win rate, biggest wins

### Technical Features
- **Multi-DEX Scanning**: Uniswap V3, QuickSwap V3, SushiSwap V3
- **Free Flash Loans**: Uniswap V3 Flash (0 bps), Morpho Blue, Aave V3
- **Flashbots Integration**: MEV-Share for private transactions
- **Bitget Wallet**: Connect your wallet directly
- **Real-time Prices**: Live pool scanning every 5 seconds

## 🎯 How to Play

### 1. Connect Wallet
- Click "Connect Wallet" button
- Select Bitget Wallet (or any Web3 wallet)
- Ensure you're on Polygon network

### 2. Start Scanner
- Click "▶ Start Scanner" to begin scanning pools
- Watch for arbitrage opportunities in real-time
- Opportunities show estimated profit after gas + MEV tips

### 3. Execute Trades
- Click "EXECUTE" on profitable opportunities
- 80% simulated success rate
- Earn XP and unlock achievements

### 4. Level Up
- Earn 10 XP per trade, 25 XP per win
- Big wins (>$0.10) give 100 bonus XP
- Unlock new levels and achievements

### 5. Unlock Arbitrum
- Reach $100 capital to unlock Arbitrum chain
- Multi-chain mode activated!

## 📜 Smart Contract

The FlashArbX contract is production-ready and includes:

### Features
- ✅ Free flash loans (Uniswap V3 Flash - 0 bps)
- ✅ Multi-DEX arbitrage execution
- ✅ Flashbots MEV-Share integration (90% tip to validators)
- ✅ ReentrancyGuard protection
- ✅ Owner-controlled parameters
- ✅ Emergency withdrawal functions

### Deployment

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy to Polygon
forge create \
  --rpc-url $POLYGON_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    0xYOUR_MEV_RECIPIENT \
    10000000000000000 \
    50000000000 \
  contracts/FlashArbX.sol:FlashArbX
```

Constructor arguments:
1. `mevShareRecipient`: Address for MEV tips (your wallet or Flashbots)
2. `minProfitThreshold`: Minimum profit in wei (e.g., 0.01 MATIC)
3. `maxGasPrice`: Maximum gas price in wei (e.g., 50 Gwei)

### Usage

```solidity
// Authorize your bot
flashArbX.setBotAuthorization(0xYOUR_BOT, true);

// Execute arbitrage
ArbParams memory params = ArbParams({
    tokenA: WETH_ADDRESS,
    tokenB: USDC_ADDRESS,
    buyRouter: UNISWAP_ROUTER,
    sellRouter: QUICKSWAP_ROUTER,
    amountIn: 10 ether,
    minProfit: 0.01 ether,
    buyCalldata: "...",
    sellCalldata: "..."
});

flashArbX.executeArbitrage(params);
```

## 🔗 Flashbots Integration

### MEV-Share
The contract integrates with Flashbots MEV-Share for private transaction submission:

- **90% of profit** goes to validators via MEV tips
- **Private transactions** avoid front-running
- **Faster inclusion** in blocks
- **Better execution** prices

### Setup
1. Get Flashbots API key from [flashbots.net](https://flashbots.net)
2. Set `mevShareRecipient` to your Flashbots address
3. Contract automatically sends 90% of profit as MEV tip

### Resources
- [Flashbots Documentation](https://docs.flashbots.net/)
- [MEV-Boost](https://boost.flashbots.net/)
- [MEV-Share Guide](https://docs.flashbots.net/flashbots-mev-share/overview)

## 🎮 Achievements

| Icon | Name | Description |
|------|------|-------------|
| 🎯 | First Blood | Execute your first trade |
| 🔥 | Hot Streak | Win 10 trades in a row |
| 💰 | Double Down | Reach $10 capital |
| 💎 | Half Way | Reach $50 capital |
| 👑 | Century Club | Reach $100 capital |
| 🐋 | Big Fish | Single trade profit > $0.50 |
| ⚡ | Speed Demon | 5 trades in 1 minute |
| ✨ | Perfect 10 | 100% win rate over 10 trades |
| 🔍 | Pool Scanner | Scan 1000 pools |
| 🌐 | Multi-Chain | Unlock Arbitrum |
| 📜 | Contract Deployer | Deploy FlashArbX contract |
| 🤖 | Flashbots Pro | Use MEV-Share integration |

## 📊 Game Stats

Track your progress:
- **Level**: Current level and XP progress
- **Capital**: Starting $4, current balance
- **Win Rate**: Percentage of successful trades
- **Streak**: Current and best win streaks
- **Biggest Win**: Largest single trade profit
- **Total Trades**: Number of trades executed

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Compile Contract
```bash
forge build
```

### Test Contract
```bash
forge test -vvvv
```

## ⚠️ Important Notes

1. **Start Small**: Begin with $4 and grow gradually
2. **Test First**: Always test on Polygon Mumbai before mainnet
3. **Monitor Gas**: Polygon gas can spike during high activity
4. **MEV Tips**: 90% of profit goes to validators
5. **Flash Loans**: Free but must be repaid in same transaction
6. **Risk**: This is a game with simulated trades - real trading involves risk

## 🔒 Security

The contract includes multiple security features:
- ✅ ReentrancyGuard prevents reentrancy attacks
- ✅ Ownable restricts admin functions
- ✅ Authorized bots only can execute trades
- ✅ Gas price ceiling prevents overpaying
- ✅ Profit validation ensures profitable trades only
- ✅ Emergency withdrawal for stuck funds

## 📚 Resources

### Documentation
- [Polygon Documentation](https://docs.polygon.technology/)
- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Flashbots Docs](https://docs.flashbots.net/)
- [Foundry Book](https://book.getfoundry.sh/)

### Tools
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity IDE
- [Polygonscan](https://polygonscan.com/) - Block Explorer
- [Alchemy](https://www.alchemy.com/) - RPC Provider

### Community
- [Flashbots Forum](https://collective.flashbots.net/)
- [Polygon Discord](https://discord.gg/polygon)
- [Uniswap Discord](https://discord.gg/uniswap)

## 🎯 Roadmap

- [ ] Real trade execution (not simulated)
- [ ] Multi-chain support (Arbitrum, Optimism)
- [ ] Advanced strategies (triangular arbitrage)
- [ ] Leaderboard system
- [ ] NFT achievements
- [ ] DAO governance

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Credits

Built with:
- [React](https://react.dev/) - UI Framework
- [Vite](https://vitejs.dev/) - Build Tool
- [Ethers.js](https://ethers.org/) - Ethereum Library
- [Foundry](https://getfoundry.sh/) - Smart Contract Development
- [Flashbots](https://flashbots.net/) - MEV Infrastructure

---

**Start with $4, grow to $100, unlock Arbitrum, become a Flash God!** 🚀
