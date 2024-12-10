import {
    Client,
    PrivateKey,
    AccountId,
    ContractExecuteTransaction,
    Hbar,
    ContractId,
    AccountInfoQuery,
    ContractFunctionParameters,
    ContractCallQuery,
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {getTokenContractId} from "../../utils";

// Load environment variables from .env file
dotenv.config();

// Helper function to convert human-readable numbers to token amounts with 18 decimals
function convertToTokenAmount(amount: string): string {
    // Remove any commas from the input
    const cleanAmount = amount.replace(/,/g, '');

    // Verify the input is a valid number
    if (!/^\d+\.?\d*$/.test(cleanAmount)) {
        throw new Error('Invalid amount. Please enter a valid number.');
    }

    // Split on decimal point if it exists
    const parts = cleanAmount.split('.');
    const wholeNumber = parts[0];
    const decimals = parts[1] || '';

    // Pad with zeros or truncate decimals to 18 places
    const paddedDecimals = decimals.padEnd(18, '0').slice(0, 18);

    // Combine whole number with padded decimals
    const fullNumber = wholeNumber + paddedDecimals;

    // Remove leading zeros but keep at least one digit
    return fullNumber.replace(/^0+(?=\d)/, '');
}

// Helper function to check token allowance between accounts
async function checkTokenAllowance(
    client: Client,
    tokenContractId: string,
    ownerAddress: string,
    spenderAddress: string
): Promise<string> {
    const allowanceQuery = new ContractCallQuery()
        .setContractId(ContractId.fromString(tokenContractId))
        .setGas(100000)
        .setFunction(
            "allowance",
            new ContractFunctionParameters()
                .addAddress(ownerAddress)
                .addAddress(spenderAddress)
        );

    const allowanceResult = await allowanceQuery.execute(client);
    return allowanceResult.getUint256(0).toString();
}

// Main minting function
async function mintNFT(recipientId: string, humanReadableAmount: string) {
    // Validate environment variables
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    // Initialize Hedera client
    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        // Convert the human-readable amount to token amount with proper decimals
        const amount = convertToTokenAmount(humanReadableAmount);

        // Get contract IDs and validate they exist
        const nftContractId = getContractId();
        const tokenContractId = getTokenContractId();

        console.log('🚀 Starting NFT minting process...');
        console.log(`NFT Contract ID: ${nftContractId}`);
        console.log(`BIDI Contract ID: ${tokenContractId}`);
        console.log(`Recipient ID: ${recipientId}`);
        console.log(`Amount of BIDI to lock: ${humanReadableAmount} (${amount} wei)`);

        // Get the recipient's EVM address
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(AccountId.fromString(recipientId))
            .execute(client);

        const recipientEvmAddress = accountInfo.contractAccountId;
        if (!recipientEvmAddress) {
            throw new Error('Could not get EVM address for recipient account');
        }

        // Get the NFT contract's EVM address
        const nftContractInfo = await new AccountInfoQuery()
            .setAccountId(AccountId.fromString(nftContractId))
            .execute(client);

        const nftContractEvmAddress = nftContractInfo.contractAccountId;
        if (!nftContractEvmAddress) {
            throw new Error('Could not get EVM address for NFT contract');
        }

        console.log(`Recipient EVM address: ${recipientEvmAddress}`);
        console.log(`NFT Contract EVM address: ${nftContractEvmAddress}`);


        const operatorInfo = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .execute(client);

        const operatorEvmAddress = operatorInfo.contractAccountId;
        if (!operatorEvmAddress) {
            throw new Error('Could not get EVM address for operator account');
        }

        console.log(`Operator EVM address: ${operatorEvmAddress}`);
        console.log(`Recipient EVM address: ${recipientEvmAddress}`);
        console.log(`NFT Contract EVM address: ${nftContractEvmAddress}`);

        // Check admin's token allowance
        const allowance = await checkTokenAllowance(
            client,
            tokenContractId,
            operatorEvmAddress,  // Changed from recipientEvmAddress
            nftContractEvmAddress
        );

        // Compare amounts and ensure sufficient allowance
        if (BigInt(allowance) < BigInt(amount)) {
            console.log('\n⚠️  Warning: Insufficient BIDI token allowance');
            console.log('Please approve the NFT contract to spend your BIDI tokens first');
            console.log('Required allowance:', amount);
            console.log('Current allowance:', allowance);
            throw new Error('Insufficient BIDI token allowance');
        }

        // Execute the safeMint transaction
        console.log('\n📝 Executing safeMint transaction...');
        const mintTx = await new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(nftContractId))
            .setGas(1000000)
            .setFunction(
                "safeMint",
                new ContractFunctionParameters()
                    .addAddress(recipientEvmAddress)
                    .addUint256(amount)
            )
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        // Get receipt to confirm success
        const mintReceipt = await mintTx.getReceipt(client);

        console.log(`\n✅ NFT minted successfully!`);
        console.log(`Transaction ID: ${mintTx.transactionId}`);
        console.log(`🔍 View transaction on HashScan: https://hashscan.io/testnet/transaction/${mintTx.transactionId}`);

        return mintTx.transactionId;

    } catch (error: any) {
        console.error('❌ Error minting NFT:', {
            error,
            message: error.message,
            status: error.status?._code,
            transactionId: error.transactionId?.toString()
        });
        throw error;
    } finally {
        client.close();
    }
}

// Get command line arguments, removing 'node' and script name
const args = process.argv.slice(2);

// Define usage message
const usageMessage = `
Usage: node mint.js <recipientId> <amount> [contractId]
  recipientId: Hedera account ID of the recipient (e.g., 0.0.1234567)
  amount: Amount of BIDI tokens to lock (e.g., 1000)
  contractId: (Optional) NFT contract ID - will use nft-contract-id.txt if not provided

Examples:
  node mint.js 0.0.1234567 1000
  node mint.js 0.0.1234567 1000 0.0.9876543
`;

// Validate required parameters
if (args.length < 2) {
    console.error('❌ Error: Missing required parameters');
    console.error(usageMessage);
    process.exit(1);
}

// Extract parameters
const recipientId = args[0];
const amount = args[1];
const commandLineContractId = args[2];

// Function to get contract ID from command line or file
function getContractId(): string {
    if (commandLineContractId) {
        console.log('📋 Using contract ID from command line argument');
        return commandLineContractId;
    }

    const contractIdFile = path.join(process.cwd(), 'nft-contract-id.txt');
    try {
        if (fs.existsSync(contractIdFile)) {
            const fileContractId = fs.readFileSync(contractIdFile, 'utf8').trim();
            console.log('📋 Using contract ID from nft-contract-id.txt file');
            return fileContractId;
        }
    } catch (error) {
        // Handle in the error case below
    }

    throw new Error('No contract ID provided. Please either provide it as the third argument or ensure nft-contract-id.txt exists.');
}

// Execute the minting process
mintNFT(recipientId, amount)
    .then((transactionId) => {
        console.log('\n🎉 NFT minting completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ NFT minting failed:', error);
        process.exit(1);
    });