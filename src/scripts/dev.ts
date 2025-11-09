import { execSync } from 'child_process';

console.log('Starting Talent3X in development mode...');

try {
  // Run Next.js dev
  console.log('Starting Next.js development server...');
  execSync('next dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start development server:', error);
  process.exit(1);
}