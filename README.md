# Talent3X

A decentralized talent development platform built with Next.js, Supabase, and blockchain technologies.

## Features

- **Decentralized Identity (DID)**: Each user gets a unique DID for verifiable identity
- **Skill Development Tasks**: Educators create tasks for students to complete
- **Blockchain Anchoring**: Task ratings are anchored to the Polygon Amoy testnet
- **IPFS Storage**: Ratings and metadata stored on IPFS via Pinata
- **Experience Points (XP)**: Students earn XP based on task performance
- **Role-based Access**: Separate interfaces for students, educators, and administrators

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, App Router, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **Blockchain**: Polygon Amoy testnet for anchoring
- **Storage**: IPFS via Pinata
- **Identity**: DID:web implementation
- **Deployment**: Docker

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env` file based on `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ENVELOPE_MASTER_KEY=your_envelope_master_key
PINATA_JWT=your_pinata_jwt
POLYGON_RPC_URL=your_polygon_rpc_url
WALLET_PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_contract_address
SITE_BASE=https://talent3x.io
```

## Database Setup

1. Apply the schema from `src/scripts/supabase-schema.sql` in your Supabase SQL Editor
2. Run `npm run seed` to populate the skills table

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed the database with initial data
- `npm test` - Run tests

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility functions and libraries
├── scripts/             # Database schema and seeding scripts
└── styles/              # Global styles
```

## License

This project is licensed under the MIT License.