import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'app', 'e', 'tasks', '[taskId]', 'page.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the incorrect enum values
content = content.replace(/status: 'approved'/g, "status: 'accepted'");
content = content.replace(/status: 'rejected'/g, "status: 'declined'");

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed enum values in educator task detail page');
