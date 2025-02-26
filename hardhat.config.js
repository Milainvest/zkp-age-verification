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
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY]
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY]
    }
  }
};