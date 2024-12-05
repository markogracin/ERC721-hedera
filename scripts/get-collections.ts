import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function decodeHexString(hex: string): string {
    // Remove '0x' prefix if present
    hex = hex.replace('0x', '');

    // Convert hex to string until we hit a null character
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode === 0) break; // Stop at null terminator
        str += String.fromCharCode(charCode);
    }
    return str;
}

async function getContractInfo(baseUrl: string, contractId: string) {
    try {
        // Get basic contract info
        const contractResponse = await axios.get(`${baseUrl}/api/v1/contracts/${contractId}`);

        try {
            const stateResponse = await axios.get(`${baseUrl}/api/v1/contracts/${contractId}/state`);

            // Find name and symbol in state
            const states = stateResponse.data.state || [];
            const nameState = states.find((s: any) => s.slot.endsWith('0'));
            const symbolState = states.find((s: any) => s.slot.endsWith('1'));

            const name = nameState ? decodeHexString(nameState.value) : 'Unable to fetch';
            const symbol = symbolState ? decodeHexString(symbolState.value) : 'Unable to fetch';

            return {
                contract: contractResponse.data,
                name,
                symbol
            };
        } catch (callError: any) {
            console.log('Error fetching contract state:', callError.message);
            return {
                contract: contractResponse.data,
                name: 'Unable to fetch',
                symbol: 'Unable to fetch'
            };
        }
    } catch (err) {
        return {
            contract: null,
            name: 'Unable to fetch',
            symbol: 'Unable to fetch'
        };
    }
}

function formatTimestamp(timestamp: string): string {
    const milliseconds = Number(timestamp) * 1000;
    return new Date(milliseconds).toLocaleString();
}

function formatAdminKey(key: any): string {
    if (!key) return 'None';
    if (key._type) return key._type;
    if (typeof key === 'object') return JSON.stringify(key);
    return String(key);
}

async function getContractsForAccount() {
    if (!process.env.OPERATOR_ACCOUNT_ID) {
        throw new Error('Environment variable OPERATOR_ACCOUNT_ID must be present');
    }

    const accountId = process.env.OPERATOR_ACCOUNT_ID;
    const baseUrl = 'https://testnet.mirrornode.hedera.com';

    try {
        console.log(`🔍 Fetching contracts from account: ${accountId}\n`);

        const response = await axios.get(`${baseUrl}/api/v1/transactions`, {
            params: {
                'account.id': accountId,
                transactiontype: 'CONTRACTCREATEINSTANCE',
                order: 'desc',
                result: 'SUCCESS',
                // limit: 5  todo check if limit is needed
            }
        });

        if (!response.data.transactions || response.data.transactions.length === 0) {
            console.log('No contracts found for this account.');
            return;
        }

        console.log(`Found ${response.data.transactions.length} contracts:`);
        for (const tx of response.data.transactions) {
            const contractId = tx.entity_id;
            const { contract, name, symbol } = await getContractInfo(baseUrl, contractId);

            if (contract) {
                console.log(`
Contract ID: ${contractId}
Collection Name: ${name}
Symbol: ${symbol}
Created: ${formatTimestamp(tx.consensus_timestamp)}
Admin Key: ${formatAdminKey(contract.admin_key)}
Auto Renew Account ID: ${contract.auto_renew_account_id || 'None'}
File ID: ${contract.file_id || 'None'}
View on HashScan: https://hashscan.io/testnet/contract/${contractId}
----------------------------------------`);
            } else {
                console.log(`
Contract ID: ${contractId}
Created: ${formatTimestamp(tx.consensus_timestamp)}
[Additional details unavailable]
View on HashScan: https://hashscan.io/testnet/contract/${contractId}
----------------------------------------`);
            }
        }

    } catch (error: any) {
        if (error.response?.data?._status?.messages) {
            console.error('❌ API Error:', error.response.data._status.messages);
        }
        console.error('❌ Error fetching contracts:', {
            message: error.message,
            status: error.response?.status
        });
        throw error;
    }
}

getContractsForAccount()
    .then(() => {
        console.log('\n✅ Contract fetch completed');
        process.exit(0);
    })
    .catch((error) => {
        process.exit(1);
    });