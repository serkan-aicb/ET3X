// Test file for username processing logic

const processAssignedUsernames = (assignedUsernames) => {
  if (!assignedUsernames.trim()) {
    return [];
  }
  
  // Split by newlines, trim each line, filter out empty lines, remove duplicates
  const usernames = assignedUsernames
    .split('\n')
    .map(username => username.trim())
    .filter(username => username.length > 0);
  
  // Remove duplicates while preserving order
  return Array.from(new Set(usernames));
};

// Simple test function for the username processing logic
const testProcessAssignedUsernames = () => {
  const testCases = [
    {
      input: "user1\nuser2\nuser3",
      expected: ["user1", "user2", "user3"],
      description: "Basic case with multiple usernames"
    },
    {
      input: " user1 \n user2 \n user3 ",
      expected: ["user1", "user2", "user3"],
      description: "Usernames with extra whitespace"
    },
    {
      input: "user1\n\nuser2\n\n\nuser3",
      expected: ["user1", "user2", "user3"],
      description: "Empty lines between usernames"
    },
    {
      input: "user1\nuser1\nuser2",
      expected: ["user1", "user2"],
      description: "Duplicate usernames"
    },
    {
      input: "",
      expected: [],
      description: "Empty input"
    },
    {
      input: "   \n  \n  ",
      expected: [],
      description: "Only whitespace"
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ input, expected, description }) => {
    const result = processAssignedUsernames(input);
    const success = JSON.stringify(result) === JSON.stringify(expected);
    
    if (success) {
      console.log(`✓ ${description}`);
      passed++;
    } else {
      console.log(`✗ ${description}`);
      console.log(`  Expected: ${JSON.stringify(expected)}`);
      console.log(`  Got:      ${JSON.stringify(result)}`);
      failed++;
    }
  });
  
  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  return failed === 0;
};

// Run the tests if this file is executed directly
if (require.main === module) {
  testProcessAssignedUsernames();
}

module.exports = { processAssignedUsernames, testProcessAssignedUsernames };