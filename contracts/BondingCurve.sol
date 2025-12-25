// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MemeToken.sol";

/**
 * @title BondingCurve
 * @dev 处理代币的买卖逻辑，使用恒定乘积公式。
 */
contract BondingCurve is ReentrancyGuard, Ownable {
    // 虚拟储备参数
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 10 亿
    uint256 public constant CURVE_SUPPLY = 800_000_000 * 10**18;  // 8 亿用于曲线交易
    uint256 public constant MIGRATION_THRESHOLD = 80 ether;        // 迁移阈值

    // 虚拟储备 (调整以匹配 80 ETH 募集 800M 代币的目标)
    // (virtualEth) * (virtualToken) = (virtualEth + 80) * (virtualToken - 800M)
    // 20 * 1000M = (20 + 80) * 200M = 100 * 200M = 20000M
    uint256 public constant virtualEthReserves = 20 ether;
    uint256 public constant virtualTokenReserves = 1_000_000_000 * 10**18;

    MemeToken public immutable token;
    uint256 public totalEthRaised;
    uint256 public tokensSold;
    bool public isMigrated;

    event Trade(address indexed user, uint256 ethAmount, uint256 tokenAmount, bool isBuy, uint256 timestamp);
    event Migrated(address indexed token, uint256 ethAmount, uint256 tokenAmount);

    constructor(
        string memory name,
        string memory symbol,
        address creator
    ) Ownable(creator) {
        token = new MemeToken(name, symbol, TOTAL_SUPPLY, address(this));
    }

    /**
     * @dev 获取买入指定数量代币所需支付的 ETH
     */
    function getBuyPrice(uint256 amount) public view returns (uint256) {
        require(amount > 0 && tokensSold + amount <= CURVE_SUPPLY, "Invalid amount");

        uint256 x = virtualEthReserves + totalEthRaised;
        uint256 y = virtualTokenReserves - tokensSold;
        uint256 k = x * y;

        uint256 newY = y - amount;
        uint256 newX = (k + newY - 1) / newY; // Round up

        return newX - x;
    }

    /**
     * @dev 买入代币 (External wrapper)
     */
    function buy() external payable nonReentrant {
        _buy();
    }

    /**
     * @dev 内部买入逻辑
     */
    function _buy() internal {
        require(!isMigrated, "Already migrated");
        require(msg.value > 0, "ETH required");

        uint256 x = virtualEthReserves + totalEthRaised;
        uint256 y = virtualTokenReserves - tokensSold;
        uint256 k = x * y;

        uint256 newX = x + msg.value;
        uint256 newY = k / newX;

        uint256 tokensToBuy = y - newY;

        require(tokensSold + tokensToBuy <= CURVE_SUPPLY, "Exceeds curve supply");

        tokensSold += tokensToBuy;
        totalEthRaised += msg.value;

        token.transfer(msg.sender, tokensToBuy);

        emit Trade(msg.sender, msg.value, tokensToBuy, true, block.timestamp);

        if (totalEthRaised >= MIGRATION_THRESHOLD) {
            _migrate();
        }
    }

    /**
     * @dev 卖出代币
     */
    function sell(uint256 amount) external nonReentrant {
        require(!isMigrated, "Already migrated");
        require(amount > 0 && amount <= token.balanceOf(msg.sender), "Invalid amount");

        uint256 x = virtualEthReserves + totalEthRaised;
        uint256 y = virtualTokenReserves - tokensSold;
        uint256 k = x * y;

        uint256 newY = y + amount;
        uint256 newX = (k + newY - 1) / newY; // Round up

        uint256 ethToReturn = x - newX;

        require(ethToReturn <= totalEthRaised, "Insufficient ETH reserves");

        tokensSold -= amount;
        totalEthRaised -= ethToReturn;

        token.transferFrom(msg.sender, address(this), amount);
        payable(msg.sender).transfer(ethToReturn);

        emit Trade(msg.sender, ethToReturn, amount, false, block.timestamp);
    }

    function _migrate() internal {
        isMigrated = true;
        // 这里的迁移逻辑通常会调用 Uniswap Router
        emit Migrated(address(token), totalEthRaised, token.balanceOf(address(this)));
    }

    receive() external payable {
        _buy();
    }
}
