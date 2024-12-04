// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, Ownable {
    // Mapping from token ID to redemption amount
    mapping(uint256 => uint256) private _redemptionAmounts;

    // Mapping from token ID to redemption status
    mapping(uint256 => bool) private _redeemed;

    // Counter for token IDs
    uint256 private _nextTokenId;

    error TokenAlreadyRedeemed(uint256 tokenId);
    error NotTokenOwner(uint256 tokenId, address caller);

    constructor() ERC721("Basic NFT Collection", "BNCol") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _redemptionAmounts[tokenId] = amount;
        return tokenId;
    }

    function redeem(uint256 tokenId) public {
        // Check: verify ownership
        if (ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner(tokenId, msg.sender);
        }

        // Check: verify not already redeemed
        if (_redeemed[tokenId]) {
            revert TokenAlreadyRedeemed(tokenId);
        }

        // Effect: mark as redeemed before interaction
        _redeemed[tokenId] = true;

        // Later we'll add the token transfer logic here
        // For now we'll just have the redemption tracking
    }

    function isRedeemed(uint256 tokenId) public view returns (bool) {
        // ownerOf will revert if token doesn't exist
        ownerOf(tokenId);
        return _redeemed[tokenId];
    }

    function getRedemptionAmount(uint256 tokenId) public view returns (uint256) {
        // ownerOf will revert if token doesn't exist
        ownerOf(tokenId);
        return _redemptionAmounts[tokenId];
    }
}