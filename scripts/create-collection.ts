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

async function createCollection() {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const contractBytecode = JSON.parse(
        fs.readFileSync('artifacts/contracts/CreateCollection.sol/CreateCollection.json', 'utf8')
    ).bytecode;

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        console.log('🚀 Starting NFT contract deployment process...');

        // Create file
        console.log('\n📝 Creating file on Hedera...');
        const fileCreateTx = await new FileCreateTransaction()
            .setKeys([operatorKey.publicKey])
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        const fileReceipt = await fileCreateTx.getReceipt(client);
        const bytecodeFileId = fileReceipt.fileId;

        if(!bytecodeFileId) {
            console.error('❌ Failed to create bytecode file - no file ID received');
            return;
        }

        console.log(`✅ Contract bytecode file created with ID: ${bytecodeFileId}`);

        // Append contents in chunks
        console.log('\n📤 Uploading contract bytecode in chunks...');
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

        // Create contract
        console.log('\n⚙️  Creating NFT contract...');
        const contractTx = await new ContractCreateTransaction()
            .setBytecodeFileId(bytecodeFileId)
            .setGas(1000000)
            .setAdminKey(operatorKey)  // Set the admin key to the operator's key
            .setMaxTransactionFee(new Hbar(20))
            .execute(client);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractReceipt = await contractTx.getReceipt(client);
        const contractId = contractReceipt.contractId;

        if(!contractId) {
            console.error('❌ Failed to create NFT contract - no contract ID received');
            return;
        }

        console.log(`✅ NFT Contract created with ID: ${contractId}`);
        console.log(`🔍 View contract on HashScan: https://hashscan.io/testnet/contract/${contractId}`);
        return contractId;

    } catch (error: any) {
        console.error('❌ Error deploying NFT contract:', {
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

createCollection()
    .then((contractId) => {
        if (contractId) {
            console.log('\n🎉 NFT Contract deployment completed successfully!');
        } else {
            console.log('\n❌ NFT Contract deployment failed - no contract ID returned');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ NFT Contract deployment failed:', error);
        process.exit(1);
    });