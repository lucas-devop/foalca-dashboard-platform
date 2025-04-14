import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";

const options = [7, 8, 9, 10, 11, 12, 13, 14, 15];

export default function SetGlobalFee({ provider }) {
  const [loading, setLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [proportions, setProportions] = useState(null);

  useEffect(() => {
    if (!provider) return;
    fetchProportions();
  }, [provider]);

  const fetchProportions = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const feeInfo = await contract.getFullFeeInfo();

      const total =
        Number(feeInfo[0]) +
        Number(feeInfo[1]) +
        Number(feeInfo[2]) +
        Number(feeInfo[3]) +
        Number(feeInfo[4]);

      setProportions({
        burn: Number(feeInfo[0]) / total,
        rewards: Number(feeInfo[1]) / total,
        liquidity: Number(feeInfo[2]) / total,
        marketing: Number(feeInfo[3]) / total,
        development: Number(feeInfo[4]) / total,
      });

      setSelectedFee(Math.round(total / 10));
    } catch (err) {
      console.error("Failed to fetch proportions:", err);
    }
  };

  const proposeFeeUpdate = async () => {
    if (!provider || !proportions) return;

    const totalPromile = selectedFee * 10;
    let sum = 0;
    const feeKeys = ["burn", "rewards", "liquidity", "marketing", "development"];
    const newFees = {};

    for (let i = 0; i < feeKeys.length; i++) {
      const key = feeKeys[i];
      if (i === feeKeys.length - 1) {
        newFees[key] = totalPromile - sum;
      } else {
        newFees[key] = Math.floor(proportions[key] * totalPromile);
        sum += newFees[key];
      }
    }

    const actualTotal = Object.values(newFees).reduce((a, b) => a + b, 0);
    if (actualTotal !== totalPromile) {
      alert("❌ Fee total mismatch. Aborting.");
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);

      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256"],
        [
          newFees.burn,
          newFees.rewards,
          newFees.liquidity,
          newFees.marketing,
          newFees.development
        ]
      );

      const tx = await contract.createProposal("setFees", encoded);
      await tx.wait();

      alert(`📤 Proposal to set ${selectedFee}% global fee submitted.`);
    } catch (err) {
      console.error("Fee proposal failed:", err);
      alert("❌ Proposal failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>📊 Set Global Fee Percentage</h2>

      <label>
        Total Fee (%):
        {selectedFee !== null ? (
          <select
            value={selectedFee}
            onChange={(e) => setSelectedFee(Number(e.target.value))}
            style={{ marginLeft: "0.5rem" }}
          >
            {options.map((val) => (
              <option key={val} value={val}>
                {val}%
              </option>
            ))}
          </select>
        ) : (
          <span style={{ marginLeft: "1rem", fontStyle: "italic" }}>Loading current fee...</span>
        )}
      </label>
      <br />

      <button
        onClick={proposeFeeUpdate}
        disabled={loading || !proportions}
        style={{ marginTop: "1rem" }}
      >
        {loading ? "Submitting..." : "📤 Propose New Fee"}
      </button>
    </div>
  );
}