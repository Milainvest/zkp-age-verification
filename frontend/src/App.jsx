import { useState, useEffect } from 'react'
import './App.css'
import { ethers } from 'ethers'
import contractInfo from './contractAddress.json'

// Minimal ABI for the verifier contract
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "_pA",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "_pB",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "_pC",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[1]",
        "name": "_pubSignals",
        "type": "uint256[1]"
      }
    ],
    "name": "verifyProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Use a different name for the initial value
const initialContractAddress = contractInfo.address;
console.log("Initial contract address:", initialContractAddress);

// Define network configurations
const NETWORKS = {
  SEPOLIA: {
    chainId: "0xaa36a7", // 11155111 in hex
    name: "Sepolia",
    contractAddress: contractInfo.sepolia || contractInfo.address, // Fallback to main address
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  },
  LOCAL: {
    chainId: "0x7a69", // 31337 in hex (Hardhat's default)
    name: "Localhost",
    contractAddress: contractInfo.local || contractInfo.address, // Fallback to main address
    rpcUrl: "http://127.0.0.1:8545"
  }
};

function App() {
  const [proof, setProof] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullABI, setFullABI] = useState(null);
  const [contractAddress, setContractAddress] = useState(initialContractAddress);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [localContractAddress, setLocalContractAddress] = useState("");
  const [showLocalAddressInput, setShowLocalAddressInput] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Try to get the full ABI on component mount
  useEffect(() => {
    const loadABI = async () => {
      try {
        console.log("Loading full ABI...");
        
        // Try to fetch the ABI from the correct contract artifacts path
        const response = await fetch('/artifacts/contracts/Verifier.sol/Groth16Verifier.json');
        
        if (!response.ok) {
          console.error("Failed to load resource: the server responded with a status of", response.status);
          // Fall back to the minimal ABI
          setFullABI(contractABI);
          return;
        }
        
        const data = await response.json();
        console.log("Loaded full ABI");
        
        if (data && data.abi) {
          setFullABI(data.abi);
        } else {
          console.error("Invalid ABI format");
          // Fall back to the minimal ABI
          setFullABI(contractABI);
        }
      } catch (error) {
        console.error("Error fetching ABI:", error);
        // Fall back to the minimal ABI
        setFullABI(contractABI);
      }
    };
    loadABI();
    
    // Check if wallet is already connected
    checkWalletConnection();
  }, []);

  // Check if wallet is already connected
  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) {
        return false;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        
        // Detect the current network
        await detectNetwork();
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            // User disconnected their wallet
            setWalletConnected(false);
            setWalletAddress("");
          } else {
            setWalletAddress(accounts[0]);
          }
        });
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
          detectNetwork();
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  };

  // Detect the current network and set the appropriate contract address
  const detectNetwork = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainIdHex = "0x" + network.chainId.toString(16);
      
      // Check if the network is supported
      let currentNetworkConfig = null;
      
      if (chainIdHex === NETWORKS.SEPOLIA.chainId) {
        currentNetworkConfig = NETWORKS.SEPOLIA;
      } else if (chainIdHex === NETWORKS.LOCAL.chainId) {
        currentNetworkConfig = NETWORKS.LOCAL;
      }
      
      if (currentNetworkConfig) {
        setCurrentNetwork(currentNetworkConfig);
        setContractAddress(currentNetworkConfig.contractAddress);
        setNetworkError(null);
        return true;
      } else {
        setCurrentNetwork(null);
        setNetworkError("サポートされていないネットワークです。Sepoliaまたはローカルネットワークに切り替えてください。");
        return false;
      }
    } catch (error) {
      console.error("Error detecting network:", error);
      setNetworkError("ネットワーク検出エラー: " + error.message);
      return false;
    }
  };

  // Switch to a specific network
  const switchNetwork = async (networkConfig) => {
    try {
      if (!window.ethereum) {
        alert("MetaMaskをインストールしてください");
        return false;
      }
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        });
        
        // Network switch successful, update state
        setCurrentNetwork(networkConfig);
        setContractAddress(networkConfig.contractAddress);
        setNetworkError(null);
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: networkConfig.chainId,
                  chainName: networkConfig.name,
                  rpcUrls: [networkConfig.rpcUrl],
                },
              ],
            });
            
            // Chain added successfully, now try to switch again
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: networkConfig.chainId }],
            });
            
            // Network switch successful, update state
            setCurrentNetwork(networkConfig);
            setContractAddress(networkConfig.contractAddress);
            setNetworkError(null);
            return true;
          } catch (addError) {
            console.error("Error adding network:", addError);
            setNetworkError("ネットワーク追加エラー: " + addError.message);
            return false;
          }
        } else {
          console.error("Error switching network:", switchError);
          setNetworkError("ネットワーク切り替えエラー: " + switchError.message);
          return false;
        }
      }
    } catch (error) {
      console.error("Error in switchNetwork:", error);
      setNetworkError("ネットワーク操作エラー: " + error.message);
      return false;
    }
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    setLoading(true);
    try {
      const success = await switchNetwork(NETWORKS.SEPOLIA);
      if (success) {
        await detectNetwork();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error switching to Sepolia:", error);
      setNetworkError("Sepoliaへの切り替えエラー: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Switch to local network
  const switchToLocal = async () => {
    setLoading(true);
    try {
      const success = await switchNetwork(NETWORKS.LOCAL);
      if (success) {
        await detectNetwork();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error switching to local network:", error);
      setNetworkError("ローカルネットワークへの切り替えエラー: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // proof.json をアップロード
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Store the filename
      setUploadedFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonProof = JSON.parse(e.target.result);
          console.log("Parsed JSON proof:", jsonProof);
          setProof(jsonProof);
          setVerificationResult(null);
        } catch (error) {
          console.error("Error parsing proof JSON:", error);
          alert("Invalid JSON file");
          setUploadedFileName(""); // Clear filename on error
        }
      };
      reader.readAsText(file);
    }
  };

  // MetaMask に接続
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMaskをインストールしてください");
        return false;
      }
      
      // Request account access using ethers.js v6
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      setWalletConnected(true);
      setWalletAddress(account);
      
      // Detect the current network
      await detectNetwork();
      
      // Listen for account changes
      window.ethereum.removeListener('accountsChanged', () => {});
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setWalletConnected(false);
          setWalletAddress("");
        } else {
          setWalletAddress(accounts[0]);
        }
      });
      
      // Listen for chain changes
      window.ethereum.removeListener('chainChanged', () => {});
      window.ethereum.on('chainChanged', () => {
        detectNetwork();
      });
      
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        // User rejected the request
        alert("ウォレット接続がキャンセルされました");
      } else {
        alert(`ウォレット接続エラー: ${error.message}`);
      }
      return false;
    }
  };

  // スマートコントラクトに proof を送信して検証
  const verifyProof = async () => {
    try {
      // Reset previous results
      setVerificationResult(null);
      setLoading(true);
      
      // Check if proof is uploaded
      if (!proof) {
        setVerificationResult("❌ 証明ファイルをアップロードしてください");
        setLoading(false);
        return;
      }
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setVerificationResult("❌ MetaMaskがインストールされていません");
        setLoading(false);
        return;
      }
      
      // Ensure we're on a supported network
      if (!currentNetwork) {
        setVerificationResult("❌ サポートされているネットワークに接続してください");
        setLoading(false);
        return;
      }
      
      // Get the contract address for the current network
      const networkContractAddress = currentNetwork.contractAddress;
      console.log(`Wallet address: ${walletAddress}`);
      console.log(`Contract address: ${networkContractAddress}`);
      
      // Check if the contract exists at the specified address
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractCode = await provider.getCode(networkContractAddress);
      console.log(`Contract code at address: ${contractCode}`);
      
      if (contractCode === '0x' || contractCode === '0x0') {
        // No contract at this address
        if (currentNetwork.chainId === NETWORKS.LOCAL.chainId) {
          setVerificationResult("❌ ローカルネットワークにコントラクトがデプロイされていません。Hardhatを使用してコントラクトをデプロイしてください。");
        } else {
          setVerificationResult(`❌ アドレス ${networkContractAddress} にコントラクトが見つかりません`);
        }
        setLoading(false);
        return;
      }
      
      // Format the proof components correctly
      const formattedProof = formatProofForContract(proof);
      
      // Create contract instance
      const signer = await provider.getSigner();
      const abi = fullABI || contractABI;
      const contract = new ethers.Contract(networkContractAddress, abi, signer);
      
      console.log("Calling verifyProof with exact values:", {
        _pA: formattedProof.a,
        _pB: formattedProof.b,
        _pC: formattedProof.c,
        _pubSignals: formattedProof.input
      });
      
      // Call the contract
      const result = await contract.verifyProof(
        formattedProof.a,
        formattedProof.b,
        formattedProof.c,
        formattedProof.input
      );

      console.log("Raw verification result:", result);
      console.log("Public signals:", formattedProof.input[0]);

      // Check both the verification result and the public signal
      if (result === true) {
        if (formattedProof.input[0] === "1" || formattedProof.input[0] === 1) {
          setVerificationResult("✅ 検証成功: 18歳以上です");
        } else if (formattedProof.input[0] === "0" || formattedProof.input[0] === 0) {
          setVerificationResult("✅ 検証成功: 18歳未満です");
        } else {
          setVerificationResult(`✅ 検証成功: 不明な年齢値 (${formattedProof.input[0]})`);
        }
      } else {
        setVerificationResult("❌ 検証失敗: 無効な証明です");
      }
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        data: error.data
      });
      
      // Handle specific error cases
      if (error.message.includes("call revert exception")) {
        setVerificationResult("❌ コントラクト呼び出しエラー: 関数が失敗しました");
      } else if (error.message.includes("invalid address")) {
        setVerificationResult("❌ 無効なコントラクトアドレス");
      } else {
        setVerificationResult(`❌ エラー: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatProofForContract = (proof) => {
    try {
      console.log("Formatting proof:", proof);

      // Extract the components, ignoring the curve and prototype information
      const { pi_a, pi_b, pi_c, publicSignals } = proof;

      // Format pi_a: take only the first two elements
      const a = [
        pi_a[0],
        pi_a[1]
      ];

      // Format pi_b: take only the first two elements of each subarray
      const b = [
        [pi_b[0][1], pi_b[0][0]],  // First row
        [pi_b[1][1], pi_b[1][0]]   // Second row
      ];

      // Format pi_c: take only the first two elements
      const c = [
        pi_c[0],
        pi_c[1]
      ];

      // Format public signals
      const input = [publicSignals[0]];

      const formattedProof = { a, b, c, input };
      
      console.log("Formatted proof for contract:", formattedProof);
      
      // Verify array lengths
      console.assert(formattedProof.a.length === 2, "a should be length 2");
      console.assert(formattedProof.b.length === 2 && formattedProof.b[0].length === 2, "b should be 2x2");
      console.assert(formattedProof.c.length === 2, "c should be length 2");
      console.assert(formattedProof.input.length === 1, "input should be length 1");

      return formattedProof;
    } catch (error) {
      console.error("Error formatting proof details:", error);
      console.error("Received proof:", proof);
      throw new Error("証明データの形式が無効です: " + error.message);
    }
  };

  // Truncate address for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  // Function to update the local contract address
  const updateLocalContractAddress = () => {
    try {
      // Validate the address
      if (!localContractAddress || !localContractAddress.startsWith('0x') || localContractAddress.length !== 42) {
        alert('有効なイーサリアムアドレスを入力してください');
        return;
      }
      
      // Check if the address is valid
      if (!ethers.isAddress(localContractAddress)) {
        alert('無効なイーサリアムアドレスです');
        return;
      }
      
      // Update the LOCAL network configuration
      NETWORKS.LOCAL.contractAddress = localContractAddress;
      
      // If we're on the local network, update the current contract address
      if (currentNetwork && currentNetwork.chainId === NETWORKS.LOCAL.chainId) {
        setContractAddress(localContractAddress);
      }
      
      // Hide the input field
      setShowLocalAddressInput(false);
      
      // Clear the input
      setLocalContractAddress('');
      
      // Show success message
      alert('ローカルコントラクトアドレスが更新されました');
    } catch (error) {
      console.error('Error updating local contract address:', error);
      alert('エラーが発生しました: ' + error.message);
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h1>ZKP年齢検証</h1>
        <p className="subtitle">ゼロ知識証明を使用して18歳以上かどうかを検証します</p>
        
        {/* Network section with enhanced styling */}
        {walletConnected && (
          <div className="network-section">
            <div className="network-info">
              <div className="network-badge">
                <div className={`network-dot ${currentNetwork ? 'connected' : ''}`}></div>
                <span>現在のネットワーク: {currentNetwork ? currentNetwork.name : "不明"}</span>
              </div>
              {networkError && <p className="network-error">{networkError}</p>}
            </div>
            
            <div className="network-buttons">
              <button 
                className={`network-button ${currentNetwork?.chainId === NETWORKS.SEPOLIA.chainId ? 'active' : ''}`}
                onClick={switchToSepolia}
                disabled={currentNetwork?.chainId === NETWORKS.SEPOLIA.chainId}
              >
                Sepoliaに切り替え
              </button>
              <button 
                className={`network-button ${currentNetwork?.chainId === NETWORKS.LOCAL.chainId ? 'active' : ''}`}
                onClick={switchToLocal}
                disabled={currentNetwork?.chainId === NETWORKS.LOCAL.chainId}
              >
                ローカルネットワークに切り替え
              </button>
            </div>
            
            {/* Local contract address section with enhanced styling */}
            {currentNetwork?.chainId === NETWORKS.LOCAL.chainId && (
              <div className="local-contract-section">
                <div className="contract-info">
                  <span className="label">コントラクトアドレス:</span>
                  <code className="address">{NETWORKS.LOCAL.contractAddress}</code>
                </div>
                <button 
                  className={`address-button ${showLocalAddressInput ? 'active' : ''}`}
                  onClick={() => setShowLocalAddressInput(!showLocalAddressInput)}
                >
                  {showLocalAddressInput ? "キャンセル" : "アドレスを変更"}
                </button>
                
                {showLocalAddressInput && (
                  <div className="address-input-container">
                    <input
                      type="text"
                      className="address-input"
                      placeholder="0x..."
                      value={localContractAddress}
                      onChange={(e) => setLocalContractAddress(e.target.value)}
                    />
                    <button 
                      className="update-button"
                      onClick={updateLocalContractAddress}
                    >
                      更新
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Wallet connection section with enhanced styling */}
        <div className="connect-section">
          {!walletConnected ? (
            <button className="connect-button" onClick={connectWallet}>
              <img src="/metamask-logo.svg" alt="MetaMask" className="metamask-logo" />
              MetaMaskに接続
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-badge">
                <div className="wallet-dot"></div>
                <span>{truncateAddress(walletAddress)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Verification section with enhanced styling */}
        {walletConnected && (
          <div className="verification-section">
            <div className="upload-section">
              <input
                type="file"
                id="proof-upload"
                className="file-input"
                onChange={handleFileUpload}
                accept=".json"
              />
              <label htmlFor="proof-upload" className="file-input-label">
                <i className="upload-icon">📄</i>
                証明ファイルを選択
              </label>
              {uploadedFileName && (
                <div className="file-info">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{uploadedFileName}</span>
                </div>
              )}
            </div>
            
            <button
              className={`verify-button ${!proof || loading ? 'disabled' : ''}`}
              onClick={verifyProof}
              disabled={!proof || loading}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <i className="verify-icon">🔍</i>
                  証明を検証
                </>
              )}
            </button>
            
            {verificationResult && (
              <div className={`result-box ${verificationResult.includes('✅') ? 'success' : 'error'}`}>
                {verificationResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App
