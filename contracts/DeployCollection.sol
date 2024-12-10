// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// todo add metadata to chain, image on IPFS?
// todo pause/resume?

contract DeployCollection is ERC721, Ownable {
    using SafeERC20 for IERC20;

    // Immutable BIDI token contract reference
    IERC20 immutable public bidi;

    // Mapping from token ID to redemption amount
    mapping(uint256 => uint256) private _redemptionAmounts;

    // Mapping from token ID to redemption status
    mapping(uint256 => bool) private _redeemed;

    // Counter for token IDs
    uint256 private _nextTokenId;

    error TokenAlreadyRedeemed(uint256 tokenId);
    error NotTokenOwner(uint256 tokenId, address caller);

    constructor(IERC20 bidi_) ERC721("LeNFT Collection", "LeNEC") Ownable(msg.sender) {
        bidi = bidi_;
    }

    function safeMint(address to, uint256 amount) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _redemptionAmounts[tokenId] = amount;

        // Transfer BIDI tokens from sender to this contract
        bidi.safeTransferFrom(msg.sender, address(this), amount);
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

        // Get redemption amount
        uint256 amount = _redemptionAmounts[tokenId];

        // Transfer BIDI tokens to redeemer
        bidi.safeTransfer(msg.sender, amount);
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