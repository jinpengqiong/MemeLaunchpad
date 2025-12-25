# 🚀 Meme Launchpad

一个基于 Bonding Curve 机制的 Meme 代币发射平台，支持公平发行、自动做市和流动性迁移。

## 📋 项目简介

Meme Launchpad 是一个去中心化的代币发行平台，采用恒定乘积（Constant Product）算法实现 Bonding Curve 定价机制。用户可以：

- 🎨 **创建 Meme 代币**：无需编程知识，一键发行 ERC20 代币
- 💰 **公平交易**：基于数学曲线的自动定价，无需流动性池
- 🔄 **自动迁移**：达到募资目标后自动迁移至 Uniswap（待实现）
- 📊 **实时价格**：根据供需关系动态调整代币价格

## ✨ 核心功能

### 1. Bonding Curve 机制

- **虚拟储备**：20 ETH 虚拟储备 + 10 亿代币虚拟储备
- **交易供应**：8 亿代币用于曲线交易
- **迁移阈值**：募集 80 ETH 后触发自动迁移
- **定价公式**：`x * y = k`（恒定乘积）

### 2. 代币经济学

- **总供应量**：10 亿代币
- **曲线供应**：8 亿代币（80%）
- **保留供应**：2 亿代币（20%，用于流动性池）
- **初始价格**：由虚拟储备比例决定

### 3. 安全特性

- ✅ 重入攻击保护（ReentrancyGuard）
- ✅ 所有权管理（Ownable）
- ✅ 精确数学计算（向上取整防止套利）
- ✅ OpenZeppelin 标准合约

## 🏗️ 技术架构

### 智能合约

```
contracts/
├── MemeFactory.sol      # 工厂合约，负责创建新的 Meme 项目
├── BondingCurve.sol     # Bonding Curve 合约，处理买卖逻辑
└── MemeToken.sol        # ERC20 代币合约
```

### 前端应用

```
frontend/
├── src/
│   ├── App.jsx          # 主应用组件
│   └── main.jsx         # 入口文件
├── index.html
└── vite.config.js       # Vite 配置
```

### 技术栈

- **智能合约**：Solidity ^0.8.20
- **开发框架**：Hardhat
- **前端框架**：React 18 + Vite
- **Web3 库**：ethers.js v5
- **标准库**：OpenZeppelin Contracts v5

## 🚀 快速开始

### 前置要求

- Node.js >= 16.x
- pnpm（推荐）或 npm
- MetaMask 或其他 Web3 钱包

### 安装依赖

```bash
# 安装根目录依赖（Hardhat + 合约）
pnpm install

# 安装前端依赖
cd frontend
pnpm install
```

### 编译合约

```bash
# 编译智能合约
npx hardhat compile

# 查看编译产物
ls artifacts/contracts/
```

### 运行测试

```bash
# 运行测试用例
npx hardhat test

# 查看测试覆盖率
npx hardhat coverage
```

### 本地部署

```bash
# 启动本地 Hardhat 节点
npx hardhat node

# 在新终端部署合约
npx hardhat run scripts/deploy.js --network localhost
```

### 启动前端

```bash
cd frontend
pnpm dev
```

访问 `http://localhost:5173` 查看应用。

## 📝 合约详解

### MemeFactory.sol

工厂合约，负责创建和管理所有 Meme 项目。

**主要功能**：
- `createMeme(name, symbol)`：创建新的 Meme 项目
- `getAllCurves()`：获取所有已创建的项目列表
- `totalCurves()`：获取项目总数

**事件**：
```solidity
event CurveCreated(
    address indexed curve,
    address indexed token,
    string name,
    string symbol,
    address creator
);
```

### BondingCurve.sol

核心交易合约，实现 Bonding Curve 定价机制。

**主要功能**：
- `buy()`：买入代币（支付 ETH）
- `sell(amount)`：卖出代币（获得 ETH）
- `getBuyPrice(amount)`：查询买入价格

