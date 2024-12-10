import {
    Client,
    PrivateKey,
    AccountId,
    ContractId,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    AccountInfoQuery,
    Hbar
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import {getTokenContractId, getNftContractId} from "../../utils";

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

    // Combine whole number with padded decimals, removing any leading zeros
    const fullNumber = wholeNumber + paddedDecimals;

    // Remove leading zeros but keep at least one digit
    return fullNumber.replace(/^0+(?=\d)/, '');
}

// Helper function to format large numbers for display
function formatTokenAmount(amount: string): string {
    // If the number is too big, use scientific notation
    if (amount.length > 24) {
        return `${amount.slice(0, 1)}.${amount.slice(1, 4)}e+${amount.length - 1}`;
    }
    // Otherwise format with commas
    return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function setAllowance(humanReadableAmount: string) {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        // Convert the human-readable amount to token amount
        const tokenAmount = convertToTokenAmount(humanReadableAmount);

        console.log('🚀 Starting allowance setting process...');
        console.log(`💰 Setting allowance to ${humanReadableAmount}`);
        console.log(`🔢 Full token amount: ${formatTokenAmount(tokenAmount)}`);

        // Get contract IDs
        const tokenContractId = getTokenContractId();
        const nftContractId = getNftContractId();

        console.log('📋 Token Contract ID:', tokenContractId);
        console.log('📋 NFT Contract ID:', nftContractId);

        // Get NFT contract's EVM address
        const nftContractInfo = await new AccountInfoQuery()
            .setAccountId(AccountId.fromString(nftContractId))
            .execute(client);

        const nftContractEvmAddress = nftContractInfo.contractAccountId;
        if (!nftContractEvmAddress) {
            throw new Error('Could not get EVM address for NFT contract');
        }

        console.log('🔑 NFT Contract EVM Address:', nftContractEvmAddress);

        // Create and execute the approve transaction
        console.log('\n📝 Executing approve transaction...');
        const approveTx = await new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(tokenContractId))
            .setGas(1000000)
            .setFunction(
                "approve",
                new ContractFunctionParameters()
                    .addAddress(nftContractEvmAddress)
                    .addUint256(tokenAmount)
            )
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        const receipt = await approveTx.getReceipt(client);

        console.log('✅ Allowance set successfully!');
        console.log(`Transaction ID: ${approveTx.transactionId}`);
        console.log(`🔍 View transaction on HashScan: https://hashscan.io/testnet/transaction/${approveTx.transactionId}`);

        return approveTx.transactionId;

    } catch (error: any) {
        console.error('❌ Error setting allowance:', {
            error,
            message: error.message,
            status: error.status?._code,
        });
        throw error;
    } finally {
        client.close();
    }
}

// Get allowance amount from command line
const amount = process.argv[2];

if (!amount) {
    console.error('Usage: node set-allowance.js <amount>');
    console.error('Example: node set-allowance.js 500');
    console.error('Note: Enter the amount in whole tokens - decimals will be handled automatically');
    process.exit(1);
}

setAllowance(amount)
    .then(() => {
        console.log('\n🎉 Allowance setting completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Allowance setting failed:', error);
        process.exit(1);
    });