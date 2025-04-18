import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
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
  { id: "overview", title: "\ud83d\udcca Pool Overview", component: PoolOverview },
  { id: "burn", title: "\ud83d\udd25 Burn Scheduler", component: BurnScheduler },
  { id: "dynamic", title: "\u2696\ufe0f Dynamic Fees", component: DynamicFeesToggle },
  { id: "send", title: "\ud83d\udce4 Send From Pool", component: SendFromPool },
  { id: "refill", title: "\ud83d\udd01 Refill Pool", component: RefillPool },
  { id: "fees", title: "\ud83d\udcb8 Set Global Fee", component: SetGlobalFee },
  { id: "devfunds", title: "\ud83d\ude80 Distribute Development Funds", component: DistributeDevFunds },
  { id: "approvals", title: "\ud83d\udcdc Approvals", component: Approvals },
  { id: "exemptions", title: "\ud83d\udee1\ufe0f Fee Exemptions", component: FeeExemptions, ownerOnly: true },
  { id: "approvers", title: "\ud83d\udd10 Manage Approvers", component: ApproverManager, ownerOnly: true },
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isApprover, setIsApprover] = useState(false);
  const [openSection, setOpenSection] = useState("overview");
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          validateAccess(newProvider, accounts[0]);
        } else {
          setCheckingAccess(false);
        }
      });

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          validateAccess(newProvider, accounts[0]);
        } else {
          setAddress(null);
        }
      });
    } else {
      setCheckingAccess(false);
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
    setCheckingAccess(true);
    try {
      const readOnlyProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, readOnlyProvider);

      const ownerAddress = await readOnlyContract.owner();
      const isApproved = await readOnlyContract.isApprover(account);

      if (account.toLowerCase() === ownerAddress.toLowerCase() || isApproved) {
        setProvider(provider);
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
    } finally {
      setCheckingAccess(false);
    }
  };

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found.");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    validateAccess(new ethers.BrowserProvider(window.ethereum), accounts[0]);
  }

  function disconnectWallet() {
    setAddress(null);
    setAccessDenied(false);
  }

  const visibleSections = allSections.filter(
    (section) => !section.ownerOnly || (address && owner && address.toLowerCase() === owner)
  );

  return (
    <div className="dashboard-wrapper">
      {checkingAccess && (
        <div className="status-box loading">\u23f3 Checking access, please wait...</div>
      )}

      {!checkingAccess && pendingCount > 0 && (isApprover || address?.toLowerCase() === owner) && (
        <div className="pending-banner">
          \ud83d\udea8 {pendingCount} proposal{pendingCount !== 1 ? "s" : ""} awaiting approval!
        </div>
      )}

      {!checkingAccess && (
        <>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: pendingCount > 0 ? "2.5rem" : 0 }}>
            <img src={logo} alt="Foalca Logo" style={{ height: "60px", borderRadius: "8px" }} />
            FOALCA Admin Dashboard
          </h1>

          <div className="wallet-actions">
            {!address ? (
              <button onClick={connectWallet} className="glow-btn primary">\ud83d\udd17 Connect Wallet</button>
            ) : (
              <>
                <div className="status-box">\u2705 Connected: {address}</div>
                <button onClick={disconnectWallet} className="glow-btn danger">\u274c Disconnect</button>
              </>
            )}
          </div>

          {accessDenied && (
            <div className="status-box" style={{ marginTop: "1rem", color: "red" }}>
              \u26d4 Access denied: Only team can access the dashboard. Redirecting...
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
                      {openSection === id ? " \u25b2" : " \u25bc"}
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
        </>
      )}
    </div>
  );
}
