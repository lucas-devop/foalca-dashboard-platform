import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider/dist/umd/index.min.js";
import PoolOverview from "./components/PoolOverview";
import BurnScheduler from "./components/BurnScheduler";
import DynamicFeesToggle from "./components/DynamicFeesToggle";
import SendFromPool from "./components/SendFromPool";
import RefillPool from "./components/RefillPool";
import SetGlobalFee from "./components/SetGlobalFee";
import DistributeDevFunds from "./components/DistributeDevFunds";
import Approvals from "./components/Approvals";
import FeeExemptions from "./components/FeeExemptions";
import ApproverManager from "./components/ApproverManager";
import Footer from "./components/Footer";
import "./styles/dashboard.css";
import logo from "./assets/logo.png";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "./config/contract";

const allSections = [
  { id: "overview", title: "📊 Pool Overview", component: PoolOverview },
  { id: "burn", title: "🔥 Burn Scheduler", component: BurnScheduler },
  { id: "dynamic", title: "⚖️ Dynamic Fees", component: DynamicFeesToggle },
  { id: "send", title: "📤 Send From Pool", component: SendFromPool },
  { id: "refill", title: "🔁 Refill Pool", component: RefillPool },
  { id: "fees", title: "💸 Set Global Fee", component: SetGlobalFee },
  { id: "devfunds", title: "🚀 Distribute Development Funds", component: DistributeDevFunds },
  { id: "approvals", title: "📜 Approvals", component: Approvals },
  { id: "exemptions", title: "🛡️ Fee Exemptions", component: FeeExemptions, ownerOnly: true },
  { id: "approvers", title: "🔐 Manage Approvers", component: ApproverManager, ownerOnly: true },
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isApprover, setIsApprover] = useState(false);
  const [openSection, setOpenSection] = useState("overview");
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          validateAccess(newProvider, accounts[0]);
        }
      });

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          validateAccess(newProvider, accounts[0]);
        } else {
          setAddress(null);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!provider || (!isApprover && address?.toLowerCase() !== owner)) return;

    const interval = setInterval(() => {
      fetchPendingProposals();
    }, 5000);

    fetchPendingProposals();

    return () => clearInterval(interval);
  }, [provider, isApprover, owner, address]);

  const fetchPendingProposals = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const count = await contract.proposalCounter();

      let pending = 0;
      for (let i = 0; i < count; i++) {
        const [, , executed, rejected] = await contract.getProposal(i);
        if (!executed && !rejected) pending++;
      }

      setPendingCount(pending);
    } catch (err) {
      console.error("Error fetching pending proposals:", err);
    }
  };

  const validateAccess = async (provider, account) => {
  try {
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
    const ownerAddress = await contract.owner();
    const isApproved = await contract.isApprover(account.toLowerCase());

    if (account.toLowerCase() === ownerAddress.toLowerCase() || isApproved) {
      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAddress(account);
      setOwner(ownerAddress.toLowerCase());
      setIsApprover(isApproved);
      setAccessDenied(false);
    } else {
      setAddress(null);
      setAccessDenied(true);
      setTimeout(() => {
        window.location.href = "https://forallcases.com";
      }, 2500);
    }
  } catch (err) {
    console.error("Access validation failed:", err);
    setAddress(null);
    setAccessDenied(true);
    setTimeout(() => {
      window.location.href = "https://forallcases.com";
    }, 2500);
  }
};

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAddress(null);
    setAccessDenied(false);
  };

  async function connectWallet(wallet) {
    if (!window.ethereum) return alert("No Ethereum provider found.");

    let providerToUse = null;

    if (window.ethereum.providers?.length) {
      for (const p of window.ethereum.providers) {
        if (wallet === 'metamask' && p.isMetaMask) providerToUse = p;
        if (wallet === 'coinbase' && p.isCoinbaseWallet) providerToUse = p;
        if (wallet === 'trust' && p.isTrust) providerToUse = p;
      }
    } else {
      providerToUse = window.ethereum;
    }

    if (!providerToUse) {
      alert(`Selected wallet (${wallet}) not found!`);
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(providerToUse);
      const signer = await ethersProvider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      setProvider(ethersProvider);
      setSigner(signer);
      setContract(contract);
      setAddress(walletAddress);
      validateAccess(ethersProvider, walletAddress);
      setIsWalletModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to connect to ${wallet}.`);
    }
  }

  async function connectWalletConnect() {
    try {
      const wcProvider = new WalletConnectProvider({
        rpc: {
          56: "https://bsc-dataseed.binance.org/"
        }
      });

      await wcProvider.enable();
      const ethersProvider = new ethers.BrowserProvider(wcProvider);
      const signer = await ethersProvider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      setProvider(ethersProvider);
      setSigner(signer);
      setContract(contract);
      setAddress(walletAddress);
      validateAccess(ethersProvider, walletAddress);
      setIsWalletModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to connect via WalletConnect.");
    }
  }

  const visibleSections = allSections.filter(
    (section) => !section.ownerOnly || (address && owner && address.toLowerCase() === owner)
  );

  return (
    <div className="dashboard-wrapper">
      {pendingCount > 0 && (isApprover || address?.toLowerCase() === owner) && (
        <div className="pending-banner">
          🚨 {pendingCount} proposal{pendingCount !== 1 ? "s" : ""} awaiting approval!
        </div>
      )}

      <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: pendingCount > 0 ? "2.5rem" : 0 }}>
        <img src={logo} alt="Foalca Logo" style={{ height: "60px", borderRadius: "8px" }} />
        FOALCA Admin Dashboard
      </h1>

      <div className="wallet-actions">
        {!address ? (
          <button onClick={() => setIsWalletModalOpen(true)} className="glow-btn primary">🔗 Connect Wallet</button>
        ) : (
          <>
            <div className="status-box">✅ Connected: {address}</div>
            <button onClick={disconnectWallet} className="glow-btn danger">✖️ Disconnect</button>
          </>
        )}
      </div>

      {isWalletModalOpen && (
        <div className="wallet-modal">
          <div className="wallet-modal-content">
            <h2>Connect Wallet</h2>
            <div className="wallet-options">
              <div className="wallet-option" onClick={() => connectWallet('metamask')}>
                <img src="/metamask-icon.png" alt="MetaMask" />
                <span>MetaMask</span>
              </div>
              <div className="wallet-option" onClick={() => connectWallet('coinbase')}>
                <img src="/coinbase-icon.png" alt="Coinbase Wallet" />
                <span>Coinbase Wallet</span>
              </div>
              <div className="wallet-option" onClick={() => connectWallet('trust')}>
                <img src="/trustwallet-icon.png" alt="Trust Wallet" />
                <span>Trust Wallet</span>
              </div>
              <div className="wallet-option" onClick={connectWalletConnect}>
                <img src="/walletconnect-icon.png" alt="WalletConnect" />
                <span>WalletConnect (QR)</span>
              </div>
              <button className="glow-btn danger" style={{ marginTop: "15px" }} onClick={() => setIsWalletModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {accessDenied && (
        <div className="status-box" style={{ marginTop: "1rem", color: "red" }}>
          ⛔ Access denied: Only team can access the dashboard. Redirecting...
        </div>
      )}

      {address && !accessDenied && (
        <>
          <div className="dashboard-grid">
            {visibleSections.map(({ id, title, component: Component }) => (
              <div key={id} className="extension-panel">
                <div
                  className="section-header"
                  onClick={() => setOpenSection(openSection === id ? null : id)}
                  style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "0.5rem" }}
                >
                  {title}
                  {id === "approvals" && pendingCount > 0 && (
                    <span className="badge">{pendingCount}</span>
                  )}
                  {openSection === id ? " ▲" : " ▼"}
                </div>
                {openSection === id && (
                  <div className="section-content">
                    <Component provider={provider} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Footer provider={provider} />
        </>
      )}
    </div>
  );
}
