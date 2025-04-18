import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const readOnlyProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

export default function DynamicFeesToggle({ provider }) {
  const [useDynamic, setUseDynamic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, readOnlyProvider);
        const current = await contract.getUseDynamicFees();
        setUseDynamic(current);
      } catch (err) {
        console.error("Failed to fetch dynamic fee status:", err.message);
      }
    };

    fetchStatus();
  }, []);

  const proposeToggle = async () => {
    if (!provider) return alert("❌ Wallet not connected.");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const newStatus = !useDynamic;
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [newStatus]);

      const tx = await contract.createProposal("setUseDynamicFees", encoded);
      await tx.wait();

      alert(`📤 Proposal to ${newStatus ? "enable" : "disable"} dynamic fees submitted.`);
    } catch (err) {
      console.error("Error proposing dynamic fee toggle:", err);
      alert("❌ Proposal failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>⚖️ Dynamic Fees</h2>
      <p>Status: <strong>{useDynamic ? "Enabled" : "Disabled"}</strong></p>
      <button onClick={proposeToggle} disabled={loading}>
        {loading
          ? "Submitting..."
          : useDynamic
          ? "📤 Propose Disable"
          : "📤 Propose Enable"}
      </button>
    </div>
  );
}
