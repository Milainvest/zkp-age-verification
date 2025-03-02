async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();

  await verifier.waitForDeployment();
  const address = await verifier.getAddress();

  console.log("Verifier deployed to:", address);
  
  // Save to a file that can be easily accessed
  const fs = require("fs");
  fs.writeFileSync(
    "./frontend/src/contractAddress.json",
    JSON.stringify({ address }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 