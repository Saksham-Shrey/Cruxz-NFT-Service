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

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

// API Key Middleware - Must be the first middleware
const validateApiKey = (req, res, next) => {
  // Check for API key in headers
  const apiKey = req.headers["x-api-key"];

  // If no API key is provided
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API key is required",
      message: "Please provide an API key in the 'x-api-key' header",
    });
  }

  // If API key doesn't match
  if (apiKey !== process.env.SERVER_API_KEY) {
    return res.status(403).json({
      success: false,
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
  }

  // If API key is valid, proceed
  next();
};

// Apply API key validation as the first middleware
app.use((req, res, next) => {
  validateApiKey(req, res, next);
});

// Other middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "API is functioning correctly",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const router = express.Router();

// Contract Info
router.get("/contract", async (req, res) => {
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

// NFT Minting Routes
router.post("/mint/text/prepare", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: text",
      });
    }

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

router.post("/mint/text", async (req, res) => {
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

// NFT Query Routes - More secure implementation
router.post("/nfts", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: walletAddress",
      });
    }

    // Validate the Ethereum address format (basic validation)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format",
      });
    }

    const nfts = await getWalletNFTs(client, walletAddress);

    // Add rate limiting info in headers
    res.setHeader("X-RateLimit-Limit", "100");
    res.setHeader("X-RateLimit-Remaining", "99");

    res.json({
      success: true,
      wallet:
        walletAddress.substring(0, 6) +
        "..." +
        walletAddress.substring(walletAddress.length - 4), // Mask the full address in response
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

// Keep the old route for backward compatibility but mark it as deprecated
router.get("/nfts/:walletAddress", async (req, res) => {
  // Add deprecation notice in header
  res.setHeader(
    "X-Deprecated-API",
    "This endpoint is deprecated. Please use POST /api/nfts instead."
  );

  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: walletAddress",
      });
    }

    // Validate the Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format",
      });
    }

    const nfts = await getWalletNFTs(client, walletAddress);
    res.json({
      success: true,
      deprecated: true,
      message:
        "This endpoint is deprecated. Please use POST /api/nfts instead.",
      wallet:
        walletAddress.substring(0, 6) +
        "..." +
        walletAddress.substring(walletAddress.length - 4),
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

// Utility Routes
router.post("/test/private-key", async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: privateKey",
      });
    }

    const privateKeyStr = privateKey.trim();

    if (privateKeyStr.length !== 64 && privateKeyStr.length !== 66) {
      return res.status(400).json({
        success: false,
        error: `Invalid private key length: ${privateKeyStr.length}. Expected 64 or 66 characters.`,
      });
    }

    const formattedPrivateKey = privateKeyStr.startsWith("0x")
      ? privateKeyStr.substring(2)
      : privateKeyStr;

    try {
      const account = privateKeyToAccount({
        privateKey: formattedPrivateKey,
        client,
      });

      res.json({
        success: true,
        message: "Private key format is valid",
        address: account.address,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Invalid private key format",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Private key validation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate private key",
      details: error.message,
    });
  }
});

// Mount all API routes under /api
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  });
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API Key validation is enabled`);
});
