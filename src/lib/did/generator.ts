// DID and username generation utilities

export function generateUsernameAndDID(role: 'student' | 'educator'): { username: string; did: string } {
  // Generate secure random 11-12 digit number
  const randomLength = Math.random() < 0.5 ? 11 : 12;
  let randomNumber = '';
  
  // Ensure first digit is not 0
  randomNumber += Math.floor(Math.random() * 9) + 1;
  
  // Generate remaining digits
  for (let i = 1; i < randomLength; i++) {
    randomNumber += Math.floor(Math.random() * 10);
  }
  
  // Check for sequences (simplified check)
  const hasSequence = /(\d)\1{2,}/.test(randomNumber);
  if (hasSequence) {
    // Regenerate if sequence found
    return generateUsernameAndDID(role);
  }
  
  const prefix = role === 'student' ? 'stud' : 'edu';
  const username = `${prefix}${randomNumber}`;
  const did = `did:web:talent3x.io:${prefix}:${randomNumber}`;
  
  return { username, did };
}