import {
    Client,
    PrivateKey,
    AccountId,
    FileCreateTransaction,
    FileAppendTransaction,
    ContractCreateTransaction,
    Hbar,
    ContractFunctionParameters,
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function deployContract() {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const contractBytecode = JSON.parse(
        fs.readFileSync('artifacts/contracts/HelloWorld.sol/HelloWorld.json', 'utf8')
    ).bytecode;

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        console.log('🚀 Starting deployment process...');

        console.log('\n📝 Creating file on Hedera...');
        const fileCreateTx = await new FileCreateTransaction()
            .setKeys([operatorKey.publicKey])
            .setContents(contractBytecode)
            .setMaxTransactionFee(new Hbar(2))
            .execute(client);

        const fileReceipt = await fileCreateTx.getReceipt(client);
        const bytecodeFileId = fileReceipt.fileId;

        if(!bytecodeFileId) {
            console.error('❌ Failed to create bytecode file - no file ID received');
            return;
        }

        console.log(`✅ Contract bytecode file created with ID: ${bytecodeFileId}`);
        console.log(`🔍 View file on HashScan: https://hashscan.io/testnet/file/${bytecodeFileId}`);

        console.log('\n⚙️  Creating contract...');
        const contractTx = await new ContractCreateTransaction()
            .setBytecodeFileId(bytecodeFileId)
            .setGas(500000)
            .setConstructorParameters(
                new ContractFunctionParameters().addString("Hello from Hedera!")
            )
            .setMaxTransactionFee(new Hbar(20))
            .execute(client);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractReceipt = await contractTx.getReceipt(client);
        const contractId = contractReceipt.contractId;

        if(!contractId) {
            console.error('❌ Failed to create contract - no contract ID received');
            return;
        }

        console.log(`✅ Contract created with ID: ${contractId}`);
        console.log(`🔍 View contract on HashScan: https://hashscan.io/testnet/contract/${contractId}`);
        return contractId;

    } catch (error: any) {
        console.error('❌ Error deploying contract:', {
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

deployContract()
    .then((contractId) => {
        if (contractId) {
            console.log('\n🎉 Deployment completed successfully!');
        } else {
            console.log('\n❌ Deployment failed - no contract ID returned');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    });