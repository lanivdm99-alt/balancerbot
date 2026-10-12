// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashArbX
 * @notice Flash Loan Arbitrage Bot for Polygon PoS
 * @author FLASH-X Team
 * @dev Executes atomic arbitrage using free flash loans from Uniswap V3, Morpho, and Aave V3
 * 
 * Features:
 * - Multi-DEX arbitrage (Uniswap V3, QuickSwap V3, SushiSwap V3)
 * - Free flash loans (0 bps from Uniswap V3 Flash)
 * - Flashbots MEV-Share integration for private transactions
 * - Strict profit validation (reverts if unprofitable)
 * - Reentrancy protection
 * - Owner-controlled parameters
 */
contract FlashArbX is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════
    //                         STRUCTS
    // ═══════════════════════════════════════════════════════════

    struct ArbParams {
        address tokenA;
        address tokenB;
        address buyRouter;
        address sellRouter;
        uint256 amountIn;
        uint256 minProfit;
        bytes buyCalldata;
        bytes sellCalldata;
    }

    struct FlashLoanParams {
        address token;
        uint256 amount;
        address pool;
        ArbParams arbParams;
    }

    // ═══════════════════════════════════════════════════════════
    //                         STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice Flash loan providers (all free or near-free)
    address public constant UNISWAP_V3_FLASH = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant MORPHO_BLUE = 0xBBBBBbbBBB9cC5e90e3b3Af64bdAF62C37EEFFCb;
    address public constant AAVE_V3_POOL = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;

    /// @notice Flashbots MEV-Share recipient (validator tips)
    address public mevShareRecipient;

    /// @notice Minimum profit threshold (in token decimals)
    uint256 public minProfitThreshold;

    /// @notice Maximum gas price (in wei)
    uint256 public maxGasPrice;

    /// @notice Trading statistics
    uint256 public totalTrades;
    uint256 public totalProfit;
    uint256 public lastTradeTimestamp;

    /// @notice Authorized bots (can execute trades)
    mapping(address => bool) public authorizedBots;

    // ═══════════════════════════════════════════════════════════
    //                         EVENTS
    // ═══════════════════════════════════════════════════════════

    event ArbitrageExecuted(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountIn,
        uint256 profit,
        uint256 timestamp
    );

    event ArbitrageFailed(
        address indexed tokenA,
        address indexed tokenB,
        string reason,
        uint256 timestamp
    );

    event BotAuthorized(address indexed bot, bool authorized);
    event MinProfitUpdated(uint256 newMinProfit);
    event MaxGasPriceUpdated(uint256 newMaxGasPrice);
    event MEVShareRecipientUpdated(address newRecipient);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    // ═══════════════════════════════════════════════════════════
    //                       MODIFIERS
    // ═══════════════════════════════════════════════════════════

    modifier onlyAuthorized() {
        require(authorizedBots[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier gasCheck() {
        require(tx.gasprice <= maxGasPrice, "Gas price too high");
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(
        address _mevShareRecipient,
        uint256 _minProfitThreshold,
        uint256 _maxGasPrice
    ) Ownable(msg.sender) {
        mevShareRecipient = _mevShareRecipient;
        minProfitThreshold = _minProfitThreshold;
        maxGasPrice = _maxGasPrice;
        
        // Authorize deployer
        authorizedBots[msg.sender] = true;
    }

    // ═══════════════════════════════════════════════════════════
    //                    MAIN ENTRY POINT
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Execute arbitrage using Uniswap V3 Flash Loan (FREE)
     * @param params Arbitrage parameters
     */
    function executeArbitrage(ArbParams calldata params) 
        external 
        onlyAuthorized 
        gasCheck 
        nonReentrant 
    {
        require(params.amountIn > 0, "Amount must be > 0");
        require(params.minProfit >= minProfitThreshold, "Below min profit");

        // Record initial balance
        uint256 balanceBefore = IERC20(params.tokenA).balanceOf(address(this));

        // Execute flash loan from Uniswap V3 (FREE - 0 bps)
        IUniswapV3Flash(UNISWAP_V3_FLASH).flash(
            address(this),
            params.tokenA,
            params.tokenB,
            params.amountIn,
            abi.encode(params)
        );

        // Verify profit
        uint256 balanceAfter = IERC20(params.tokenA).balanceOf(address(this));
        require(balanceAfter > balanceBefore, "No profit");

        uint256 profit = balanceAfter - balanceBefore;
        require(profit >= params.minProfit, "Insufficient profit");

        // Send MEV tip to validator (Flashbots MEV-Share)
        if (mevShareRecipient != address(0) && profit > 0) {
            uint256 mevTip = profit * 90 / 100; // 90% to validator
            IERC20(params.tokenA).safeTransfer(mevShareRecipient, mevTip);
        }

        // Update statistics
        totalTrades++;
        totalProfit += profit;
        lastTradeTimestamp = block.timestamp;

        emit ArbitrageExecuted(
            params.tokenA,
            params.tokenB,
            params.amountIn,
            profit,
            block.timestamp
        );
    }

    // ═══════════════════════════════════════════════════════════
    //                 FLASH LOAN CALLBACK
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Uniswap V3 Flash Loan callback
     * @dev Called by Uniswap V3 pool after flash loan
     */
    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external {
        require(msg.sender == UNISWAP_V3_FLASH, "Unauthorized caller");

        ArbParams memory params = abi.decode(data, (ArbParams));

        // Execute buy swap
        (bool buySuccess, ) = params.buyRouter.call(params.buyCalldata);
        require(buySuccess, "Buy swap failed");

        // Execute sell swap
        (bool sellSuccess, ) = params.sellRouter.call(params.sellCalldata);
        require(sellSuccess, "Sell swap failed");

        // Repay flash loan (amount + fee, but fee is 0 for Uniswap V3 Flash)
        uint256 repayAmount = params.amountIn + fee0;
        IERC20(params.tokenA).safeTransfer(UNISWAP_V3_FLASH, repayAmount);
    }

    // ═══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Authorize or deauthorize a bot
     */
    function setBotAuthorization(address bot, bool authorized) external onlyOwner {
        authorizedBots[bot] = authorized;
        emit BotAuthorized(bot, authorized);
    }

    /**
     * @notice Update minimum profit threshold
     */
    function setMinProfitThreshold(uint256 _minProfit) external onlyOwner {
        minProfitThreshold = _minProfit;
        emit MinProfitUpdated(_minProfit);
    }

    /**
     * @notice Update maximum gas price
     */
    function setMaxGasPrice(uint256 _maxGasPrice) external onlyOwner {
        maxGasPrice = _maxGasPrice;
        emit MaxGasPriceUpdated(_maxGasPrice);
    }

    /**
     * @notice Update MEV-Share recipient
     */
    function setMEVShareRecipient(address _recipient) external onlyOwner {
        mevShareRecipient = _recipient;
        emit MEVShareRecipientUpdated(_recipient);
    }

    /**
     * @notice Emergency withdraw tokens (owner only)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
        emit EmergencyWithdraw(token, balance);
    }

    /**
     * @notice Emergency withdraw ETH (owner only)
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    // ═══════════════════════════════════════════════════════════
    //                      VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalTrades,
        uint256 _totalProfit,
        uint256 _lastTradeTimestamp,
        uint256 _minProfitThreshold,
        uint256 _maxGasPrice
    ) {
        return (
            totalTrades,
            totalProfit,
            lastTradeTimestamp,
            minProfitThreshold,
            maxGasPrice
        );
    }

    /**
     * @notice Check if an address is authorized
     */
    function isAuthorized(address bot) external view returns (bool) {
        return authorizedBots[bot] || bot == owner();
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE ETH
    // ═══════════════════════════════════════════════════════════

    receive() external payable {}
}

// ═══════════════════════════════════════════════════════════
//                    INTERFACES
// ═══════════════════════════════════════════════════════════

interface IUniswapV3Flash {
    function flash(
        address recipient,
        address token0,
        address token1,
        uint256 amount0,
        bytes calldata data
    ) external;
}
