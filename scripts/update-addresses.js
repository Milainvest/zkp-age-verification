const fs = require('fs');
const path = require('path');

async function updateAddresses(network, address) {
  // Read existing addresses
  const contractAddressPath = path.join(__dirname, '../frontend/src/contractAddress.json');
  let addresses = {};
  
  try {
    addresses = JSON.parse(fs.readFileSync(contractAddressPath, 'utf8'));
  } catch (error) {
    console.log('No existing addresses file, creating new one');
  }

  // Update the address for the specified network
  addresses[network] = address;

  // Write back to file
  fs.writeFileSync(
    contractAddressPath,
    JSON.stringify(addresses, null, 2)
  );

  console.log(`Updated ${network} contract address to:`, address);
}

// If running directly
if (require.main === module) {
  const network = process.argv[2];
  const address = process.argv[3];
  
  if (!network || !address) {
    console.error('Usage: node update-addresses.js <network> <address>');
    process.exit(1);
  }

  updateAddresses(network, address)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports.updateAddresses = updateAddresses; 