require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// .env の値をチェックしてエラーを出す（デバッグ用）
if (!process.env.WALLET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY.length < 64) {
  throw new Error("Invalid WALLET_PRIVATE_KEY. Please check your .env file.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};