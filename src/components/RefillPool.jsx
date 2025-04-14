import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const targetPools = [
  "community",
  "marketing",
  "liquidity",
  "development",
  "rewards",
  "burn",
];

export default function RefillPool({ provider }) {
  const [targetPool, setTargetPool] = useState("liquidity");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const proposeRefill = async () => {
    if (!provider) return alert("❌ Wallet not connected.");
    if (isNaN(parseFloat(amount))) return alert("❌ Invalid amount.");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const parsedAmount = ethers.parseUnits(amount, 18);
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256"],
        [targetPool, parsedAmount]
      );

      const tx = await contract.createProposal("refillPoolFromReserve", encodedData);
      await tx.wait();

      alert(`📤 Proposal submitted to refill ${amount} FOALCA to '${targetPool}' pool.`);
      setAmount("");
    } catch (err) {
      alert("❌ Proposal creation failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>🔄 Refill Pool from Reserve</h2>

      <label>
        Target Pool:
        <select value={targetPool} onChange={(e) => setTargetPool(e.target.value)}>
          {targetPools.map((pool) => {
            const displayName = pool.charAt(0).toUpperCase() + pool.slice(1);
            return (
              <option key={pool} value={pool}>
                {displayName}
              </option>
            );
          })}
        </select>
      </label>
      <br />

      <label>
        Amount (FOALCA):
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>
      <br />

      <button onClick={proposeRefill} disabled={loading}>
        {loading ? "Submitting..." : "📤 Propose Refill"}
      </button>
    </div>
  );
}