import {AccountId, Client} from "@hashgraph/sdk";

export async function getContractEvmAddress(client: Client, contractId: string): Promise<string> {
    // Convert the contract ID to AccountId object
    const accountId = AccountId.fromString(contractId);

    // Convert numbers to hex strings and pad them
    const shard = accountId.shard.toString(16).padStart(8, '0');  // 4 bytes = 8 hex chars
    const realm = accountId.realm.toString(16).padStart(8, '0');  // 4 bytes = 8 hex chars
    const num = accountId.num.toString(16).padStart(24, '0');     // 12 bytes = 24 hex chars

    // Concatenate to form the complete address (40 chars) and add '0x' prefix
    const evmAddress = '0x' + shard + realm + num;

    // Verify the address is the correct length (42 chars including '0x')
    if (evmAddress.length !== 42) {
        throw new Error(`Invalid EVM address length: ${evmAddress.length}. Address: ${evmAddress}`);
    }

    return evmAddress;
}
