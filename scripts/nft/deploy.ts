import {
    Client,
    PrivateKey,
    AccountId,
    FileCreateTransaction,
    FileAppendTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    Hbar,
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import {getTokenContractId, getContractEvmAddress} from "../../utils";

dotenv.config();

async function deployCollection(tokenAddress: string) {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const contractBytecode = JSON.parse(
        fs.readFileSync('artifacts/contracts/DeployCollection.sol/DeployCollection.json', 'utf8')
    ).bytecode;

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        console.log('🚀 Starting NFT contract deployment process...');
        console.log(`📌 Using previus created token Hedera address: ${tokenAddress}`);

        // Convert Hedera address to EVM address with proper padding
        const evmAddress = await getContractEvmAddress(client, tokenAddress);
        console.log(`📌 Converted to EVM address: ${evmAddress}`);
        console.log(`📏 EVM address length: ${evmAddress.length} characters`);

        // Create file
        console.log('\n📝 Creating file on Hedera...');
        const fileCreateTx = await new FileCreateTransaction()
            .setKeys([operatorKey.publicKey])
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);

        const fileReceipt = await fileCreateTx.getReceipt(client);
        const bytecodeFileId = fileReceipt.fileId;

        if(!bytecodeFileId) {
            throw new Error('Failed to create bytecode file - no file ID received');
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

        // Create contract with constructor parameters using properly padded EVM address
        console.log('\n⚙️  Creating NFT contract...');
        const contractTx = await new ContractCreateTransaction()
            .setBytecodeFileId(bytecodeFileId)
            .setGas(1000000)
            .setConstructorParameters(
                new ContractFunctionParameters().addAddress(evmAddress)
            )
            .setAdminKey(operatorKey)
            .setMaxTransactionFee(new Hbar(20))
            .execute(client);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractReceipt = await contractTx.getReceipt(client);
        const contractId = contractReceipt.contractId;

        if(!contractId) {
            throw new Error('Failed to create NFT contract - no contract ID received');
        }

        console.log(`✅ NFT Contract created with ID: ${contractId}`);
        console.log(`🔍 View contract on HashScan: https://hashscan.io/testnet/contract/${contractId}`);

        // Get and log the EVM address of the new contract
        const nftEvmAddress = await getContractEvmAddress(client, contractId.toString());
        console.log(`✅ NFT Contract EVM address: ${nftEvmAddress}`);

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

let tokenAddress = getTokenContractId()

deployCollection(tokenAddress)
    .then((contractId) => {
        if (contractId) {
            console.log('\n🎉 NFT Contract deployment completed successfully!');
            // Save the contract ID for future reference
            fs.writeFileSync('nft-contract-id.txt', contractId.toString());
        } else {
            console.log('\n❌ NFT Contract deployment failed - no contract ID returned');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ NFT Contract deployment failed:', error);
        process.exit(1);
    });