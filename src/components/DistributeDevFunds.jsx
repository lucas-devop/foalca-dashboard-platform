import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

export default function DistributeDevFunds({ provider }) {
  const [loading, setLoading] = useState(false);
  const [lastDistribution, setLastDistribution] = useState(null);

  useEffect(() => {
    async function fetchLastDistribution() {
      if (!provider) return;
      try {
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
        const timestamp = await contract.lastDevDistribution();
        setLastDistribution(new Date(Number(timestamp) * 1000));
      } catch (err) {
        console.error("Failed to fetch last distribution time:", err);
      }
    }

    fetchLastDistribution();
  }, [provider]);

  const proposeDistribution = async () => {
    if (!provider) return alert("❌ Wallet not connected.");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const tx = await contract.createProposal("distributeFromDevelopment", "0x");
      await tx.wait();

      alert("📤 Proposal for development fund distribution submitted.");
    } catch (err) {
      console.error(err);
      alert("❌ Proposal creation failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>🚀 Distribute Development Funds</h2>
      <p>
        This will distribute <strong>1 billion FOALCA</strong> from the
        development pool equally to the <strong>marketing</strong>,{" "}
        <strong>liquidity</strong>, <strong>rewards</strong>, and{" "}
        <strong>reserve</strong> pools. Available once every 90 days.
      </p>
      <p>
        Last Distribution:{" "}
        {lastDistribution ? lastDistribution.toLocaleString() : "Loading..."}
      </p>
      <button onClick={proposeDistribution} disabled={loading}>
        {loading ? "Submitting..." : "📤 Propose Distribution"}
      </button>
    </div>
  );
}