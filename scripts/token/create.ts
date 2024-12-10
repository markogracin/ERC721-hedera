import {
    Client,
    PrivateKey,
    AccountId,
    FileCreateTransaction,
    FileAppendTransaction,
    ContractCreateTransaction,
    Hbar,
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function CreateToken() {
    // Validate environment variables
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    // Read the token contract bytecode
    const contractBytecode = JSON.parse(
        fs.readFileSync('artifacts/contracts/CreateToken.sol/CreateToken.json', 'utf8')
    ).bytecode;

    // Initialize Hedera client
    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        console.log('🚀 Starting token contract deployment...');

        // Create file for contract bytecode
        console.log('\n📝 Creating file for token contract...');
        const fileCreateTx = await new FileCreateTransaction()
            .setKeys([operatorKey.publicKey])
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        const fileReceipt = await fileCreateTx.getReceipt(client);
        const bytecodeFileId = fileReceipt.fileId;

        if(!bytecodeFileId) {
            throw new Error('Failed to create bytecode file - no file ID received');
        }

        console.log(`✅ Token bytecode file created with ID: ${bytecodeFileId}`);

        // Upload bytecode in chunks
        console.log('\n📤 Uploading token bytecode...');
        const chunkSize = 4000;
        const bytecodeChunks = [];
        for (let i = 0; i < contractBytecode.length; i += chunkSize) {
            bytecodeChunks.push(contractBytecode.slice(i, i + chunkSize));
        }

        for (let i = 0; i < bytecodeChunks.length; i++) {
            const chunk = bytecodeChunks[i];
            console.log(`Uploading chunk ${i + 1} of ${bytecodeChunks.length}...`);
            const appendTx = await new FileAppendTransaction()
                .setFileId(bytecodeFileId)
                .setContents(chunk)
                .setMaxTransactionFee(new Hbar(5))
                .execute(client);
            await appendTx.getReceipt(client);
        }

        console.log(`🔍 View file on HashScan: https://hashscan.io/testnet/file/${bytecodeFileId}`);

        // Deploy token contract
        console.log('\n⚙️  Creating token contract...');
        const contractTx = await new ContractCreateTransaction()
            .setBytecodeFileId(bytecodeFileId)
            .setGas(1000000)
            .setAdminKey(operatorKey)
            .setMaxTransactionFee(new Hbar(20))
            .execute(client);

        // Wait for consensus
        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractReceipt = await contractTx.getReceipt(client);
        const contractId = contractReceipt.contractId;

        if(!contractId) {
            throw new Error('Failed to create token contract - no contract ID received');
        }

        console.log(`✅ Token Contract created with ID: ${contractId}`);
        console.log(`🔍 View contract on HashScan: https://hashscan.io/testnet/contract/${contractId}`);

        return contractId;

    } catch (error: any) {
        console.error('❌ Error deploying token contract:', {
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

// Run the deployment
CreateToken()
    .then((contractId) => {
        console.log('\n🎉 Token Contract deployment completed successfully!');
        // Save the contract ID to a file for later use
        fs.writeFileSync('token-contract-id.txt', contractId.toString());
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Token Contract deployment failed:', error);
        process.exit(1);
    });