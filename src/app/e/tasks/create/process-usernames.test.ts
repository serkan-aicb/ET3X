import { describe, expect, test } from '@jest/globals';

export const processAssignedUsernames = (assignedUsernames: string): string[] => {
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

describe('processAssignedUsernames', () => {
  test.each([
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
  ])('$description', ({ input, expected }) => {
    expect(processAssignedUsernames(input)).toEqual(expected);
  });
});
