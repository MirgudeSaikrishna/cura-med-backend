# CuraMed Backend

This is the backend API for the CuraMed healthcare marketplace. It provides authentication, product management, seller location, and search with pagination.

## Features

- User & Seller authentication (JWT, OTP)
- Product CRUD and search (with pagination)
- Seller location and nearest seller search (Geo queries)
- Secure endpoints

## Tech Stack

- Node.js, Express.js
- MongoDB, Mongoose
- JWT for authentication
- Nodemailer for OTP/email

## Setup

### Prerequisites

- Node.js (v16+)
- MongoDB

### Installation

```bash
cd cura-med-backend
npm install
```

### Environment Variables

Create a `.env` file in `cura-med-backend`:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

### Running the Server

```bash
npm start
```

The server will run on `http://localhost:1337` by default.

## Key Endpoints

- `POST /api/login` — Login for users/sellers
- `POST /api/register` — Registration
- `GET /api/products/:shopName` — Paginated, searchable products for a seller
- `GET /api/nearest` — Find nearest sellers by location
- `GET /api/U_view` — User dashboard data

## Notes

- All protected routes require `x-access-token` header.
- Product search and pagination are handled server-side.
