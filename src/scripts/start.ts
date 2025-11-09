import { execSync } from 'child_process';

console.log('Starting Talent3X...');

try {
  // Run Next.js start
  console.log('Starting Next.js server...');
  execSync('next start', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}