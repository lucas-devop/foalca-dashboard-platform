import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

export default function FeeExemptions({ provider }) {
  const [addressInput, setAddressInput] = useState("");
  const [exemptList, setExemptList] = useState([]);
  const [loading, setLoading] = useState(false);

  const presetAddresses = [
    { address: "0x8280C62D83150B2962f27B631b224F8c7Ca3EF0a", label: "Founder" }
  ];

  const getStoredAddresses = () => {
    const data = localStorage.getItem("feeExemptAdded");
    return data ? JSON.parse(data) : [];
  };

  const saveToStorage = (addresses) => {
    localStorage.setItem("feeExemptAdded", JSON.stringify(addresses));
  };

  const fetchExemptions = async () => {
    if (!provider) return;
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

    const stored = getStoredAddresses().map((addr) => ({ address: addr, label: null }));
    const allCandidates = [...presetAddresses, ...stored];
    const results = [];

    for (const candidate of allCandidates) {
      const address = typeof candidate === "string" ? candidate : candidate.address;
      const label = typeof candidate === "string" ? null : candidate.label;

      try {
        const isExempt = await contract.isExcludedFromFees(address);
        if (isExempt && !results.some((item) => item.address === address)) {
          results.push({ address, label });
        }
      } catch (err) {
        console.error("Error checking address:", address, err);
      }
    }

    setExemptList(results);
  };

  useEffect(() => {
    fetchExemptions();
  }, [provider]);

  const handleExemptionChange = async (targetAddress, exempt) => {
    if (!provider) return alert("Wallet not connected.");
    if (!ethers.isAddress(targetAddress)) return alert("Invalid address.");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const tx = await contract.setFeeExemption(targetAddress, exempt);
      await tx.wait();

      alert(`✅ Exemption ${exempt ? "added" : "removed"} successfully.`);

      if (exempt) {
        const stored = getStoredAddresses();
        const updated = Array.from(new Set([...stored, targetAddress]));
        saveToStorage(updated);
        setAddressInput("");
      } else {
        const updated = getStoredAddresses().filter((a) => a !== targetAddress);
        saveToStorage(updated);
      }

      fetchExemptions();
    } catch (err) {
      alert("❌ Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>🛡️ Manage Fee Exemptions</h2>

      <label>
        Address to Exempt:
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
      </label>
      <br />
      <button onClick={() => handleExemptionChange(addressInput, true)} disabled={loading}>
        {loading ? "Processing..." : "✅ Add Exemption"}
      </button>

      <hr style={{ margin: "1.5rem 0" }} />
      <h4>Current Exempt Addresses:</h4>
      <ul>
        {exemptList.length === 0 && <p>No exemptions found.</p>}
        {exemptList.map(({ address, label }) => (
          <li key={address}>
            <code>{address}</code>{" "}
            {label && <span style={{ fontWeight: "bold", color: "#00796b", marginLeft: "8px" }}>({label})</span>}
            <button
              onClick={() => handleExemptionChange(address, false)}
              disabled={loading || label === "Founder"}
              style={{ marginLeft: "0.5rem" }}
              title={label === "Founder" ? "Cannot remove fixed exemption" : ""}
            >
              ❌ Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}