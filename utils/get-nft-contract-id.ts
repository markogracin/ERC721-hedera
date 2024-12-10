import path from "path";
import fs from "fs";

export function getNftContractId(): string {
    const nftIdFile = path.join(process.cwd(), 'nft-contract-id.txt');
    try {
        if (fs.existsSync(nftIdFile)) {
            return fs.readFileSync(nftIdFile, 'utf8').trim();
        }
    } catch (error: any) {
        throw new Error('Unable to read NFT contract ID file. Error: ' + error.message);
    }
    throw new Error('NFT contract ID not found. Please ensure nft-contract-id.txt exists.');
}