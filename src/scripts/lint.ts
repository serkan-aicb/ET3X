import { execSync } from 'child_process';

console.log('Running lint checks...');

try {
  // Run ESLint
  console.log('Running ESLint...');
  execSync('eslint . --ext .ts,.tsx', { stdio: 'inherit' });
  
  console.log('Lint checks completed successfully!');
} catch (error) {
  console.error('Lint checks failed:', error);
  process.exit(1);
}