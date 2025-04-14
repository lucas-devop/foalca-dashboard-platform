import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

export default function BurnScheduler({ provider }) {
  const [lastBurn, setLastBurn] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBurnTime() {
      if (!provider) return;
      try {
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
        const timestamp = await contract.lastBurnTime();
        setLastBurn(new Date(Number(timestamp) * 1000));
      } catch (err) {
        console.error("Failed to fetch burn time:", err);
      }
    }

    fetchBurnTime();
  }, [provider]);

  async function proposeBurn() {
    if (!provider) return;

    try {
      setSubmitting(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const tx = await contract.createProposal("scheduledBurn", "0x");
      await tx.wait();

      alert("📤 Proposal for burn created. Waiting for approval.");
    } catch (err) {
      console.error(err);
      alert("❌ Proposal creation failed: " + (err.reason || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>🔥 Burn Scheduler</h2>
      <p>
        Last Burn:{" "}
        {lastBurn ? lastBurn.toLocaleString() : "Loading..."}
      </p>
      <button onClick={proposeBurn} disabled={submitting}>
        {submitting ? "Submitting..." : "📤 Propose Monthly Burn"}
      </button>
    </div>
  );
}