**关键参数**：
```solidity
uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;  // 10 亿
uint256 public constant CURVE_SUPPLY = 800_000_000 * 10**18;    // 8 亿
uint256 public constant MIGRATION_THRESHOLD = 80 ether;         // 80 ETH
uint256 public constant virtualEthReserves = 20 ether;          // 虚拟 ETH
uint256 public constant virtualTokenReserves = 1_000_000_000 * 10**18; // 虚拟代币
```

**定价公式**：
```
(virtualEth + totalEthRaised) * (virtualToken - tokensSold) = k

买入价格 = newX - x
卖出价格 = x - newX
```

### MemeToken.sol

标准 ERC20 代币合约。

**主要功能**：
- 标准 ERC20 功能（transfer、approve、transferFrom 等）
- `burn(amount)`：销毁代币

## 🔧 开发指南

### 环境变量配置

创建 `.env` 文件：

```env
# 私钥（用于部署）
PRIVATE_KEY=your_private_key_here

# Infura/Alchemy API Key（用于测试网/主网部署）
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key

# Etherscan API Key（用于合约验证）
ETHERSCAN_API_KEY=your_etherscan_key
```

### 部署到测试网

```bash
# 部署到 Sepolia 测试网
npx hardhat run scripts/deploy.js --network sepolia

# 验证合约
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### 与合约交互

```javascript
// 使用 Hardhat Console
npx hardhat console --network localhost

// 获取合约实例
const Factory = await ethers.getContractFactory("MemeFactory");
const factory = await Factory.attach("FACTORY_ADDRESS");

// 创建新的 Meme 项目
const tx = await factory.createMeme("MyMeme", "MEME");
await tx.wait();
```

## 📊 使用示例

### 创建 Meme 代币

```javascript
// 连接到 MemeFactory 合约
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

// 创建新代币
const tx = await factory.createMeme("Doge Moon", "DMOON");
const receipt = await tx.wait();

// 从事件中获取新创建的合约地址
const event = receipt.events.find(e => e.event === 'CurveCreated');
const curveAddress = event.args.curve;
```

### 买入代币

```javascript
// 连接到 BondingCurve 合约
const curve = new ethers.Contract(curveAddress, curveABI, signer);

// 查询买入价格
const price = await curve.getBuyPrice(ethers.utils.parseEther("1000000"));

// 买入代币
const tx = await curve.buy({ value: price });
await tx.wait();
```

### 卖出代币

```javascript
// 授权合约转移代币
const token = new ethers.Contract(tokenAddress, tokenABI, signer);
await token.approve(curveAddress, amount);

// 卖出代币
const tx = await curve.sell(amount);
await tx.wait();
```

## 🗺️ 开发路线图

### ✅ Phase 1: 核心功能（已完成）
- [x] Bonding Curve 合约实现
- [x] MemeFactory 工厂合约
- [x] 基础前端界面
- [x] 买卖功能

### 🚧 Phase 2: 流动性迁移（进行中）
- [ ] Uniswap V2/V3 集成
- [ ] 自动流动性添加
- [ ] LP Token 分配逻辑
- [ ] 迁移事件监听

### 📋 Phase 3: 功能增强（计划中）
- [ ] 代币元数据（图标、描述）
- [ ] 社交功能（评论、点赞）
- [ ] 排行榜和趋势
- [ ] 高级图表和分析

### 🔮 Phase 4: 生态扩展（未来）
- [ ] 多链支持（BSC、Polygon 等）
- [ ] DAO 治理
- [ ] NFT 集成
- [ ] 移动端应用

## 🧪 测试

```bash
# 运行所有测试
npx hardhat test

# 运行特定测试文件
npx hardhat test test/BondingCurve.test.js

# 查看 Gas 使用情况
REPORT_GAS=true npx hardhat test

# 生成覆盖率报告
npx hardhat coverage
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## ⚠️ 免责声明

本项目仅供学习和研究使用。在生产环境中使用前，请务必：

- 进行完整的安全审计
- 充分测试所有功能
- 了解相关法律法规
- 评估金融风险

**投资有风险，参与需谨慎！**

