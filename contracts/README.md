# FlashArbX Smart Contract

Production-ready flash loan arbitrage bot for Polygon PoS with Flashbots MEV-Share integration.

## 🚀 Features

- **Free Flash Loans**: Uniswap V3 Flash (0 bps fee)
- **Multi-DEX**: Uniswap V3, QuickSwap V3, SushiSwap V3
- **Flashbots Integration**: MEV-Share for private transactions
- **Security**: ReentrancyGuard, Ownable, strict profit validation
- **Gas Optimization**: Gas price ceiling, authorized bots only
- **Emergency Controls**: Owner can withdraw stuck funds

## 📋 Contract Addresses (Polygon)

| Contract | Address |
|----------|---------|
| FlashArbX | Deploy your own! |
| Uniswap V3 Flash | `0xE592427A0AEce92De3Edee1F18E0157C05861564` |
| Morpho Blue | `0xBBBBBbbBBB9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| Aave V3 Pool | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |

## 🔧 Deployment

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
```

### Deploy to Polygon

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Deploy
forge create \
  --rpc-url $POLYGON_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    0xYOUR_MEV_SHARE_RECIPIENT \
    10000000000000000 \
    50000000000 \
  contracts/FlashArbX.sol:FlashArbX
```

Constructor arguments:
1. `mevShareRecipient`: Address to receive MEV tips (your wallet or Flashbots)
2. `minProfitThreshold`: Minimum profit in wei (e.g., 0.01 MATIC = 10000000000000000)
3. `maxGasPrice`: Maximum gas price in wei (e.g., 50 Gwei = 50000000000)

## 🎮 Usage

### Authorize a Bot

```solidity
flashArbX.setBotAuthorization(0xYOUR_BOT_ADDRESS, true);
```

### Execute Arbitrage

```solidity
ArbParams memory params = ArbParams({
    tokenA: 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619, // WETH
    tokenB: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359, // USDC
    buyRouter: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
    sellRouter: 0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28,
    amountIn: 10 ether,
    minProfit: 10000000000000000, // 0.01 WETH
    buyCalldata: "...",
    sellCalldata: "..."
});

flashArbX.executeArbitrage(params);
```

### Update Parameters

```solidity
// Update minimum profit
flashArbX.setMinProfitThreshold(20000000000000000); // 0.02 MATIC

// Update max gas price
flashArbX.setMaxGasPrice(100000000000); // 100 Gwei

// Update MEV recipient
flashArbX.setMEVShareRecipient(0xNEW_ADDRESS);
```

## 🔒 Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks
2. **Ownable**: Only owner can change parameters
3. **Authorized Bots**: Only authorized addresses can execute trades
4. **Gas Check**: Reverts if gas price is too high
5. **Profit Validation**: Reverts if trade is unprofitable
6. **Emergency Withdraw**: Owner can recover stuck funds

## 📊 Statistics

```solidity
(uint256 trades, uint256 profit, uint256 lastTrade, uint256 minProfit, uint256 maxGas) = flashArbX.getStats();
```

## ⚠️ Important Notes

1. **Test First**: Always test on Polygon Mumbai testnet before mainnet
2. **Start Small**: Begin with small amounts to verify functionality
3. **Monitor Gas**: Polygon gas can spike during high activity
4. **MEV Tips**: 90% of profit goes to validators via MEV-Share
5. **Flash Loans**: Uniswap V3 Flash is free (0 bps), but you must repay in same tx

## 🛠️ Development

### Compile

```bash
forge build
```

### Test

```bash
forge test -vvvv
```

### Verify on Polygonscan

```bash
forge verify-contract \
  --chain-id 137 \
  --num-of-optimizations 200 \
  --constructor-args $(cast abi-encode "constructor(address,uint256,uint256)" 0x... 10000000000000000 50000000000) \
  DEPLOYED_ADDRESS \
  contracts/FlashArbX.sol:FlashArbX
```

## 📚 Resources

- [Flashbots MEV-Share](https://docs.flashbots.net/flashbots-mev-share/overview)
- [Uniswap V3 Flash Loans](https://docs.uniswap.org/contracts/v3/guides/flash-integrations/inheritance-constructors)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Foundry Book](https://book.getfoundry.sh/)

## 🎯 Game Integration

This contract integrates with the FLASH-X game:
- Deploy contract → Unlock "Contract Deployer" achievement
- Execute 10 trades → Unlock "Active Trader" achievement
- Reach $100 profit → Unlock Arbitrum chain
- Track stats in-game via `getStats()` function

## 📄 License

MIT License - See LICENSE file for details
