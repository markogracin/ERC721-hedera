import {
    Client,
    PrivateKey,
    AccountId,
    ContractId,
    ContractCallQuery,
    ContractFunctionParameters
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {formatTokenAmount} from "../../utils";
import {evmToAccountId} from "../../utils/evm-to-account-id";

dotenv.config();

// Helper function to get contract ID from different sources
function getContractId(): string {
    // First, check if a contract ID was provided as a command line argument
    const commandLineId = process.argv[2];
    if (commandLineId) {
        console.log('📋 Using contract ID from command line argument');
        return commandLineId;
    }

    // If no command line argument, try to read from the file
    const contractIdFile = path.join(process.cwd(), 'nft-contract-id.txt');
    try {
        if (fs.existsSync(contractIdFile)) {
            const fileContractId = fs.readFileSync(contractIdFile, 'utf8').trim();
            console.log('📋 Using contract ID from nft-contract-id.txt file');
            return fileContractId;
        }
    } catch (error) {
        // If there's any error reading the file, we'll handle it in the error case below
    }

    // If we couldn't get a contract ID from either source, throw an error
    throw new Error('No contract ID provided. Please either provide it as a command line argument or ensure nft-contract-id.txt exists.');
}

async function fetchTokens() {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        const contractId = getContractId();
        console.log(`🔍 Scanning collection at contract ID: ${contractId}\n`);

        let tokenId = 0;
        let tokensFound = 0;

        while (true) {
            try {
                // Query owner information
                const ownerQuery = new ContractCallQuery()
                    .setContractId(ContractId.fromString(contractId))
                    .setGas(100000)
                    .setFunction("ownerOf", new ContractFunctionParameters().addUint256(tokenId));

                // Query redemption amount
                const amountQuery = new ContractCallQuery()
                    .setContractId(ContractId.fromString(contractId))
                    .setGas(100000)
                    .setFunction("getRedemptionAmount", new ContractFunctionParameters().addUint256(tokenId));

                // Query redemption status
                const redeemedQuery = new ContractCallQuery()
                    .setContractId(ContractId.fromString(contractId))
                    .setGas(100000)
                    .setFunction("isRedeemed", new ContractFunctionParameters().addUint256(tokenId));

                // Execute all queries
                const owner = (await ownerQuery.execute(client)).getAddress(0);
                const rawAmount = (await amountQuery.execute(client)).getUint256(0).toString();
                const isRedeemed = (await redeemedQuery.execute(client)).getBool(0);

                // Format the amount for human readability
                const formattedAmount = formatTokenAmount(rawAmount);

                // Create redemption status indicator
                const redemptionStatus = isRedeemed
                    ? '🔴 Redeemed - BIDI tokens already claimed'
                    : '🟢 Available - BIDI tokens locked and ready for redemption';

                // Display token information with enhanced details
                console.log(`🎨 NFT #${tokenId}:`);
                console.log(`👤 Owner (EVM): ${owner}`);
                console.log(`👤 Owner (Hedera): ${evmToAccountId(owner)}`);
                console.log(`💰 Redemption Amount (formatted): ${formattedAmount}`);
                console.log(`📊 Raw Amount in Contract: ${rawAmount}`);
                console.log(`🔑 Status: ${redemptionStatus}`);
                console.log('-------------------');

                tokensFound++;
                tokenId++;
            } catch (error) {
                if (tokensFound > 0) {
                    console.log(`\n✅ Total NFTs found: ${tokensFound}`);
                } else {
                    console.log('❌ No tokens found in collection');
                }
                break;
            }
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message || error);
        throw error;
    } finally {
        client.close();
    }
}

fetchTokens().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});