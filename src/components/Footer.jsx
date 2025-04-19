import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const readOnlyProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

export default function Footer({ provider }) {
  const [owner, setOwner] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!provider) return;
    fetchData();
  }, [provider]);

  const fetchData = async () => {
    try {
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      setCurrentAccount(user);

      const readContract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, readOnlyProvider);
      const ownerAddress = await readContract.owner();
      setOwner(ownerAddress);
    } catch (err) {
      console.error("Failed to fetch owner:", err.message);
    }
  };

  const transferOwnership = async () => {
    if (!provider || !ethers.isAddress(newOwner)) {
      alert("❌ Please enter a valid address.");
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();
      alert("✅ Ownership transferred to: " + newOwner);
      setNewOwner("");
      fetchData();
    } catch (err) {
      alert("❌ Transfer failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="dashboard-footer">
      <div>
        <strong>FOALCA Owner:</strong>{" "}
        {owner ? <code>{owner}</code> : <span>Loading...</span>}
      </div>

      {currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase() && (
        <div style={{ marginTop: "1rem" }}>
          <h4>🔁 Transfer Ownership</h4>
          <input
            type="text"
            placeholder="New owner address"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button onClick={transferOwnership} disabled={loading} className="glow-btn primary">
            {loading ? "Transferring..." : "🔄 Transfer Ownership"}
          </button>
        </div>
      )}

      <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        &copy; {currentYear} FOALCA Admin Dashboard &mdash; All rights reserved
      </div>
    </footer>
  );
}
