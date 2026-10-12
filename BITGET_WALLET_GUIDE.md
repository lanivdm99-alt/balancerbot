# 🟡 Bitget Wallet Integration Guide

## Overview

FLASH-X now features full Bitget Wallet extension integration with automatic Polygon network detection and switching.

## ✨ Features

### 1. **Auto-Detection**
- Automatically detects Bitget Wallet extension
- Falls back to other Web3 wallets if Bitget not available
- Shows wallet availability on welcome screen

### 2. **Network Switching**
- Automatically switches to Polygon Mainnet (Chain ID: 137)
- Adds Polygon network if not already configured
- Prevents wrong network errors

### 3. **Real-Time Updates**
- Live balance tracking
- Account change detection
- Network change detection

### 4. **Visual Indicators**
- 🟡 Bitget Wallet icon in header
- Purple POLYGON network badge
- Green connection status
- Real-time balance display

---

## 🚀 How to Connect

### Step 1: Install Bitget Wallet

**If you don't have Bitget Wallet installed:**

1. Visit [Bitget Wallet Download](https://web3.bitget.com/en/wallet-download)
2. Choose your browser (Chrome, Firefox, Edge, Brave)
3. Install the extension
4. Create or import your wallet
5. **Refresh the FLASH-X page**

### Step 2: Connect to FLASH-X

1. Click **"🟡 Connect Bitget"** button
2. Or click **"START GAME"** on welcome screen
3. Approve the connection in Bitget Wallet popup
4. Wallet auto-switches to Polygon network
5. You're connected! 🎉

### Step 3: Start Playing

- Your wallet address appears in header
- Balance shows in wallet panel
- Polygon network badge appears
- Start scanning for arbitrage opportunities!

---

## 🔧 Technical Details

### Wallet Detection

```typescript
// Detects multiple wallet namespaces
const getAvailableWallets = () => {
  const wallets = [];
  
  // Bitget Wallet (primary)
  if (window.bitkeep?.ethereum) {
    wallets.push({
      name: 'Bitget Wallet',
      provider: window.bitkeep.ethereum,
      icon: '🟡'
    });
  }
  
  // Bitget Wallet (alternate)
  if (window.bitget?.ethereum) {
    wallets.push({
      name: 'Bitget Wallet',
      provider: window.bitget.ethereum,
      icon: '🟡'
    });
  }
  
  // MetaMask fallback
  if (window.ethereum?.isMetaMask) {
    wallets.push({
      name: 'MetaMask',
      provider: window.ethereum,
      icon: '🦊'
    });
  }
  
  return wallets;
};
```

### Network Switching

```typescript
// Auto-switch to Polygon
const switchToPolygon = async (provider) => {
  try {
    // Try to switch first
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }] // 137 in hex
    });
  } catch (error) {
    // If not added, add it
    if (error.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: ['https://polygon-rpc.com'],
          blockExplorerUrls: ['https://polygonscan.com']
        }]
      });
    }
  }
};
```

### Event Listeners

```typescript
// Listen for account changes
provider.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    // User disconnected
    setWalletConnected(false);
  } else {
    // Account changed
    setWalletAddress(accounts[0]);
    updateBalance(accounts[0]);
  }
});

// Listen for network changes
provider.on('chainChanged', () => {
  // Reload page on network switch
  window.location.reload();
});
```

---

## 🎮 Game Integration

### Wallet Panel (Left Sidebar)

Shows:
- **Address**: Truncated wallet address (0x1234...5678)
- **Balance**: Real-time MATIC balance
- **Network**: Always shows "Polygon PoS"
- **Status**: Green "✓ Connected" indicator

### Header Indicators

- **🟡 Wallet Icon**: Shows Bitget Wallet is connected
- **Address**: Truncated address (0x1234...5678)
- **POLYGON Badge**: Purple badge with pulse animation
- **Capital**: Green capital display

### Welcome Screen

**If Bitget Wallet detected:**
```
✅ Wallet detected! Ready to connect.
[🚀 START GAME]
```

**If Bitget Wallet NOT detected:**
```
⚠️ Bitget Wallet extension not detected
[📥 Install Bitget Wallet]
After installation, refresh this page
```

---

## 🔒 Security Features

### 1. **No Private Key Storage**
- FLASH-X never stores your private keys
- All transactions signed in Bitget Wallet
- You approve every transaction

### 2. **Network Enforcement**
- Auto-switches to Polygon only
- Prevents accidental mainnet transactions
- Clear network indicators

### 3. **Transaction Approval**
- Every trade requires your approval
- Clear transaction details in wallet popup
- You can reject any transaction

### 4. **Balance Protection**
- Starting capital: $4.00 (simulated)
- Real wallet balance shown separately
- No automatic spending

---

## 📊 What You'll See

### Connected State

**Header:**
```
[POLYGON] [LVL 1 Newbie] [💎 $4.00] [🟡 0x1234...5678]
```

**Left Sidebar:**
```
🟡 Bitget Wallet
├─ Address: 0x1234...5678
├─ Balance: 4.0000 MATIC
├─ Network: Polygon PoS
└─ Status: ✓ Connected

🌐 Network
├─ Block: #52,345,678
├─ Gas: 30.5 Gwei
└─ Arbitrum: 🔒 $96.00 to unlock
```

### Welcome Screen (Connected)

```
🎮 Welcome to FLASH-X
The Ultimate Flash Loan Arbitrage Game

🟡 Bitget Wallet
✅ Wallet detected! Ready to connect.
[🚀 START GAME]

[Game Info Cards]
```

### Welcome Screen (Not Connected)

```
🎮 Welcome to FLASH-X
The Ultimate Flash Loan Arbitrage Game

🟡 Bitget Wallet
⚠️ Bitget Wallet extension not detected
[📥 Install Bitget Wallet]
After installation, refresh this page

[Game Info Cards]
```

---

## 🛠️ Troubleshooting

### "No wallet detected"

**Solution:**
1. Install Bitget Wallet extension
2. Create or import wallet
3. **Refresh the page**
4. Try connecting again

### "Failed to switch network"

**Solution:**
1. Open Bitget Wallet
2. Manually add Polygon network:
   - Network Name: Polygon Mainnet
   - RPC URL: https://polygon-rpc.com
   - Chain ID: 137
   - Symbol: MATIC
   - Block Explorer: https://polygonscan.com
3. Try connecting again

### "Connection rejected"

**Solution:**
1. You clicked "Reject" in wallet popup
2. Click "Connect" again
3. Approve the connection

### "Wrong network"

**Solution:**
1. FLASH-X auto-switches to Polygon
2. If it fails, switch manually in Bitget Wallet
3. Look for purple "POLYGON" badge in header

### Balance not updating

**Solution:**
1. Check you're on Polygon network
2. Refresh the page
3. Disconnect and reconnect wallet
4. Check Bitget Wallet balance directly

---

## 🎯 Best Practices

### 1. **Always Verify Network**
- Look for purple "POLYGON" badge
- Check wallet shows Polygon
- Never trade on wrong network

### 2. **Monitor Balance**
- Watch your MATIC balance
- Starting capital is $4 (simulated)
- Real wallet balance shown separately

### 3. **Approve Carefully**
- Read transaction details
- Check gas fees
- Only approve trades you understand

### 4. **Keep Extension Updated**
- Update Bitget Wallet regularly
- New features and security patches
- Better compatibility

---

## 🔗 Resources

### Bitget Wallet
- [Download](https://web3.bitget.com/en/wallet-download)
- [Documentation](https://bitgetwallet.zendesk.com/hc/en-us)
- [Support](https://t.me/Bitget_Wallet)

### Polygon
- [Website](https://polygon.technology/)
- [Documentation](https://docs.polygon.technology/)
- [Block Explorer](https://polygonscan.com/)
- [Bridge](https://wallet.polygon.technology/polygon/bridge)

### FLASH-X
- [GitHub Repository](https://github.com/your-repo/flash-x)
- [Smart Contract](./contracts/FlashArbX.sol)
- [Flashbots Integration](./FLASHBOTS_INTEGRATION.md)

---

## 🎮 Quick Start Checklist

- [ ] Install Bitget Wallet extension
- [ ] Create or import wallet
- [ ] Add MATIC tokens (for gas)
- [ ] Visit FLASH-X game
- [ ] Click "Connect Bitget"
- [ ] Approve connection
- [ ] Verify Polygon network
- [ ] Start scanning for opportunities
- [ ] Execute trades
- [ ] Grow from $4 to $100
- [ ] Unlock Arbitrum!

---

## 💡 Pro Tips

### 1. **Use a Dedicated Wallet**
- Create a new wallet for FLASH-X
- Don't use your main wallet
- Limit risk exposure

### 2. **Start Small**
- Begin with $4 starting capital
- Test with small trades
- Learn the mechanics first

### 3. **Monitor Gas**
- Check gas prices before trading
- Avoid high gas periods
- Use gas tracker in dashboard

### 4. **Track Progress**
- Watch your level increase
- Unlock achievements
- Aim for $100 to unlock Arbitrum

### 5. **Stay Secure**
- Never share private keys
- Verify transaction details
- Use official Bitget Wallet only

---

## 🚀 What's Next?

After connecting your Bitget Wallet:

1. **Start Scanner** - Begin scanning for arbitrage
2. **Execute Trades** - Click EXECUTE on opportunities
3. **Earn XP** - Level up through trades
4. **Unlock Achievements** - Collect all 12 achievements
5. **Reach $100** - Unlock Arbitrum chain
6. **Deploy Contract** - Use FlashArbX.sol for real trading

---

## 📞 Support

### Bitget Wallet Issues
- [Bitget Support](https://t.me/Bitget_Wallet)
- [Documentation](https://bitgetwallet.zendesk.com/)

### FLASH-X Issues
- Check [README.md](./README.md)
- Review [FLASHBOTS_INTEGRATION.md](./FLASHBOTS_INTEGRATION.md)
- Open GitHub issue

### Network Issues
- [Polygon Status](https://polygonscan.com/)
- [Gas Tracker](https://polygonscan.com/gastracker)
- [RPC Status](https://polygon.technology/polygon-status)

---

**Happy Trading! 🟡💎**

Connect your Bitget Wallet and start your journey to Flash God status!
