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

export default function PoolOverview() {
  const [balances, setBalances] = useState({});

  useEffect(() => {
    let interval;
    const readOnlyProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

    const fetchData = async () => {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readOnlyProvider);

      const results = {};
      for (const name of poolNames) {
        try {
          const raw = await contract.pools(name);
          results[name] = Number(ethers.formatUnits(raw, 18)).toFixed(4);
        } catch (err) {
          console.error(`Error fetching pool ${name}:`, err);
          results[name] = "Error";
        }
      }

      setBalances(results);
    };

    fetchData();
    interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

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
