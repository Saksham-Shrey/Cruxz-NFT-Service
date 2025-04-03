# NFT Minting API for Thirdweb

![Project Banner](https://i.imgur.com/RxGQIXW.png)

A secure, production-ready REST API for creating and managing NFTs on the Ethereum blockchain (Sepolia testnet) using Thirdweb SDK. This API allows both preparation of NFT metadata and direct minting capabilities through authenticated endpoints.

[![GitHub license](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![API Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](package.json)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Health Check](#health-check)
  - [Contract Info](#contract-info)
  - [Prepare NFT Minting](#prepare-nft-minting)
  - [Direct NFT Minting](#direct-nft-minting)
  - [Query Wallet NFTs](#query-wallet-nfts)
- [Security Best Practices](#security-best-practices)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Performance Considerations](#performance-considerations)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Text-Based NFT Creation**: Generate NFTs with customizable text content
- **Multiple Minting Options**:
  - Preparation mode (client-side signing)
  - Direct minting (server-side signing)
- **Wallet Integration**: Query NFTs owned by specific wallets
- **Comprehensive Security**: API key authentication, input validation, and secure secret management
- **Contract Metadata**: Retrieve information about the deployed NFT contract
- **Production-Ready**: Full error handling, rate limiting, and secure configuration
- **Secure Credential Management**: All API keys and secrets are stored in environment variables, never in code

## Tech Stack

- **Runtime**: Node.js
- **API Framework**: Express.js
- **Blockchain**: Ethereum (Sepolia Testnet)
- **NFT Framework**: Thirdweb SDK
- **Security**: Helmet (HTTP headers), CORS protection, Environment-based configuration
- **Development**: Nodemon (hot-reload)

## Architecture

The API follows a modular service-based architecture:

```
├── src/
│   ├── server.js         # Main Express application
│   ├── services/
│   │   └── nftService.js # NFT operations and blockchain interactions
│   └── scripts/          # Utility scripts for maintenance
├── .env                  # Environment configuration (not committed to version control)
└── thirdweb.js           # Thirdweb client initialization using environment variables
```

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Thirdweb account with API credentials
- Ethereum wallet (for contract deployment and transaction signing)
- Sepolia testnet ETH (for gas fees)

## Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/nft-minting-api.git
   cd nft-minting-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create a `.env` file in the project root:

   ```env
   # Thirdweb API credentials
   THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

   # API configuration
   PORT=5050
   SERVER_API_KEY=your_secure_api_key_for_authentication

   # Blockchain configuration
   NFT_CONTRACT_ADDRESS=your_contract_address_on_sepolia

   # Optional: If using direct minting endpoint
   # PRIVATE_KEY=your_wallet_private_key
   ```

   **SECURITY WARNING**: Never commit your `.env` file to version control. Add it to `.gitignore`.

4. **Start the server**:

   Development mode with auto-reload:

   ```bash
   npm run dev
   ```

   Production mode:

   ```bash
   npm start
   ```

   The API will be available at `http://localhost:5050` (or the port you specified).

## API Documentation

### Authentication

All API endpoints are secured with API key authentication.

**API Key Header**:

```
x-api-key: your_server_api_key
```

Requests without a valid API key will receive a `401 Unauthorized` response.

### Health Check

Check if the API is running properly.

**Request**:

```
GET /health
```

**Response** (200 OK):

```json
{
  "status": "healthy",
  "message": "API is functioning correctly",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Contract Info

Get information about the NFT contract.

**Request**:

```
GET /api/contract
```

**Response** (200 OK):

```json
{
  "success": true,
  "contract": {
    "name": "CruxzNFT",
    "symbol": "CRUXZNFT",
    "owner": "0xA02A2ac68bc12c3Bf1Fb057FCEF54BF0518A5430",
    "totalSupply": "0",
    "address": "0xFe05466FB24f917c55a1456dbA186153766EB751"
  }
}
```

### Prepare NFT Minting

Generate metadata for an NFT without minting it directly. This is the recommended approach for client-side applications.

**Request**:

```
POST /api/mint/text/prepare
Content-Type: application/json

{
  "text": "Your custom text for the NFT"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "status": "prepared",
  "message": "To mint an NFT, you need to call this contract directly with the owner's wallet",
  "contract": "0xFe05466FB24f917c55a1456dbA186153766EB751",
  "metadata": {
    "name": "Text NFT #1234567890",
    "description": "Your custom text",
    "attributes": [
      {
        "trait_type": "Text",
        "value": "Your custom text"
      },
      {
        "trait_type": "Created At",
        "value": "2023-04-01T12:34:56.789Z"
      }
    ]
  },
  "instructions": [
    "1. Connect your wallet to Thirdweb dashboard",
    "2. Access your contract at 0xFe05466FB24f917c55a1456dbA186153766EB751",
    "3. Use the mintTo function with your wallet address and the metadata",
    "4. Or integrate a client-side wallet connector like Metamask"
  ]
}
```

### Direct NFT Minting

Mint an NFT directly from the server using a provided private key. **Note**: This endpoint should only be used in secure server-to-server environments.

**Request**:

```
POST /api/mint/text
Content-Type: application/json

{
  "text": "Your custom text for the NFT",
  "privateKey": "your_private_key_here",
  "toAddress": "recipient_wallet_address"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "status": "minted",
  "tokenId": "123",
  "transactionHash": "0x...",
  "to": "recipient_wallet_address",
  "metadata": {
    "name": "Text NFT #1234567890",
    "description": "Your custom text",
    "attributes": [
      {
        "trait_type": "Text",
        "value": "Your custom text"
      },
      {
        "trait_type": "Created At",
        "value": "2023-04-01T12:34:56.789Z"
      }
    ]
  }
}
```

### Query Wallet NFTs

Get all NFTs owned by a specific wallet address.

**Recommended Method**:

**Request**:

```
POST /api/nfts
Content-Type: application/json

{
  "walletAddress": "0x..."
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "wallet": "0x1234...5678",
  "count": 2,
  "nfts": [
    {
      "tokenId": "1",
      "name": "Text NFT #123456789",
      "description": "Your custom text",
      "attributes": [
        {
          "trait_type": "Text",
          "value": "Your custom text"
        },
        {
          "trait_type": "Created At",
          "value": "2023-04-01T12:34:56.789Z"
        }
      ]
    }
  ]
}
```

**Legacy Method** (Deprecated):

**Request**:

```
GET /api/nfts/0x...
```

This endpoint is maintained for backward compatibility but will be removed in future versions.

## Security Best Practices

1. **API Key Authentication**:

   - Use a strong, randomly generated API key
   - Rotate keys periodically
   - Use HTTPS in production

2. **Private Key Management**:

   - Never store private keys in code or version control
   - Use environment variables for sensitive data
   - Consider using a vault service in production

3. **Credential Security**:

   - All ThirdWeb credentials (client ID and secret key) are securely stored in environment variables
   - No credentials are hardcoded in the application
   - The application explicitly loads the environment configuration on startup

4. **Input Validation**:

   - All endpoints validate inputs before processing
   - Wallet addresses are validated with regex patterns
   - Text content is sanitized before use

5. **Rate Limiting**:

   - API includes basic rate limiting headers
   - Consider implementing more robust rate limiting in production

6. **Error Handling**:
   - Errors are logged but not exposed to clients in detail
   - Standardized error responses preserve security

## Error Handling

The API uses standard HTTP status codes with consistent error response structures:

- **200 OK**: Successful operation
- **400 Bad Request**: Invalid parameters or missing fields
- **401 Unauthorized**: Missing or invalid API key
- **403 Forbidden**: Valid API key but insufficient permissions
- **500 Internal Server Error**: Server-side errors (contract issues, blockchain errors)

Example error response:

```json
{
  "success": false,
  "error": "Missing required field: privateKey",
  "details": "Additional error context"
}
```

## Deployment

### Production Considerations

1. **Environment Configuration**:

   - Use production Thirdweb API credentials
   - Configure a secure API key
   - Consider using a mainnet contract for real-world usage
   - Use secure environment variable management in your hosting platform

2. **Server Deployment**:

   - Deploy behind a load balancer
   - Use HTTPS with valid certificates
   - Consider containerization with Docker

3. **Monitoring and Logging**:
   - Implement application monitoring
   - Set up error alerting
   - Maintain detailed logs for troubleshooting

### Docker Deployment (Example)

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5050

CMD ["node", "src/server.js"]
```

## Performance Considerations

- **Caching**: Implement caching for contract info and wallet queries
- **Connection Pooling**: Use connection pooling for Thirdweb client
- **Batch Operations**: Group multiple NFT operations when possible
- **Asynchronous Processing**: Consider using a queue for minting operations

## Examples

### Using the API with cURL

**Authenticate and Check Health**:

```bash
curl -X GET "http://localhost:5050/health" \
  -H "x-api-key: your_api_key"
```

**Prepare NFT Metadata**:

```bash
curl -X POST "http://localhost:5050/api/mint/text/prepare" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"text": "My first NFT text"}'
```

**Query Wallet NFTs**:

```bash
curl -X POST "http://localhost:5050/api/nfts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"walletAddress": "0xYourWalletAddress"}'
```

### Using the API with JavaScript

```javascript
async function prepareNFT() {
  const response = await fetch("http://localhost:5050/api/mint/text/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "your_api_key",
    },
    body: JSON.stringify({
      text: "My first NFT created with JavaScript",
    }),
  });

  const data = await response.json();
  console.log(data);
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

Built using [Thirdweb](https://thirdweb.com)
