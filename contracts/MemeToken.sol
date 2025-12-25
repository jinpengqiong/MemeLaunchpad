// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MemeToken
 * @dev 简单的 ERC20 代币，由 MemeFactory 部署。
 * 所有的供应量都会在构造时铸造给创建者（通常是 BondingCurve 合约）。
 */
contract MemeToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply_,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        _mint(creator, totalSupply_);
    }

    /**
     * @dev 销毁代币（由持有者调用）
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }
}
