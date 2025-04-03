import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createThirdwebClient } from "thirdweb";
import {
  mintTextNFT,
  getWalletNFTs,
  getContractInfo,
  mintTextNFTWithPrivateKey,
} from "./services/nftService.js";
import { privateKeyToAccount } from "thirdweb/wallets";

// Load environment variables
dotenv.config();

// Debug: Check if private key is loaded
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
console.log(
  "Private key length:",
  process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 0
);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Thirdweb client according to documentation
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Get contract info endpoint
app.get("/api/contract", async (req, res) => {
  try {
    const contractInfo = await getContractInfo(client);
    res.json({
      success: true,
      contract: contractInfo,
    });
  } catch (error) {
    console.error("Error fetching contract info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contract info",
      details: error.message,
    });
  }
});

// Prepare Text NFT endpoint
app.post("/api/mint/text/prepare", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: text",
      });
    }

    // Call mintTextNFT with performMint=false to only prepare
    const result = await mintTextNFT(client, text, false);

    res.json({
      success: true,
      status: "prepared",
      message: result.message,
      contract: result.contract,
      metadata: result.tokenMetadata,
      instructions: result.instructions,
    });
  } catch (error) {
    console.error("Preparation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to prepare NFT",
      details: error.message,
    });
  }
});

// Mint Text NFT endpoint
app.post("/api/mint/text", async (req, res) => {
  try {
    const { text, privateKey, toAddress } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: text",
      });
    }

    if (!privateKey || privateKey.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: privateKey",
      });
    }

    if (!toAddress || toAddress.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: toAddress (wallet address)",
      });
    }

    console.log("Attempting to mint NFT with text:", text);

    // Call mintTextNFT with performMint=true to actually mint
    const result = await mintTextNFT(client, text, true, privateKey, toAddress);

    if (result.status === "minted") {
      res.json({
        success: true,
        status: "minted",
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        to: result.to,
        metadata: result.metadata,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to mint NFT",
        details: "Unexpected response from minting function",
      });
    }
  } catch (error) {
    console.error("Minting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mint NFT",
      details: error.message,
    });
  }
});

// Mint Text NFT with Private Key endpoint
app.post("/api/mint/text/with-private-key", async (req, res) => {
  try {
    const { text, privateKey, toAddress } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: text",
      });
    }

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: privateKey",
      });
    }

    if (!toAddress || toAddress.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: toAddress (wallet address)",
      });
    }

    console.log("Attempting to mint NFT with provided private key...");

    // Call the new function with the provided private key
    const result = await mintTextNFTWithPrivateKey(
      client,
      text,
      privateKey,
      toAddress
    );

    res.json({
      success: true,
      status: "minted",
      tokenId: result.tokenId,
      transactionHash: result.transactionHash,
      to: result.to,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Minting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mint NFT",
      details: error.message,
    });
  }
});

// Get NFTs by wallet address endpoint
app.get("/api/nfts/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: walletAddress",
      });
    }

    const nfts = await getWalletNFTs(client, walletAddress);
    res.json({
      success: true,
      wallet: walletAddress,
      count: nfts.length,
      nfts,
    });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch NFTs",
      details: error.message,
    });
  }
});

// Test private key formatting endpoint
app.post("/api/test/private-key", async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: privateKey",
      });
    }

    // Verify private key formatting
    const privateKeyStr = privateKey.trim();

    if (privateKeyStr.length !== 64 && privateKeyStr.length !== 66) {
      return res.status(400).json({
        success: false,
        error: `Invalid private key length: ${privateKeyStr.length}. Expected 64 or 66 characters.`,
      });
    }

    // Remove 0x prefix if present since thirdweb handles this internally
    const formattedPrivateKey = privateKeyStr.startsWith("0x")
      ? privateKeyStr.substring(2)
      : privateKeyStr;

    try {
      // Test creating an account from private key
      const account = privateKeyToAccount({
        privateKey: formattedPrivateKey,
        client,
      });

      res.json({
        success: true,
        message: "Private key formatted correctly",
        derivedAddress: account.address,
        originalLength: privateKeyStr.length,
        formattedLength: formattedPrivateKey.length,
        hadPrefix: privateKeyStr.startsWith("0x"),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Invalid private key format",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Private key test error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test private key",
      details: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`NFT API running on port ${port}`);
});
