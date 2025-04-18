import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as FOALCA_ABI } from "../config/contract";
import { sendDiscordLogEmbed } from "../utils/webhook";


export default function Approvals({ provider }) {
  const [proposals, setProposals] = useState([]);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isApprover, setIsApprover] = useState(false);

  useEffect(() => {
    if (!provider) return;
    fetchProposals();
  }, [provider]);

  const fetchProposals = async () => {
    try {
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      setAccount(user);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const count = await contract.proposalCounter();
      const list = [];

      const ownerAddress = await contract.owner();
      const approverStatus = await contract.isApprover(user);
      setIsOwner(user.toLowerCase() === ownerAddress.toLowerCase());
      setIsApprover(approverStatus);

      for (let i = 0; i < count; i++) {
        const [action, proposer, executed, rejected, approvals] = await contract.getProposal(i);
        const data = await contract.getProposalData(i);

        let dataText = "N/A";

        if (action === "scheduledBurn") {
          dataText = "Burning 1,000,000,000 FOALCA";
        } else if (action === "sendFromPool") {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["string", "address", "uint256"],
            data
          );
          const pool = decoded[0];
          const recipient = decoded[1];
          const amount = ethers.formatUnits(decoded[2], 18);
          dataText = `${pool} → ${amount} FOALCA → ${recipient}`;
        } else if (action === "distributeFromDevelopment") {
          dataText = "Distribute 1,000,000,000 FOALCA from development → marketing, liquidity, rewards, reserve";
        } else if (action === "setUseDynamicFees") {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], data);
          const enabled = decoded[0];
          dataText = enabled ? "Enable dynamic fees" : "Disable dynamic fees";
        } else if (action === "refillPoolFromReserve") {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string", "uint256"], data);
          const targetPool = decoded[0];
          const amount = ethers.formatUnits(decoded[1], 18);
          dataText = `Refill '${targetPool}' with ${amount} FOALCA from reserve`;
        } else if (action === "setFees") {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["uint256", "uint256", "uint256", "uint256", "uint256"],
            data
          );
          const totalFee = decoded.reduce((sum, val) => sum + Number(val), 0) / 10;
          dataText = `Set total fee to ${totalFee}% → Burn: ${decoded[0]}‰, Rewards: ${decoded[1]}‰, Liquidity: ${decoded[2]}‰, Marketing: ${decoded[3]}‰, Development: ${decoded[4]}‰`;
        }

        list.push({
          id: i,
          action,
          proposer,
          executed,
          rejected,
          approvals: Number(approvals),
          dataText
        });
      }

      setProposals(list);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  const approve = async (p) => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const tx = await contract.approveProposal(p.id);
      await tx.wait();
      
      await sendDiscordLogEmbed({
        title: `✅ Proposal #${p.id} Approved`,
        description: p.dataText,
        color: 0x2ecc71,
        fields: [
          { name: "Action", value: p.action, inline: true },
          { name: "By", value: account, inline: true },
        ],
      });

      fetchProposals();
    } catch (err) {
      alert("❌ Approve failed: " + (err.reason || err.message));
    }
  };
  

  const reject = async (p) => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const tx = await contract.rejectProposal(p.id);
      await tx.wait();
      
      await sendDiscordLogEmbed({
        title: `⛔ Proposal #${p.id} Rejected`,
        description: p.dataText,
        color: 0xe74c3c,
        fields: [
          { name: "Action", value: p.action, inline: true },
          { name: "By", value: account, inline: true },
        ],
      });

      fetchProposals();
    } catch (err) {
      alert("❌ Reject failed: " + (err.reason || err.message));
    }
  };
  

  const execute = async (p) => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FOALCA_ABI, signer);
      const tx = await contract.executeProposal(p.id);
      await tx.wait();
      
      await sendDiscordLogEmbed({
        title: `🚀 Proposal #${p.id} Executed`,
        description: p.dataText,
        color: 0x3498db,
        fields: [
          { name: "Action", value: p.action, inline: true },
          { name: "By", value: account, inline: true },
        ],
      });  

      fetchProposals();
    } catch (err) {
      alert("❌ Execution failed: " + (err.reason || err.message));
    }
  };
  

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>📜 Pending Approvals</h2>
      {proposals.filter((p) => !p.executed && !p.rejected).length === 0 ? (
        <p>No proposals yet.</p>
      ) : (
        <ul>
          {proposals
            .filter((p) => !p.executed && !p.rejected)
            .map((p) => {
              const actionClassMap = {
                scheduledBurn: "action-burn",
                sendFromPool: "action-send",
                distributeFromDevelopment: "action-distribute",
                setUseDynamicFees: "action-dynamic",
                refillPoolFromReserve: "action-refill",
                setFees: "action-fees",
              };

              const cardClass = `approval-card ${actionClassMap[p.action] || ""}`;

              return (
                <li key={p.id} className={cardClass}>
                  <div className="approval-content">
                    <div className="approval-header">
                      #{p.id} – <span className="proposal-code">{p.action}</span>
                    </div>
                    <div className="approval-data">{p.dataText}</div>
                    <div className="approval-status">Status: 🕓 Pending</div>
                    <div className="approval-votes">Approvals: {p.approvals}</div>
                    <div style={{ marginTop: "0.75rem" }}>
                      {isApprover && !isOwner && (
                        <>
                          <button onClick={() => approve(p)} className="btn-confirm" style={{ marginLeft: "0.5rem" }}> 👍 Approve </button>
                          <button onClick={() => reject(p)} className="btn-cancel" style={{ marginLeft: "0.5rem" }}> ⛔ Reject </button>
                        </>
                      )}
                      {isOwner && (
                        <>
                          <button onClick={() => execute(p)} className="btn-confirm"> 🚀 Execute </button>
                          <button
                            onClick={() => reject(p)}
                            className="btn-cancel"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            ⛔ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
