// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Whitelist {

    // maximum number of whitelisted addresses alowed
    uint8 public maxWhitelistedAddresses;

    // if an address is whitelisted, we would set it to true, it is false bydefault for all addresses
    mapping(address=>bool) public whitelistedAddresses; 

    //we would keep the track of number of addresses whitelisted
    uint8 public numAddressesWhitelisted;

    // contract deployer will set the value of maximum number of whitelistedAddresses
    constructor(uint8 _maxWhitelistedAddresses){
        maxWhitelistedAddresses = _maxWhitelistedAddresses;
    }


    // This function will add the address of the sender to whitelistedAddresses 
    function addAddressToWhitelist() public{
        require(!whitelistedAddresses[msg.sender],"Sender has already been whitelisted");

        require(numAddressesWhitelisted < maxWhitelistedAddresses, "More address cant be added, limit reached");
        whitelistedAddresses[msg.sender] = true;
        numAddressesWhitelisted += 1;
    }
}
