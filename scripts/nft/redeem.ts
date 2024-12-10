import {
    Client,
    PrivateKey,
    AccountId,
    ContractExecuteTransaction,
    ContractId,
    Hbar,
    ContractFunctionParameters
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import {getNftContractId} from "../../utils";

dotenv.config();

// todo has to be done via user interface, as the secrets management sucks like this
async function redeemNFT(tokenId: string) {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        // Get the NFT contract ID
        const contractId = getNftContractId()

        console.log('🚀 Starting NFT redemption process...');
        console.log(`📋 NFT Contract ID: ${contractId}`);
        console.log(`🎨 Token ID: ${tokenId}`);
        console.log(`👤 Redeeming to account: ${process.env.OPERATOR_ACCOUNT_ID}\n`);

        // Execute the redeem transaction
        console.log('📝 Executing redeem transaction...');
        const redeemTx = await new ContractExecuteTransaction()
            .setContractId(ContractId.fromString(contractId))
            .setGas(1000000)
            .setFunction(
                "redeem",
                new ContractFunctionParameters().addUint256(tokenId)
            )
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        // Get receipt to confirm success
        const receipt = await redeemTx.getReceipt(client);

        console.log('\n✅ NFT redeemed successfully!');
        console.log(`Transaction ID: ${redeemTx.transactionId}`);
        console.log(`🔍 View transaction on HashScan: https://hashscan.io/testnet/transaction/${redeemTx.transactionId}`);

        return redeemTx.transactionId;
    } catch (error: any) {
        console.error('❌ Error redeeming NFT:', {
            error,
            message: error.message,
            status: error.status?._code,
        });
        throw error;
    } finally {
        client.close();
    }
}

// Get token ID from command line
const tokenId = process.argv[2];

if (!tokenId) {
    console.error('Usage: node redeem.js <tokenId>');
    console.error('Example: node redeem.js 0');
    process.exit(1);
}

redeemNFT(tokenId)
    .then(() => {
        console.log('\n🎉 Redemption completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Redemption failed:', error);
        process.exit(1);
    });