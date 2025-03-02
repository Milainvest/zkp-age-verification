// scripts/verify-contract.js
const hre = require("hardhat");
const fs = require('fs');

async function main() {
    // Read the deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
    const contractAddress = deploymentInfo.address;
    
    console.log("Verifying contract at address:", contractAddress);
    
    // Get the contract instance
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = Verifier.attach(contractAddress);
    
    // Check if the contract exists
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        console.log("❌ No contract found at address:", contractAddress);
        return;
    }
    
    console.log("✅ Contract exists at address:", contractAddress);
    console.log("Code size:", (code.length - 2) / 2, "bytes");
    
    // List all function selectors
    console.log("\nFunction selectors:");
    for (const fnName in verifier.interface.functions) {
        const fn = verifier.interface.functions[fnName];
        console.log(`- ${fnName}: ${fn.selector}`);
    }
    
    // Try to call the verifyProof function with dummy data
    try {
        // Create dummy proof data
        const dummyProof = {
            "pi_a": [
                "11722547224258014112991596698045258980509677957369536218802171036833949872320",
                "10358514414354764419490116641537836141029086263058824154466165436861148074995"
               ],
               "pi_b": [
                [
                 "20175962710897900876212955945279678459960099009819022481200166291300780721134",
                 "11308190555519699123757596868675637933507185710551884781016620433521484835943"
                ],
                [
                 "29097516367777810767696654198813631542204746804006489211230873642746300708",
                 "5616154850111065938745036848198882631758144421723196514033403708933567584500"
                ]
               ],
               "pi_c": [
                "2808552760192891946342006753435269173268442543437816419249139071092912891093",
                "8809443351295471928700065964547909337143138823587095803535053827105843958480"
               ],
            publicSignals: ["1"]
        };

            // Format the proof correctly for the verifier contract
        const formattedProof = {
            pA: [dummyProof.pi_a[0], dummyProof.pi_a[1]],
            pB: [
                [dummyProof.pi_b[0][1], dummyProof.pi_b[0][0]], // Note the swap here
                [dummyProof.pi_b[1][1], dummyProof.pi_b[1][0]]  // Note the swap here
            ],
            pC: [dummyProof.pi_c[0], dummyProof.pi_c[1]],
            pubSignals: dummyProof.publicSignals
        };
        
        // This will fail with invalid proof but confirms the function exists
        const result = await verifier.verifyProof.staticCall(
            formattedProof.pA,
            formattedProof.pB,
            formattedProof.pC,
            formattedProof.pubSignals
        );
        
        console.log("\n✅ Successfully called verifyProof function");
        console.log("Result:", result);
    } catch (error) {
        if (error.message.includes("revert")) {
            console.log("\n✅ verifyProof function exists but reverted (expected with dummy data)");
        } else {
            console.log("\n❌ Error calling verifyProof function:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });