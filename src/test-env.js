import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("Environment variables test:");
console.log("=========================");
console.log("THIRDWEB_CLIENT_ID:", process.env.THIRDWEB_CLIENT_ID);
console.log("THIRDWEB_SECRET_KEY exists:", !!process.env.THIRDWEB_SECRET_KEY);
console.log("PORT:", process.env.PORT);
console.log("NFT_CONTRACT_ADDRESS:", process.env.NFT_CONTRACT_ADDRESS);
console.log("WALLET_ADDRESS:", process.env.WALLET_ADDRESS);
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
console.log(
  "PRIVATE_KEY first 4 chars:",
  process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 4) : "none"
);
console.log("=========================");
