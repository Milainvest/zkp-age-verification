const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    
    // Wait for deployment to complete
    await verifier.waitForDeployment();
    
    // Get the contract address
    const verifierAddress = await verifier.getAddress();

    
    console.log("Verifier deployed to:", verifierAddress);

    // Verify the contract has the verifyProof method
    try {
        // This is the correct way to check for a function
        const methodId = verifier.interface.getFunction("verifyProof");
        console.log("✅ Contract has verifyProof method:", methodId.selector);
        
        // List all available methods - FIX THIS LINE
        const methods = Object.keys(verifier.interface.functions || {});
        console.log("Available methods:", methods);
    } catch (error) {
        console.log("❌ Error checking verifyProof method");
        console.log("Error:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
        address: verifierAddress,
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber()
    };

    fs.writeFileSync(
        './deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    // Also save to a file that the frontend can easily import
    fs.writeFileSync(
        './frontend/src/contractAddress.json',
        JSON.stringify({ address: verifierAddress }, null, 2)
    );
    
    console.log("✅ Deployment info saved to deployment-info.json and frontend/src/contractAddress.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

