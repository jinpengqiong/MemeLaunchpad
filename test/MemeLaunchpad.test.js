const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemeLaunchpad", function () {
  let MemeFactory, factory;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    MemeFactory = await ethers.getContractFactory("MemeFactory");
    factory = await MemeFactory.deploy();
    await factory.deployed();
  });

  describe("Factory", function () {
    it("Should create a new Meme project", async function () {
      const tx = await factory.connect(addr1).createMeme("Pepe Coin", "PEPE");
      const event = (await tx.wait()).events.find(e => e.event === 'CurveCreated');

      expect(event.args.name).to.equal("Pepe Coin");
      expect(event.args.symbol).to.equal("PEPE");
      expect(event.args.creator).to.equal(addr1.address);

      expect(await factory.totalCurves()).to.equal(1);
    });
  });

  describe("BondingCurve", function () {
    let curve, token;

    beforeEach(async function () {
      const tx = await factory.createMeme("Doge 2.0", "DOG2");
      const event = (await tx.wait()).events.find(e => e.event === 'CurveCreated');
      const curveAddr = event.args.curve;
      const tokenAddr = event.args.token;

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      curve = BondingCurve.attach(curveAddr);

      const MemeToken = await ethers.getContractFactory("MemeToken");
      token = MemeToken.attach(tokenAddr);
    });

    it("Should allow buying tokens and increase price", async function () {
      const initialPrice = await curve.getBuyPrice(ethers.utils.parseEther("1000000"));

      await curve.connect(addr1).buy({ value: ethers.utils.parseEther("1") });

      const tokensBought = await token.balanceOf(addr1.address);
      expect(tokensBought).to.be.gt(0);

      const nextPrice = await curve.getBuyPrice(ethers.utils.parseEther("1000000"));
      expect(nextPrice).to.be.gt(initialPrice);
    });

    it("Should allow selling tokens and return ETH", async function () {
      // First buy
      await curve.connect(addr1).buy({ value: ethers.utils.parseEther("1") });
      const balanceBeforeSell = await ethers.provider.getBalance(addr1.address);
      const tokensToSell = await token.balanceOf(addr1.address);

      // Approve curve to spend tokens
      await token.connect(addr1).approve(curve.address, tokensToSell);

      // Sell
      await curve.connect(addr1).sell(tokensToSell);

      const balanceAfterSell = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfterSell).to.be.gt(balanceBeforeSell);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should emit Migration event when threshold is reached", async function () {
      // This is a simplified test, in reality we need to send enough ETH
      // Threshold is 80 ETH in contract
      await expect(curve.connect(addr2).buy({ value: ethers.utils.parseEther("80") }))
        .to.emit(curve, "Migrated");

      expect(await curve.isMigrated()).to.be.true;
    });
  });
});
