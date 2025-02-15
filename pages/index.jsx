import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
    // Contract Address & ABI
    const contractAddress = "0xBD124a793CBb44Da617Eef74f67AbB8139ac9FE7";
    const contractABI = abi.abi;

    // Component state
    const [currentAccount, setCurrentAccount] = useState("");
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [memos, setMemos] = useState([]);

    const onNameChange = (event) => {
        setName(event.target.value);
    }

    const onMessageChange = (event) => {
        setMessage(event.target.value);
    }

    // Wallet connection logic
    const isWalletConnected = async () => {
        try {
            const { ethereum } = window;

            const accounts = await ethereum.request({ method: 'eth_accounts' })
            console.log("accounts: ", accounts);

            if (accounts.length > 0) {
                const account = accounts[0];
                console.log("wallet is connected! " + account);
            } else {
                console.log("make sure MetaMask is connected");
            }
        } catch (error) {
            console.log("error: ", error);
        }
    }

    const switchEthereumChain = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4' }],
            });
        } catch (e) {
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x4',
                                chainName: 'Rinkeby Test Network',
                                nativeCurrency: {
                                    name: 'Ethereum',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrl: 'https://rpc.ankr.com/eth_rinkeby',
                                blockExplorerUrls: ["https://rinkeby.etherscan.io/"]
                            },
                        ],
                    });
                } catch (addError) {
                    console.error(addError);
                }
            }
            console.error(e);
        }
    }

    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                console.log("please install MetaMask");
            }

            await switchEthereumChain();

            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    }

    const buyCoffee = async () => {
        try {
            const { ethereum } = window;

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum, "any");
                const signer = provider.getSigner();
                const buyMeACoffee = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );

                console.log("buying coffee..")
                const coffeeTxn = await buyMeACoffee.buyCoffee(
                    name ? name : "Ryuu",
                    message ? message : "Enjoy your coffee!",
                    { value: ethers.utils.parseEther("0.001") }
                );

                await coffeeTxn.wait();

                console.log("mined ", coffeeTxn.hash);

                console.log("coffee purchased!");

                // Clear the form fields.
                setName("");
                setMessage("");
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Function to fetch all memos stored on-chain.
    const getMemos = async () => {
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const buyMeACoffee = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );

                console.log("fetching memos from the blockchain..");
                const memos = await buyMeACoffee.getMemos();
                console.log("fetched!");
                setMemos(memos);
            } else {
                console.log("Metamask is not connected");
            }

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        let buyMeACoffee;
        isWalletConnected();
        getMemos();

        // Create an event handler function for when someone sends
        // us a new memo.
        const onNewMemo = (from, timestamp, name, message) => {
            console.log("Memo received: ", from, timestamp, name, message);
            setMemos((prevState) => [
                ...prevState,
                {
                    address: from,
                    timestamp: new Date(timestamp * 1000),
                    message,
                    name
                }
            ]);
        };

        const { ethereum } = window;

        // Listen for new memo events.
        if (ethereum) {
            // ethereum.on('chainChanged', async function (networkId) {
            //     console.log(networkId);
            //     if (networkId != "0x4") {
            //         await switchEthereumChain();
            //     }
            // });
            const provider = new ethers.providers.Web3Provider(ethereum, "any");
            const signer = provider.getSigner();
            buyMeACoffee = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );

            buyMeACoffee.on("NewMemo", onNewMemo);
        }

        return () => {
            if (buyMeACoffee) {
                buyMeACoffee.off("NewMemo", onNewMemo);
            }
        }
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>Buy Albert a Coffee!</title>
                <meta name="description" content="Tipping site" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    Buy Albert a Coffee!
                </h1>

                {currentAccount ? (
                    <div>
                        <form>
                            <div className="formgroup">
                                <label>
                                    Name
                                </label>
                                <br />

                                <input
                                    id="name"
                                    type="text"
                                    placeholder="anon"
                                    onChange={onNameChange}
                                />
                            </div>
                            <br />
                            <div className="formgroup">
                                <label>
                                    Send Albert a message
                                </label>
                                <br />

                                <textarea
                                    rows={3}
                                    placeholder="Enjoy your coffee!"
                                    id="message"
                                    onChange={onMessageChange}
                                    required
                                >
                                </textarea>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={buyCoffee}
                                >
                                    Send 1 Coffee for 0.001ETH
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <button onClick={connectWallet}> Connect your wallet </button>
                )}
            </main>

            {currentAccount && (<h1>Memos received</h1>)}

            {currentAccount && (memos.map((memo, idx) => {
                return (
                    <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
                        <p style={{ "fontWeight": "bold" }}>{memo.message}</p>
                        <p>From: {memo.name} at {memo.timestamp.toString()}</p>
                    </div>
                )
            }))}

            <footer className={styles.footer}>
                <a
                    href="https://github.com/phamnam1805"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Created by phamnam1805
                </a>
            </footer>
        </div>
    )
}
