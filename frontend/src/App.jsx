import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ethers } from 'ethers'

const contractAddress = "0xD0450DC112982F5904d3122CAEEa01D5A8021821"; // デプロイ後に設定
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
  const [proof, setProof] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // proof.json をアップロード
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
  
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
  
      if (accounts.length > 0) {
        console.log("すでに接続済み:", accounts[0]);
        return;
      }
  
      // 既にリクエストが保留中の場合はエラーを回避
      const isRequestPending = window.ethereum.isConnected() && (await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] }));
      if (isRequestPending) {
        console.log("ウォレット接続リクエストが保留中のため、新しいリクエストを送らない");
        return;
      }
  
      console.log("新しく接続を試みる");
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      if (error.code === -32002) {
        alert("ウォレット接続リクエストが保留中です。MetaMask で承認してください。");
      } else {
        console.error("ウォレット接続エラー:", error);
      }
    }
  };

  // スマートコントラクトに proof を送信して検証
  const verifyProof = async () => {
    if (!proof) {
      alert("proof.json をアップロードしてください");
      return;
    }
  
    if (!window.ethereum) {
      alert("MetaMaskをインストールしてください");
      return;
    }
  
    try {
      setLoading(true);
  
      // ここでウォレットが接続されているか確認
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
  
      console.log("ウォレットアドレス:", address);
  
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const { pi_a, pi_b, pi_c, publicSignals } = proof;
      const proofArray = [
        [pi_a[0], pi_a[1]],
        [[pi_b[0][0], pi_b[0][1]], [pi_b[1][0], pi_b[1][1]]],
        [pi_c[0], pi_c[1]],
        publicSignals
      ];

      // 🚨 修正：undefined が含まれていないかチェック
      if (!pi_a || !pi_b || !pi_c || !publicSignals) {
        console.error("Invalid proof format:", proof);
        console.error("Invalid proof array structure:", proof);
        console.log("pi_a:", pi_a);
        console.log("pi_b:", pi_b);
        console.log("pi_c:", pi_c);
        console.log("publicSignals:", publicSignals);
        alert("証明データが不正です。正しい proof.json をアップロードしてください。");
        return;
      }

      // 🚨 修正：配列の長さを確認（誤った長さならエラー）
      // if (pi_a.length !== 2 || pi_b.length !== 2 || pi_c.length !== 2 || publicSignals.length !== 1) {
      //   console.error("Invalid proof array structure:", proof);
      //   console.log("pi_a:", pi_a);
      //   console.log("pi_b:", pi_b);
      //   console.log("pi_c:", pi_c);
      //   console.log("publicSignals:", publicSignals);
      //   alert("証明データの形式が正しくありません。");
      //   return;
      // }

      // 🚨 修正：適切なデータ変換
      const formattedProof = [
        [pi_a[0], pi_a[1]],
        [
          [pi_b[0][1], pi_b[0][0]],
          [pi_b[1][1], pi_b[1][0]]
        ],
        [pi_c[0], pi_c[1]],
        [BigInt(publicSignals[0])]
      ];
  
      console.log("proofArray:", proofArray);
      console.log("送信する証明:", formattedProof);
  
      const result = await contract.verifyProof(...formattedProof);
      console.log("Verification result:", result);
  
      if (result) {
        // 🚀 `publicSignals[0]` の値で18歳以上かを判定
        const isAdult = publicSignals[0] === "1";
        setVerificationResult(isAdult ? "✅ 18歳以上です" : "❌ 18歳未満です");
      } else {
        setVerificationResult("⚠️ 無効な証明です");
      }
    } catch (error) {
      console.error("Error verifying proof:", error);
      setVerificationResult("⚠️ 検証エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>ZKP 年齢認証 Dapp</h2>
      <button onClick={connectWallet}>ウォレット接続</button>
      <input type="file" accept="application/json" onChange={handleFileUpload} />
      <button onClick={verifyProof} disabled={!proof || loading}>
         {loading ? "MetaMask で承認待ち..." : "証明を検証"}
      </button>
      <h3>{verificationResult}</h3>
    </div>
  );
}

export default App
