import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ethers } from 'ethers'

const contractAddress = "0xead473e61Af05D613513354717a81197B4332fe5"; // デプロイ後に設定
const contractABI = [
  // Verifier.solのABIをここに貼り付ける
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

function App() {
  const [count, setCount] = useState(0)
  const [proof, setProof] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // proof.jsonのアップロード処理
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProof(JSON.parse(e.target.result));
      reader.readAsText(file);
    }
  };

  // MetaMask に接続
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMaskをインストールしてください");
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
  };

  // スマートコントラクトに proof を送信
  const verifyProof = async () => {
    if (!proof) {
      alert("proof.json をアップロードしてください");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const { pi_a, pi_b, pi_c, publicSignals } = proof;
      const proofArray = [
        [pi_a[0], pi_a[1]], // A
        [
          [pi_b[0][0], pi_b[0][1]],
          [pi_b[1][0], pi_b[1][1]]
        ], // B
        [pi_c[0], pi_c[1]], // C
        publicSignals // Public input
      ];

      const result = await contract.verifyProof(...proofArray);
      setVerificationResult(result ? "有効な証明 ✅" : "無効な証明 ❌");
    } catch (error) {
      console.error(error);
      setVerificationResult("証明の検証エラー ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>ZKP 年齢認証 Dapp</h2>
      <button onClick={connectWallet}>ウォレット接続</button>
      <input type="file" accept="application/json" onChange={handleFileUpload} />
      <button onClick={verifyProof} disabled={!proof}>証明を検証</button>
      <h3>{verificationResult}</h3>
    </div>
  );
}

export default App
