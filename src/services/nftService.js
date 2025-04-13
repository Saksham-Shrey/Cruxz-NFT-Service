import {
  getContract,
  prepareContractCall,
  sendTransaction,
  readContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";

// Define Sepolia chain
const sepolia = defineChain(11155111);

// The owner's wallet address to mint NFTs to
const OWNER_WALLET_ADDRESS = process.env.OWNER_WALLET_ADDRESS;

/**
 * Gets information about the NFT contract
 * @param {Object} client - Thirdweb client instance
 * @returns {Promise<Object>} Contract information
 */
export async function getContractInfo(client) {
  try {
    // Connect to the contract
    const contract = await getContract({
      client,
      chain: sepolia,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    // Try to get contract name
    const name = await readContract({
      contract,
      method: "function name() view returns (string)",
      params: [],
    });

    // Try to get contract symbol
    const symbol = await readContract({
      contract,
      method: "function symbol() view returns (string)",
      params: [],
    });

    // Try to get contract owner
    let owner = "unknown";
    try {
      owner = await readContract({
        contract,
        method: "function owner() view returns (address)",
        params: [],
      });
    } catch (error) {
      console.log("Could not get contract owner:", error.message);
    }

    // Try to get total supply
    const totalSupply = await readContract({
      contract,
      method: "function totalSupply() view returns (uint256)",
      params: [],
    });

    return {
      name,
      symbol,
      owner,
      totalSupply: String(totalSupply),
      address: process.env.NFT_CONTRACT_ADDRESS,
    };
  } catch (error) {
    console.error("Error in getContractInfo:", error);
    throw new Error(`Failed to get contract info: ${error.message}`);
  }
}

/**
 * Mints an NFT with custom text
 * @param {Object} client - Thirdweb client instance
 * @param {string} text - The text to be included in the NFT
 * @param {boolean} performMint - Whether to actually perform the mint or just prepare
 * @param {string} privateKey - The private key to sign the transaction
 * @param {string} toAddress - The address to mint the NFT to (mandatory, wallet address)
 * @param {string} description - Custom description for the NFT (optional)
 * @returns {Promise<Object>} The minting result
 */
export async function mintTextNFT(
  client,
  text,
  performMint = false,
  privateKey = null,
  toAddress = null,
  description = null
) {
  try {
    // Connect to the contract
    const contract = await getContract({
      client,
      chain: sepolia,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    // Create metadata for the NFT
    const metadata = {
      name: "CRUXZ NFT",
      description: description || "CRUXZ NFT", // Use provided description or fall back to text
      attributes: [
        {
          trait_type: "Text",
          value: text,
        },
        {
          trait_type: "Created At",
          value: new Date().toISOString(),
        },
      ],
    };

    // Convert metadata to URI format
    const metadataUri = `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata)
    ).toString("base64")}`;

    // If performMint is false, just return the preparation info
    if (!performMint) {
      return {
        status: "prepared",
        message:
          "To mint an NFT, you need to call this contract directly with the owner's wallet",
        contract: process.env.NFT_CONTRACT_ADDRESS,
        tokenMetadata: metadata,
        instructions: [
          "1. Connect your wallet to Thirdweb dashboard",
          "2. Access your contract at " + process.env.NFT_CONTRACT_ADDRESS,
          "3. Use the mintTo function with your wallet address and the metadata",
          "4. Or integrate a client-side wallet connector like Metamask",
        ],
      };
    }

    // Check if we have a private key for signing
    if (!privateKey || privateKey.trim() === "") {
      throw new Error("Private key is required for minting but not provided");
    }

    // Check if we have a toAddress (wallet address) for recipient
    if (!toAddress || toAddress.trim() === "") {
      throw new Error(
        "Wallet address (toAddress) is required for minting but not provided"
      );
    }

    console.log("Private key exists, attempting to mint...");

    // Ensure the private key is properly formatted (with or without 0x prefix)
    const privateKeyStr = privateKey.trim();
    console.log("Private key string length:", privateKeyStr.length);

    if (privateKeyStr.length !== 64 && privateKeyStr.length !== 66) {
      throw new Error(
        `Invalid private key length: ${privateKeyStr.length}. Expected 64 or 66 characters.`
      );
    }

    // Remove 0x prefix if present since thirdweb doesn't use it
    const formattedPrivateKey = privateKeyStr.startsWith("0x")
      ? privateKeyStr.substring(2)
      : privateKeyStr;

    console.log("Private key formatted, creating account...");

    // Create account from private key
    const account = privateKeyToAccount({
      privateKey: formattedPrivateKey,
      client,
    });
    console.log("Account created from private key:", account.address);

    // Use the provided recipient address
    const recipientAddress = toAddress;

    // Create a transaction to mint the NFT
    console.log("Preparing transaction to mint NFT...");
    const transaction = await prepareContractCall({
      contract,
      method: "function mintTo(address _to, string _uri) returns (uint256)",
      params: [recipientAddress, metadataUri],
    });

    console.log("Transaction prepared: ", JSON.stringify(transaction, null, 2));

    // Sign and send the transaction
    console.log("Transaction prepared, sending transaction...");
    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log("Mint transaction result:", result);

    // Get the token ID from the receipt if possible
    let tokenId = "unknown";
    try {
      // Try to extract token ID from logs or events
      // This is contract-specific and might need to be adjusted
      const events = result.receipt.logs;
      // Typically the token ID is in the Transfer event
      tokenId = events && events.length > 0 ? events[0].topics[3] : "unknown";
    } catch (error) {
      console.warn("Could not extract token ID from transaction", error);
    }

    console.log("Successfully minted NFT:", {
      transactionHash: result.transactionHash,
      tokenId,
    });

    return {
      status: "minted",
      tokenId,
      transactionHash: result.transactionHash,
      to: recipientAddress,
      metadata,
    };
  } catch (error) {
    console.error("Error in mintTextNFT:", error);
    throw new Error(`Failed to mint NFT: ${error.message}`);
  }
}

/**
 * Mints an NFT with custom text using a provided private key
 * @param {Object} client - Thirdweb client instance
 * @param {string} text - The text to be included in the NFT
 * @param {string} privateKey - The private key to sign the transaction
 * @param {string} toAddress - The address to mint the NFT to (mandatory wallet address)
 * @param {string} description - Custom description for the NFT (optional)
 * @returns {Promise<Object>} The minting result
 */
export async function mintTextNFTWithPrivateKey(
  client,
  text,
  privateKey,
  toAddress = null,
  description = null
) {
  try {
    // Validate required parameters
    if (!privateKey || privateKey.trim() === "") {
      throw new Error("Private key is required for minting");
    }

    if (!toAddress || toAddress.trim() === "") {
      throw new Error("Wallet address (toAddress) is required for minting");
    }

    // Call the main mint function with performMint=true
    return await mintTextNFT(client, text, true, privateKey, toAddress, description);
  } catch (error) {
    console.error("Error in mintTextNFTWithPrivateKey:", error);
    throw new Error(`Failed to mint NFT: ${error.message}`);
  }
}

/**
 * Gets all NFTs owned by a wallet address
 * @param {Object} client - Thirdweb client instance
 * @param {string} walletAddress - The wallet address to query
 * @returns {Promise<Array>} Array of NFTs owned by the wallet
 */
export async function getWalletNFTs(client, walletAddress) {
  try {
    // Connect to the contract
    const contract = await getContract({
      client,
      chain: sepolia,
      address: process.env.NFT_CONTRACT_ADDRESS,
    });

    // Try to get token balance
    const balance = await readContract({
      contract,
      method: "function balanceOf(address owner) view returns (uint256)",
      params: [walletAddress],
    });

    console.log(`Wallet ${walletAddress} has ${balance} NFTs`);

    // Manually build an array of NFTs based on balance
    const nfts = [];
    const balanceNum = Number(balance);

    for (let i = 0; i < balanceNum; i++) {
      try {
        // Get token ID for this owner at index
        const tokenId = await readContract({
          contract,
          method:
            "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
          params: [walletAddress, i],
        });

        // Get token URI
        const tokenUri = await readContract({
          contract,
          method: "function tokenURI(uint256 tokenId) view returns (string)",
          params: [tokenId],
        });

        // Parse metadata from token URI if it's base64 encoded
        let metadata = {};
        if (tokenUri.startsWith("data:application/json;base64,")) {
          const base64Data = tokenUri.replace(
            "data:application/json;base64,",
            ""
          );
          metadata = JSON.parse(Buffer.from(base64Data, "base64").toString());
        } else {
          metadata = {
            name: `Token #${tokenId}`,
            description: "No metadata available",
          };
        }

        nfts.push({
          tokenId: String(tokenId),
          name: metadata.name || `Token #${tokenId}`,
          description: metadata.description || "",
          attributes: metadata.attributes || [],
        });
      } catch (err) {
        console.error(`Error fetching token at index ${i}:`, err);
      }
    }

    return nfts;
  } catch (error) {
    console.error("Error in getWalletNFTs:", error);
    throw new Error(`Failed to fetch NFTs: ${error.message}`);
  }
}
