# Example ERC721 contract in Hedera

## How to run
- run `npm run generate`

- copy content from `.env.example` to `.env` and fill the info

- to create a `ERC721` contract (collection), run `npm run create-collection`
preview: 
```html
🚀 Starting NFT contract deployment process...

📝 Creating file on Hedera...
✅ Contract bytecode file created with ID: 0.0.5215260

📤 Uploading contract bytecode in chunks...
Uploading chunk 1 of 6...
Uploading chunk 2 of 6...
Uploading chunk 3 of 6...
Uploading chunk 4 of 6...
Uploading chunk 5 of 6...
Uploading chunk 6 of 6...
🔍 View file on HashScan: https://hashscan.io/testnet/file/0.0.5215260

⚙️  Creating NFT contract...
✅ NFT Contract created with ID: 0.0.5215261
🔍 View contract on HashScan: https://hashscan.io/testnet/contract/0.0.5215261

```

- to see all created contracts, run `npm run get-collections`
preview:
```html
🔍 Fetching contracts from account: 0.0.4425801

Found 5 contracts:

Contract ID: 0.0.5215261
Collection Name: Basic NFT Collection
Symbol: BNCol
Created: 12/5/2024, 9:49:01 AM
Admin Key: ED25519
Auto Renew Account ID: None
File ID: 0.0.5215260
View on HashScan: https://hashscan.io/testnet/contract/0.0.5215261

... other contracts
```

## Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```