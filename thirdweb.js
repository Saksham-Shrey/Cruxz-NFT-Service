import { createThirdwebClient } from "thirdweb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const client = createThirdwebClient({
  // use clientId for client side usage
  clientId: process.env.THIRDWEB_CLIENT_ID,
  // use secretKey for server side usage
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

console.log(client);

export default client;
