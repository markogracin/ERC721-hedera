import dotenv from 'dotenv';

dotenv.config();

// Helper function to convert EVM address to Hedera Account ID
export function evmToAccountId(evmAddress: string): string {
    const cleanAddress = evmAddress.replace('0x', '').replace(/^0+/, '');

    const accountNum = parseInt(cleanAddress, 16);

    return `0.0.${accountNum}`;
}