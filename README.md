## How to run
- run `npm run i`


- copy content from `.env.example` to `.env` and fill the info

## Create a ERC20 token
- if no token was created yet, run `npm run create-token` 
```html
🚀 Starting token contract deployment...

📝 Creating file for token contract...
✅ Token bytecode file created with ID: 0.0.5233926

📤 Uploading token bytecode...
Uploading chunk 1 of 4...
Uploading chunk 2 of 4...
Uploading chunk 3 of 4...
Uploading chunk 4 of 4...
🔍 View file on HashScan: https://hashscan.io/testnet/file/0.0.5233926

⚙️  Creating token contract...
✅ Token Contract created with ID: 0.0.5233928
🔍 View contract on HashScan: https://hashscan.io/testnet/contract/0.0.5233928

🎉 Token Contract deployment completed successfully!

```

## Deploy ERC721 contract (NFT collection)
- after the token was created, we will deploy an NFT collection associated to the created token by running `npm run deploy-collection`
```html
🚀 Starting NFT contract deployment process...
📌 Using previus created token Hedera address: 0.0.5233928
📌 Converted to EVM address: 0x00000000000000000000000000000000004fdd08
📏 EVM address length: 42 characters

📝 Creating file on Hedera...
✅ Contract bytecode file created with ID: 0.0.5233958

📤 Uploading contract bytecode in chunks...
Uploading chunk 1 of 6...
Uploading chunk 2 of 6...
Uploading chunk 3 of 6...
Uploading chunk 4 of 6...
Uploading chunk 5 of 6...
Uploading chunk 6 of 6...
🔍 View file on HashScan: https://hashscan.io/testnet/file/0.0.5233958

⚙️  Creating NFT contract...
✅ NFT Contract created with ID: 0.0.5233960
🔍 View contract on HashScan: https://hashscan.io/testnet/contract/0.0.5233960
✅ NFT Contract EVM address: 0x00000000000000000000000000000000004fdd28

🎉 NFT Contract deployment completed successfully!

```

## Get all user ERC721 contracts
to get all ERC721 contracts created by user, run `npm run get-collections`
```html
🔍 Fetching contracts from account: 0.0.4425801

Found 24 contracts:

Contract ID: 0.0.5233960
Collection Name: NFT Collection Test 022
Symbol: NFTkn022
Created: 12/9/2024, 4:35:33 PM
Admin Key: ED25519
Auto Renew Account ID: None
File ID: 0.0.5233958
View on HashScan: https://hashscan.io/testnet/contract/0.0.5233960
----------------------------------------

Contract ID: 0.0.5233928
Collection Name: Unable to fetch
Symbol: Unable to fetch
Created: 12/9/2024, 4:30:11 PM
Admin Key: ED25519
Auto Renew Account ID: None
File ID: 0.0.5233926
View on HashScan: https://hashscan.io/testnet/contract/0.0.5233928
----------------------------------------

....
```

## Set NFT Token allowance
let's say we want to mint 5 NFTs, each with tied amount of 100 tokens we created earlier. run `ts-node scripts/token/set-allowance.ts 500`
```html
🚀 Starting allowance setting process...
💰 Setting allowance to 500
🔢 Full token amount: 500,000,000,000,000,000,000
📋 Token Contract ID: 0.0.5233928
📋 NFT Contract ID: 0.0.5233960
🔑 NFT Contract EVM Address: 00000000000000000000000000000000004fdd28

📝 Executing approve transaction...
✅ Allowance set successfully!
Transaction ID: 0.0.4425801@1733759348.878777100
🔍 View transaction on HashScan: https://hashscan.io/testnet/transaction/0.0.4425801@1733759348.878777100

🎉 Allowance setting completed successfully!

```

## Mint NFT to a user account
to mint a token for a particular user, for example, a NFT worth 100 tokens, run `ts-node scripts/nft/mint.ts [ACCOUNT_ID] [NUMBER_OF_TOKENS]`
```html
📋 Using contract ID from nft-contract-id.txt file
🚀 Starting NFT minting process...
NFT Contract ID: 0.0.5233960
BIDI Contract ID: 0.0.5233928
Recipient ID: 0.0.4425801
Amount of BIDI to lock: 100 (100000000000000000000 wei)
Recipient EVM address: 0000000000000000000000000000000000438849
NFT Contract EVM address: 00000000000000000000000000000000004fdd28
Operator EVM address: 0000000000000000000000000000000000438849
Recipient EVM address: 0000000000000000000000000000000000438849
NFT Contract EVM address: 00000000000000000000000000000000004fdd28

📝 Executing safeMint transaction...

✅ NFT minted successfully!
Transaction ID: 0.0.4425801@1733759491.186062579
🔍 View transaction on HashScan: https://hashscan.io/testnet/transaction/0.0.4425801@1733759491.186062579

🎉 NFT minting completed successfully!

```

## List all NFTs in the collection
to see the list of all tokens minted, run `ts-node scripts/nft/list.ts`

```html
📋 Using contract ID from nft-contract-id.txt file
🔍 Scanning collection at contract ID: 0.0.5233960

🎨 NFT #0:
👤 Owner (EVM): 0000000000000000000000000000000000438849
👤 Owner (Hedera): 0.0.4425801
💰 Redemption Amount (formatted): 100 BIDI
📊 Raw Amount in Contract: 100000000000000000000
🔑 Status: 🟢 Available - BIDI tokens locked and ready for redemption
-------------------

✅ Total NFTs found: 1
```