# Talent3X

Talent3X is a decentralized skill development platform for universities.

## Environment Variables

Create a `.env` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ENVELOPE_MASTER_KEY=your_envelope_master_key
POLYGON_RPC_URL=https://polygon-amoy.infura.io/v3/your-infura-key
RELAYER_PRIVATE_KEY=your_relayer_private_key
T3X_SKILL_RATINGS_CONTRACT_ADDRESS=your_contract_address
SITE_BASE=https://uni.talent3x.io
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