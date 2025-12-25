import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// 简化的 ABI，仅包含演示所需的方法
const FACTORY_ABI = [
  "function createMeme(string name, string symbol) external returns (address)",
  "function getAllCurves() external view returns (address[])",
  "event CurveCreated(address indexed curve, address indexed token, string name, string symbol, address creator)"
];

const CURVE_ABI = [
  "function buy() external payable",
  "function sell(uint256 amount) external",
  "function getBuyPrice(uint256 amount) public view returns (uint256)",
  "function totalEthRaised() public view returns (uint256)",
  "function tokensSold() public view returns (uint256)",
  "function token() public view returns (address)"
];

export default function App() {
  const [account, setAccount] = useState(null);
  const [factoryAddress, setFactoryAddress] = useState("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  }

  async function fetchMemes() {
    if (!factoryAddress) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    const curveAddresses = await factory.getAllCurves();

    const details = await Promise.all(curveAddresses.map(async (addr) => {
      const curve = new ethers.Contract(addr, CURVE_ABI, provider);
      const raised = await curve.totalEthRaised();
      return { address: addr, raised: ethers.utils.formatEther(raised) };
    }));

    setMemes(details);
  }

  async function createMeme(name, symbol) {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
      const tx = await factory.createMeme(name, symbol);
      await tx.wait();
      fetchMemes();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 Meme Launchpad Demo</h1>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected: {account}</p>
      )}

      <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>Create New Meme</h3>
        <input placeholder="Factory Address" value={factoryAddress} onChange={e => setFactoryAddress(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
        <button onClick={() => createMeme("Test Token", "TEST")} disabled={loading || !factoryAddress}>
          {loading ? "Creating..." : "Launch Token (Test/TEST)"}
        </button>
      </div>

      <div>
        <h3>Live Projects</h3>
        <button onClick={fetchMemes}>Refresh List</button>
        <div style={{ marginTop: '10px' }}>
          {memes.map((m, i) => (
            <div key={i} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
              <p>Curve: {m.address}</p>
              <p>Raised: {m.raised} ETH</p>
              <button onClick={async () => {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const curve = new ethers.Contract(m.address, CURVE_ABI, signer);
                await curve.buy({ value: ethers.utils.parseEther("0.1") });
              }}>Buy 0.1 ETH Worth</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
