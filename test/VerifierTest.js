const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");

describe("Verifier Contract", function () {
    let verifier;
    let proof;
    let publicSignals;

    before(async function () {
        const Verifier = await ethers.getContractFactory("Groth16Verifier");
        verifier = await Verifier.deploy();
        await verifier.waitForDeployment();

        console.log(`Verifier deployed at: ${verifier.target}`);

        // `proof.json` を読み込む
        proof = JSON.parse(fs.readFileSync("build/proof.json", "utf-8"));
        publicSignals = JSON.parse(fs.readFileSync("build/public.json", "utf-8"));

        // Ensure publicSignals is an array
        if (!Array.isArray(publicSignals)) {
            publicSignals = [publicSignals];
        }
    });

    it("should verify a valid proof", async function () {
        // Format pi_a: Remove the third coordinate
        const pi_a = [proof.pi_a[0], proof.pi_a[1]];

        // Format pi_b: Reverse x/y coordinates and remove third coordinate
        const pi_b = [
            [proof.pi_b[0][1], proof.pi_b[0][0]], // Swap x,y coordinates
            [proof.pi_b[1][1], proof.pi_b[1][0]]  // Swap x,y coordinates
        ];

        // Format pi_c: Remove the third coordinate
        const pi_c = [proof.pi_c[0], proof.pi_c[1]];

        console.log("Verification inputs:");
        console.log("pi_a:", pi_a);
        console.log("pi_b:", pi_b);
        console.log("pi_c:", pi_c);
        console.log("publicSignals:", publicSignals);

        // Verify the proof
        const isValid = await verifier.verifyProof(
            pi_a,
            pi_b,
            pi_c,
            publicSignals
        );
        await isValid.wait();
        expect(isValid).to.not.be.null;
    });
});
