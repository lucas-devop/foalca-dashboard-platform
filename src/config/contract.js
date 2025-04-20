export const CONTRACT_ADDRESS = "0xD17053052866A5A61F11458c3d599b10752947E5";

export const ABI = [
  "function pools(string) view returns (uint256)",
  "function scheduledBurn() external",
  "function lastBurnTime() view returns (uint256)",
  "function lastDevDistribution() view returns (uint256)",
  "function sendFromPool(string poolName, address recipient, uint256 amount) external",
  "function setUseDynamicFees(bool enabled) external",
  "function getUseDynamicFees() view returns (bool)",
  "function refillPoolFromReserve(string targetPool, uint256 amount) external",
  "function setFees(uint256,uint256,uint256,uint256,uint256) external",
  "function getFullFeeInfo() view returns (uint256,uint256,uint256,uint256,uint256)",
  "function distributeFromDevelopment() external",
  "function setFeeExemption(address account, bool exempt) external",
  "function isExcludedFromFees(address account) view returns (bool)",
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner) external",
  "function addApprover(address account) external",
  "function removeApprover(address account) external",
  "function isApprover(address account) view returns (bool)",

  "function createProposal(string action, bytes data) external returns (uint256)",
  "function proposalCounter() view returns (uint256)",
  "function proposals(uint256) view returns (string action, bytes data, address proposer, bool executed, bool rejected, uint256 approvals)",
  "function approveProposal(uint256) external",
  "function rejectProposal(uint256) external",
  "function executeProposal(uint256) external",
  "function getProposal(uint256) view returns (string,address,bool,bool,uint256)",
  "function getProposalData(uint256 proposalId) view returns (bytes)"
];
