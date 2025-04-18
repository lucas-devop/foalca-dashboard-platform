import React from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as CONTRACT_ABI } from "../config/contract";

export default function WalletModal({ setProvider, setAddress, setSigner, setContract, isOpen, onClose }) {
  if (!isOpen) return null;

  async function connectWallet(wallet) {
    if (!window.ethereum) return alert("No Ethereum provider found.");

    let providerToUse = null;

    if (window.ethereum.providers?.length) {
      for (const p of window.ethereum.providers) {
        if (wallet === 'metamask' && p.isMetaMask) providerToUse = p;
        if (wallet === 'coinbase' && p.isCoinbaseWallet) providerToUse = p;
        if (wallet === 'trust' && p.isTrust) providerToUse = p;
      }
    } else {
      providerToUse = window.ethereum;
    }

    if (!providerToUse) {
      alert(`Selected wallet (${wallet}) not found!`);
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(providerToUse);
      const signer = await ethersProvider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(ethersProvider);
      setSigner(signer);
      setAddress(walletAddress);
      setContract(contract);
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to connect to ${wallet}.`);
    }
  }

  async function connectWalletConnect() {
    try {
      const wcProvider = new WalletConnectProvider({
        rpc: {
          56: "https://bsc-dataseed.binance.org/"
        }
      });

      await wcProvider.enable();
      const ethersProvider = new ethers.BrowserProvider(wcProvider);
      const signer = await ethersProvider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(ethersProvider);
      setSigner(signer);
      setAddress(walletAddress);
      setContract(contract);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to connect via WalletConnect.");
    }
  }

  return (
    <div className="wallet-modal">
      <div className="wallet-modal-content">
        <h2>Connect Wallet</h2>
        <div className="wallet-options">
          <div className="wallet-option" onClick={() => connectWallet('metamask')}>
            <img src="/metamask-icon.png" alt="MetaMask" />
            <span>MetaMask</span>
          </div>

          <div className="wallet-option" onClick={() => connectWallet('coinbase')}>
            <img src="/coinbase-icon.png" alt="Coinbase Wallet" />
            <span>Coinbase Wallet</span>
          </div>

          <div className="wallet-option" onClick={() => connectWallet('trust')}>
            <img src="/trustwallet-icon.png" alt="Trust Wallet" />
            <span>Trust Wallet</span>
          </div>

          <div className="wallet-option" onClick={connectWalletConnect}>
            <img src="/walletconnect-icon.png" alt="WalletConnect" />
            <span>WalletConnect (QR)</span>
          </div>

          <button className="glow-btn danger" onClick={onClose} style={{ marginTop: "15px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}