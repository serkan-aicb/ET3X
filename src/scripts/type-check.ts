import { execSync } from 'child_process';

console.log('Running TypeScript type checks...');

try {
  // Run TypeScript compiler
  console.log('Running tsc...');
  execSync('tsc --noEmit', { stdio: 'inherit' });
  
  console.log('Type checks completed successfully!');
} catch (error) {
  console.error('Type checks failed:', error);
  process.exit(1);
}