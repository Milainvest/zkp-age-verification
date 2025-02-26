const fs = require("fs");
const { execSync } = require("child_process");

async function generateWitness(wasmFile, inputFile, outputWitness) {
    try {
        console.log(`Generating witness for ${inputFile} using ${wasmFile}`);

        const command = `npx snarkjs wtns calculate ${wasmFile} ${inputFile} ${outputWitness}`;
        execSync(command, { stdio: "inherit" });

        console.log(`✅ Witness file created: ${outputWitness}`);
    } catch (error) {
        console.error("❌ Error generating witness:", error);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error("Usage: node generate_witness.js <wasmFile> <inputFile> <outputWitness>");
    process.exit(1);
}

generateWitness(args[0], args[1], args[2]);
