import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";


export default function Home (){

  // walletConnected keep track of user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  //joinedWhitelist keep track of whether the current metamask address has joined the whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transcation to get mined
  const [loading, setLoading] = useState(false);
  //numberOfWhitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  //Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as log as the page is open
  const web3ModalRef = useRef();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

  const getProviderOrSigner = async (needSigner = false)=>{
    // Connect to Metamask 
    // Since we store 'web3Modal' as a reference, we need to access the 'current' value to get access to the underlaying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    //If user is not connected to the Rinkeby network, let them know and throw an error
    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 4){
      window.alert("Change the network to Rikneby");
      throw new Error("Change the network to Rinkeby");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /*
  addAddressToWhitelist: Adds the current connected address to the whitelist
  */
  const addAddressToWhitelist = async ()=>{

    try{
      //We need a Signer here since this is a 'write' transcation.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows update methods
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS,abi,signer);
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      //wait for the transcation to get mined
      await tx.wait();
      setLoading(false);
      // get the updated number of addresss in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (error){
      console.log(error);
    }
  };

  /*
  getNumberOfWhitelisted: gets the number of whitelisted address
  */
  const getNumberOfWhitelisted = async ()=>{

    try{
      // Get the provider from web3Modal, which in our case is Metamask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only have read-only access to the contract
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS,abi,provider);
      // call the numAddresseWhitelisted from the contract
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (error) {
      console.log(error);
    }
  };

  /*
    checkIfAddressInWhitelist: Checks if the address is in whitelist
  */
  const checkIfAddressInWhitelist= async ()=>{

    try{
      // We will need the signer later to get the user's address
      // Even though it is a read transcation, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS,abi,signer);
      // Get the address associated to the signer which is connected to MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddress from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address);
      setJoinedWhitelist(_joinedWhitelist);
    } catch (error){
      console.log(error);
    }
  };

  /*
  connectWallet: Connnects the MetaMask wallet
  */
  const connectWallet = async ()=>{
    try{
      // Get the provider from web3Modal, which is our case is MetaMask
      // When used for the first time, it prompts the user to connecto their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (error) {
      console.log(error);
    }
  };

  /**
   renderButton: Returns a button based on the state of the dapp
   */
  const renderButton = ()=>{
    if(walletConnected){
      if(joinedWhitelist){
        return(
          <div className={styles.description}>
            Thanks for joining the whitelist!
          </div>
        );
      } else if(loading){
        return <button className={styles.button}>Loading...</button>;
      } else{
        return(
          <button onClick={addAddressToWhitelist} className={styles.button}>
            join the Whitelist
          </button>
        );
      }
    } else{
      return (
      <button onClick={connectWallet} className={styles.button}>
        Connect your wallet
      </button>
      );
    }
  };

  // useEffects are used to react to changes in state of the wedbsite
  // The array at the end of function call repersents what state changes will trigger this effect
  //In this case, whenever the value of 'walletConnected' changes - this effect will be called
  useEffect(()=>{
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask walet
    if(!walletConnected){
      // Assign the Web3Modal class to the referenc object by setting it's 'current' value
      // The 'current' value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  },[walletConnected])
  


  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp"/>
        <link rel="stylesheet" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to Crypto Devs!
          </h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}