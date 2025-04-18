import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const readOnlyProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

export default function ApproverManager({ provider }) {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [approverInput, setApproverInput] = useState("");
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider) return;
    fetchApprovers();
  }, [provider]);

  const fetchApprovers = async () => {
    try {
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      setCurrentAccount(user);

      const readContract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, readOnlyProvider);

      const ownerAddress = await readContract.owner();
      setOwner(ownerAddress);

      const known = localStorage.getItem("knownApprovers");
      const stored = known ? JSON.parse(known) : [];
      const result = [];

      for (const address of stored) {
        const isValid = await readContract.isApprover(address);
        if (isValid) result.push(address);
      }

      if (!stored.includes(ownerAddress)) {
        result.unshift(ownerAddress);
        localStorage.setItem("knownApprovers", JSON.stringify([ownerAddress, ...stored]));
      }

      setApprovers(result);
    } catch (err) {
      console.error("Failed to fetch approvers:", err.message);
    }
  };

  const addApprover = async () => {
    if (!ethers.isAddress(approverInput)) {
      alert("❌ Invalid address");
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const tx = await contract.addApprover(approverInput);
      await tx.wait();

      const updated = Array.from(new Set([...approvers, approverInput]));
      localStorage.setItem("knownApprovers", JSON.stringify(updated));
      setApproverInput("");
      setApprovers(updated);
      alert("✅ Approver added successfully.");
    } catch (err) {
      alert("❌ Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const removeApprover = async (address) => {
    if (!provider || !ethers.isAddress(address)) return;
    if (!window.confirm(`Really remove ${address}?`)) return;

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const tx = await contract.removeApprover(address);
      await tx.wait();

      const updated = approvers.filter((a) => a !== address);
      localStorage.setItem("knownApprovers", JSON.stringify(updated));
      setApprovers(updated);
      alert("✅ Approver removed successfully.");
    } catch (err) {
      alert("❌ Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isOwner = currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase();

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>🔐 Token Approvers</h2>

      {isOwner && (
        <>
          <label>
            Add Approver:
            <input
              type="text"
              value={approverInput}
              onChange={(e) => setApproverInput(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </label>
          <button onClick={addApprover} disabled={loading || !approverInput} style={{ marginTop: "0.5rem" }}>
            {loading ? "Adding..." : "➕ Add Approver"}
          </button>
          <hr style={{ margin: "1.5rem 0" }} />
        </>
      )}

      <h4>Current Approvers:</h4>
      <ul>
        {approvers.length === 0 && <p>No approvers added.</p>}
        {approvers.map((address) => (
          <li key={address} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>
              <code>
                {isOwner
                  ? address
                  : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </code>
              {address.toLowerCase() === owner?.toLowerCase() && (
                <span style={{ marginLeft: "0.5rem", color: "#00796b" }}><strong>(Owner)</strong></span>
              )}
            </span>
            {isOwner && address.toLowerCase() !== owner?.toLowerCase() && (
              <button onClick={() => removeApprover(address)} disabled={loading} style={{ marginLeft: "1rem" }}>
                ❌ Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
