// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BondingCurve.sol";

/**
 * @title MemeFactory
 * @dev 用于创建和管理 Meme 项目的工厂合约。
 */
contract MemeFactory {
    address[] public allCurves;
    mapping(address => bool) public isCurve;

    event CurveCreated(address indexed curve, address indexed token, string name, string symbol, address creator);

    /**
     * @dev 创建一个新的 Meme 项目
     * @param name 代币名称
     * @param symbol 代币符号
     */
    function createMeme(string memory name, string memory symbol) external returns (address) {
        BondingCurve newCurve = new BondingCurve(name, symbol, msg.sender);
        address curveAddr = address(newCurve);

        allCurves.push(curveAddr);
        isCurve[curveAddr] = true;

        emit CurveCreated(curveAddr, address(newCurve.token()), name, symbol, msg.sender);

        return curveAddr;
    }

    /**
     * @dev 获取已创建的项目数量
     */
    function totalCurves() external view returns (uint256) {
        return allCurves.length;
    }

    /**
     * @dev 获取所有项目列表
     */
    function getAllCurves() external view returns (address[] memory) {
        return allCurves;
    }
}
