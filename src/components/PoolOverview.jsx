import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../config/contract";

const poolNames = [
  "community",
  "marketing",
  "liquidity",
  "development",
  "rewards",
  "burn",
  "reserve",
];

export default function PoolOverview({ provider }) {
  const [balances, setBalances] = useState({});

  useEffect(() => {
    if (!provider) return;
  
    let interval;
  
    const fetchData = async () => {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  
      const results = {};
      for (const name of poolNames) {
        try {
          const raw = await contract.pools(name);
          results[name] = ethers.formatUnits(raw, 18);
        } catch (err) {
          results[name] = "Error";
        }
      }
  
      setBalances(results);
    };
  
    fetchData();
  
    interval = setInterval(fetchData, 5000);
  
    return () => clearInterval(interval);
  }, [provider]);

  return (
    <div>
      <h2>📊 Pool Overview</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Pool</th>
            <th>Balance (FOALCA)</th>
          </tr>
        </thead>
        <tbody>
          {poolNames.map((name) => (
            <tr key={name}>
              <td>{name.charAt(0).toUpperCase() + name.slice(1)}</td>
              <td>{balances[name] || "..."}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}