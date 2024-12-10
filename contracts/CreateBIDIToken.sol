// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreateToken is ERC20, Ownable {
    constructor() ERC20("TestingBIDI token", "TestBIDI") Ownable(msg.sender) {

        // Mint initial supply to the contract creator (todo is this the right amount / should it be editable?)
        _mint(msg.sender, 1000000 * 10**18);
    }
}