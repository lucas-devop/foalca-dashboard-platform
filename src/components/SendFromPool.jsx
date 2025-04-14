import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const poolOptions = [
  "community",
  "marketing",
  "liquidity",
  "development",
  "rewards",
  "burn",
  "reserve",
];

export default function SendFromPool({ provider }) {
  const [poolName, setPoolName] = useState("community");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const proposeSend = async () => {
    if (!provider) return alert("❌ Wallet not connected.");
    if (!ethers.isAddress(recipient)) return alert("❌ Invalid recipient address.");
    if (isNaN(parseFloat(amount))) return alert("❌ Invalid amount.");
  
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
  
      const parsedAmount = ethers.parseUnits(amount, 18);
  
      const poolBalance = await contract.pools(poolName);
      if (parsedAmount > poolBalance) {
        alert(`❌ Not enough tokens in "${poolName}" pool.`);
        setLoading(false);
        return;
      }
  
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address", "uint256"],
        [poolName, recipient, parsedAmount]
      );
  
      const tx = await contract.createProposal("sendFromPool", encoded);
      await tx.wait();
  
      alert(`📤 Proposal to send ${amount} FOALCA from '${poolName}' to ${recipient} submitted.`);
      setAmount("");
      setRecipient("");
    } catch (err) {
      alert("❌ Proposal creation failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>📤 Send From Pool</h2>

      <label>
        Pool:
        <select value={poolName} onChange={(e) => setPoolName(e.target.value)}>
          {poolOptions.map((pool) => {
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
        Recipient Address:
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          style={{ width: "100%" }}
        />
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

      <button onClick={proposeSend} disabled={loading}>
        {loading ? "Submitting..." : "📤 Propose Send"}
      </button>
    </div>
  );
}