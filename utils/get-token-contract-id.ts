import path from "path";
import fs from "fs";

export function getTokenContractId(): string {
    const bidiIdFile = path.join(process.cwd(), 'token-contract-id.txt');
    try {
        // Check if the file exists before trying to read it
        if (fs.existsSync(bidiIdFile)) {
            // Read the file and remove any whitespace
            return fs.readFileSync(bidiIdFile, 'utf8').trim();
        }
    } catch (error: any) {
        throw new Error('Unable to read BIDI contract ID file. Error: ' + error.message);
    }
    throw new Error('BIDI token contract ID not found. Please ensure token-contract-id.txt exists.');
}

