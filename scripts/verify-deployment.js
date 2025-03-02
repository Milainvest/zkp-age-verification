// scripts/verify-deployment.js
async function main() {
    const address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    
    // Get the contract code at the address
    const code = await ethers.provider.getCode(address);
    
    // If there's code (not "0x"), a contract exists at this address
    if (code !== "0x") {
      console.log("✅ Contract verified at address:", address);
      console.log("Code length:", (code.length - 2) / 2, "bytes");
      
      // Try to interact with the contract
      const Verifier = await ethers.getContractFactory("Groth16Verifier");
      const verifier = Verifier.attach(address);
      
      // Check if the contract has the verifyProof method
      try {
        const methodId = verifier.interface.getSighash("verifyProof");
        console.log("✅ Contract has verifyProof method:", methodId);
      } catch (error) {
        console.log("❌ Contract doesn't have verifyProof method");
      }
    } else {
      console.log("❌ No contract found at address:", address);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });