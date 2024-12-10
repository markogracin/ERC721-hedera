import {
    Client,
    PrivateKey,
    AccountId,
    ContractId,
    ContractCallQuery,
    ContractFunctionParameters, AccountInfoQuery
} from "@hashgraph/sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {getTokenContractId} from "../../utils";

dotenv.config();

async function checkBalance(accountId: string) {
    if (!process.env.OPERATOR_PRIVATE_KEY || !process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variables OPERATOR_PRIVATE_KEY and OPERATOR_ACCOUNT_ID must be present');
    }

    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    try {
        const bidiContractId = getTokenContractId();
        console.log('🔍 Checking BIDI token balance...');
        console.log(`📋 BIDI Contract ID: ${bidiContractId}`);
        console.log(`👤 Account ID: ${accountId}`);

        // Using AccountInfoQuery instead of getAccountInfo
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(AccountId.fromString(accountId))
            .execute(client);

        const evmAddress = accountInfo.contractAccountId;

        if (!evmAddress) {
            throw new Error('Could not get EVM address for account');
        }

        console.log(`🔑 Account EVM Address: ${evmAddress}`);

        const balanceQuery = new ContractCallQuery()
            .setContractId(ContractId.fromString(bidiContractId))
            .setGas(100000)
            .setFunction(
                "balanceOf",
                new ContractFunctionParameters().addAddress(evmAddress)
            );

        const result = await balanceQuery.execute(client);
        const balance = result.getUint256(0).toString();

        console.log('\n✅ Balance retrieved successfully!');
        console.log(`💰 BIDI Token Balance: ${balance}`);

        // Check for allowances if NFT contract exists
        const nftContractIdFile = path.join(process.cwd(), 'nft-contract-id.txt');
        if (fs.existsSync(nftContractIdFile)) {
            const nftContractId = fs.readFileSync(nftContractIdFile, 'utf8').trim();

            // Using AccountInfoQuery for NFT contract info
            const nftContractInfo = await new AccountInfoQuery()
                .setAccountId(AccountId.fromString(nftContractId))
                .execute(client);

            const nftContractEvmAddress = nftContractInfo.contractAccountId;

            if (nftContractEvmAddress) {
                const allowanceQuery = new ContractCallQuery()
                    .setContractId(ContractId.fromString(bidiContractId))
                    .setGas(100000)
                    .setFunction(
                        "allowance",
                        new ContractFunctionParameters()
                            .addAddress(evmAddress)
                            .addAddress(nftContractEvmAddress)
                    );

                const allowanceResult = await allowanceQuery.execute(client);
                const allowance = allowanceResult.getUint256(0).toString();

                console.log(`🔓 Current NFT Contract Allowance: ${allowance}`);
            }
        }

        return balance;

    } catch (error: any) {
        console.error('❌ Error checking balance:', {
            error,
            message: error.message,
            status: error.status?._code,
        });
        throw error;
    } finally {
        client.close();
    }
}

// Get account ID from command line or use operator's account ID
const accountToCheck = process.argv[2] || process.env.OPERATOR_ACCOUNT_ID;

if (!accountToCheck) {
    console.error('❌ Please provide an account ID as argument or set OPERATOR_ACCOUNT_ID in .env');
    process.exit(1);
}

checkBalance(accountToCheck)
    .then(() => {
        console.log('\n🎉 Balance check completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Balance check failed:', error);
        process.exit(1);
    });