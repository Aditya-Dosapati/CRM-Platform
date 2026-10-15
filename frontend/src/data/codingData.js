// GMRIT Academic Hub - Coding Practice & Assessment Dataset

export const supportedLanguagesList = [
  {
    id: 'python',
    name: 'Python',
    version: '3.12.2',
    runtime: 'CPython / Linux Container',
    extension: '.py',
    status: 'enabled',
    timeLimit: '4.0s',
    memoryLimit: '128 MB',
    defaultCode: `def solve():
    # Write your solution here
    pass

if __name__ == '__main__':
    solve()
`
  },
  {
    id: 'cpp',
    name: 'C++',
    version: 'C++17 (g++ 13.2.0)',
    runtime: 'GCC Native Container',
    extension: '.cpp',
    status: 'enabled',
    timeLimit: '2.0s',
    memoryLimit: '256 MB',
    defaultCode: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 'c',
    name: 'C',
    version: 'C17 (gcc 13.2.0)',
    runtime: 'GCC Native Container',
    extension: '.c',
    status: 'enabled',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    defaultCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here
    return 0;
}
`
  },
  {
    id: 'java',
    name: 'Java',
    version: 'OpenJDK 21.0.2',
    runtime: 'JVM Sandboxed Container',
    extension: '.java',
    status: 'enabled',
    timeLimit: '3.0s',
    memoryLimit: '512 MB',
    defaultCode: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}
`
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js 22.1.0',
    runtime: 'V8 Sandboxed Engine',
    extension: '.js',
    status: 'enabled',
    timeLimit: '3.0s',
    memoryLimit: '256 MB',
    defaultCode: `const fs = require('fs');

function solve() {
    // Write your solution here
}

solve();
`
  }
];

export const mysqlLanguage = {
  id: 'mysql',
  name: 'MySQL',
  version: 'MySQL 8.0.36',
  runtime: 'Relational SQL Query Sandbox',
  extension: '.sql',
  status: 'enabled',
  timeLimit: '2.0s',
  memoryLimit: '128 MB',
  defaultCode: `# Write your MySQL query statement below\n`
};

export function isDatabaseProblem(problem) {
  if (!problem) return false;
  const topic = (problem.topic || '').toLowerCase();
  const cat = (problem.category || '').toLowerCase();
  return (
    topic.includes('database') ||
    topic.includes('sql') ||
    topic === 'db' ||
    cat.includes('database') ||
    cat.includes('sql') ||
    Boolean(problem.starterCode && 'mysql' in problem.starterCode && !('python' in problem.starterCode))
  );
}

export function getLanguagesForProblem(problem) {
  if (isDatabaseProblem(problem)) {
    return [mysqlLanguage];
  }
  return supportedLanguagesList;
}

export const studentCodingKPIs = {
  problemsSolved: 0,
  solvedThisMonth: "+0 this month",
  problemsAttempted: 0,
  successRate: "0.0%",
  currentStreak: 0,
  longestStreak: 0,
  totalSubmissions: 0,
  averageRuntime: "0 ms",
  rank: "--",
  totalStudents: 1450,
  points: 0
};

export const codingTopicCategories = [
  { id: 'arrays', name: 'Arrays', problems: 42, solved: 0, percentage: 0, icon: 'Layers', color: '#2563EB' },
  { id: 'strings', name: 'Strings', problems: 38, solved: 0, percentage: 0, icon: 'FileText', color: '#059669' },
  { id: 'linked-lists', name: 'Linked Lists', problems: 26, solved: 0, percentage: 0, icon: 'GitCommit', color: '#7C3AED' },
  { id: 'stacks', name: 'Stacks', problems: 20, solved: 0, percentage: 0, icon: 'Layers', color: '#EA580C' },
  { id: 'queues', name: 'Queues', problems: 18, solved: 0, percentage: 0, icon: 'AlignLeft', color: '#0891B2' },
  { id: 'trees', name: 'Trees', problems: 34, solved: 0, percentage: 0, icon: 'GitFork', color: '#059669' },
  { id: 'graphs', name: 'Graphs', problems: 28, solved: 0, percentage: 0, icon: 'Share2', color: '#DC2626' },
  { id: 'sorting', name: 'Sorting', problems: 24, solved: 0, percentage: 0, icon: 'ArrowUpDown', color: '#2563EB' },
  { id: 'searching', name: 'Searching', problems: 22, solved: 0, percentage: 0, icon: 'Search', color: '#059669' },
  { id: 'recursion', name: 'Recursion', problems: 16, solved: 0, percentage: 0, icon: 'Repeat', color: '#7C3AED' },
  { id: 'dp', name: 'Dynamic Programming', problems: 30, solved: 0, percentage: 0, icon: 'Grid', color: '#EA580C' },
  { id: 'greedy', name: 'Greedy Algorithms', problems: 18, solved: 0, percentage: 0, icon: 'Zap', color: '#D97706' },
  { id: 'hashing', name: 'Hashing', problems: 25, solved: 0, percentage: 0, icon: 'Hash', color: '#0891B2' },
  { id: 'oop', name: 'Object-Oriented Programming', problems: 15, solved: 0, percentage: 0, icon: 'Box', color: '#2563EB' },
  { id: 'db', name: 'Database Programming', problems: 14, solved: 0, percentage: 0, icon: 'Database', color: '#059669' },
  { id: 'math', name: 'Mathematical Problems', problems: 20, solved: 0, percentage: 0, icon: 'Cpu', color: '#7C3AED' }
];

export const codingProblemsList = [
  {
    id: 'prob-1',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays',
    acceptance: '78%',
    attempts: '1,842',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Complete your solution
        prev_map = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prev_map:
                return [prev_map[diff], i]
            prev_map[n] = i
        return []
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
      c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return result;
}
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
};
`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]' },
      { id: 2, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'nums = [3,3], target = 6', expected: '[0, 1]' },
      { id: 'h2', input: 'nums = [-1,-2,-3,-4,-5], target = -8', expected: '[2, 4]' },
      { id: 'h3', input: 'nums = [0,4,3,0], target = 0', expected: '[0, 3]' },
      { id: 'h4', input: 'nums = [1000000000, -1000000000], target = 0', expected: '[0, 1]' }
    ],
    hints: [
      "Hint 1: A brute-force approach checks every pair using two nested loops in O(n²) time.",
      "Hint 2: Can you trade a little bit of space memory for runtime speed?",
      "Hint 3: Use a Hash Map / Dictionary to store elements and their index as you iterate. Check if `target - current_num` exists in O(1) time."
    ],
    solutionAnalysis: {
      userComplexity: "O(n) Time • O(n) Space",
      optimalComplexity: "O(n) Time • O(n) Space",
      bruteForceComplexity: "O(n²) Time • O(1) Space",
      recommendation: "Your single-pass hash table approach has optimal O(n) asymptotic runtime."
    }
  },
  {
    id: 'prob-2',
    title: 'Reverse Linked List',
    difficulty: 'Medium',
    topic: 'Linked Lists',
    acceptance: '64%',
    attempts: '923',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

Can you reverse it iteratively and recursively?`,
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The linked list 1->2->3->4->5 becomes 5->4->3->2->1.'
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: 'The linked list 1->2 becomes 2->1.'
      }
    ],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    starterCode: {
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            next_temp = curr.next
            curr.next = prev
            prev = curr
            curr = next_temp
        return prev
`,
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};
`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}
`,
      c: `struct ListNode* reverseList(struct ListNode* head) {
    struct ListNode* prev = NULL;
    struct ListNode* curr = head;
    while (curr != NULL) {
        struct ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
`,
      javascript: `var reverseList = function(head) {
    let prev = null;
    let curr = head;
    while (curr) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 'head = [1,2,3,4,5]', expected: '[5,4,3,2,1]' },
      { id: 2, input: 'head = [1,2]', expected: '[2,1]' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'head = []', expected: '[]' },
      { id: 'h2', input: 'head = [42]', expected: '[42]' },
      { id: 'h3', input: 'head = [10, 20, 30, 40]', expected: '[40, 30, 20, 10]' }
    ],
    hints: [
      "Hint 1: Keep track of three pointers: `prev`, `curr`, and `nextTemp`.",
      "Hint 2: In each step, reverse the pointer direction: `curr.next = prev`.",
      "Hint 3: Advance `prev` to `curr`, and `curr` to `nextTemp`."
    ],
    solutionAnalysis: {
      userComplexity: "O(n) Time • O(1) Space",
      optimalComplexity: "O(n) Time • O(1) Space",
      bruteForceComplexity: "O(n) Time • O(n) Space (with array buffer)",
      recommendation: "Iterative pointer manipulation achieves minimal O(1) auxiliary memory."
    }
  },
  {
    id: 'prob-3',
    title: 'Binary Search',
    difficulty: 'Easy',
    topic: 'Searching',
    acceptance: '82%',
    attempts: '2,341',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`.

If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4'
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.'
    ],
    starterCode: {
      python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};
`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
`,
      c: `int search(int* nums, int numsSize, int target) {
    int left = 0, right = numsSize - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
`,
      javascript: `var search = function(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [-1,0,3,5,9,12], target = 9', expected: '4' },
      { id: 2, input: 'nums = [-1,0,3,5,9,12], target = 2', expected: '-1' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'nums = [5], target = 5', expected: '0' },
      { id: 'h2', input: 'nums = [1,3,5,7,9,11], target = 1', expected: '0' },
      { id: 'h3', input: 'nums = [1,3,5,7,9,11], target = 11', expected: '5' },
      { id: 'h4', input: 'nums = [2,4,6,8,10], target = 7', expected: '-1' }
    ],
    hints: [
      "Hint 1: Since the array is sorted, comparing the target with the middle element halves the search space.",
      "Hint 2: Beware of integer overflow in C++/Java when calculating `mid = (left + right) / 2`. Prefer `left + (right - left) / 2`."
    ],
    solutionAnalysis: {
      userComplexity: "O(log n) Time • O(1) Space",
      optimalComplexity: "O(log n) Time • O(1) Space",
      bruteForceComplexity: "O(n) Linear Scan",
      recommendation: "Logarithmic binary search meets the strict asymptotic requirement."
    }
  },
  {
    id: 'prob-4',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Strings',
    acceptance: '58%',
    attempts: '1,204',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    starterCode: {
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_map = {}
        left = 0
        max_len = 0
        for right, char in enumerate(s):
            if char in char_map and char_map[char] >= left:
                left = char_map[char] + 1
            char_map[char] = right
            max_len = max(max_len, right - left + 1)
        return max_len
`,
      cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> seen;
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            if (seen.find(s[right]) != seen.end() && seen[s[right]] >= left) {
                left = seen[s[right]] + 1;
            }
            seen[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
`,
      c: `int lengthOfLongestSubstring(char* s) {
    int lastPos[256];
    for (int i = 0; i < 256; i++) lastPos[i] = -1;
    int maxLen = 0, start = 0;
    for (int i = 0; s[i] != '\\0'; i++) {
        unsigned char c = (unsigned char)s[i];
        if (lastPos[c] >= start) {
            start = lastPos[c] + 1;
        }
        lastPos[c] = i;
        int len = i - start + 1;
        if (len > maxLen) maxLen = len;
    }
    return maxLen;
}
`,
      javascript: `var lengthOfLongestSubstring = function(s) {
    const map = new Map();
    let left = 0, maxLen = 0;
    for (let right = 0; right < s.length; right++) {
        if (map.has(s[right]) && map.get(s[right]) >= left) {
            left = map.get(s[right]) + 1;
        }
        map.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 's = "abcabcbb"', expected: '3' },
      { id: 2, input: 's = "bbbbb"', expected: '1' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 's = "pwwkew"', expected: '3' },
      { id: 'h2', input: 's = ""', expected: '0' },
      { id: 'h3', input: 's = "au"', expected: '2' },
      { id: 'h4', input: 's = "dvdf"', expected: '3' }
    ],
    hints: [
      "Hint 1: Use a sliding window with two pointers `left` and `right`.",
      "Hint 2: Whenever you encounter a duplicate character, shift the `left` pointer just after the previous occurrence."
    ],
    solutionAnalysis: {
      userComplexity: "O(n) Time • O(min(m, n)) Space",
      optimalComplexity: "O(n) Time • O(min(m, n)) Space",
      bruteForceComplexity: "O(n³) Substring Check",
      recommendation: "Sliding window with hash map lookup reduces time complexity to linear O(n)."
    }
  },
  {
    id: 'prob-5',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stacks',
    acceptance: '85%',
    attempts: '2,100',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Matching round brackets.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'All matching brackets in valid order.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched brackets.' }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    starterCode: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack
`,
      cpp: `#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> map = {{')', '('}, {'}', '{'}, {']', '['}};
        for (char c : s) {
            if (map.count(c)) {
                if (st.empty() || st.top() != map[c]) return false;
                st.pop();
            } else {
                st.push(c);
            }
        }
        return st.empty();
    }
};
`,
      java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}
`,
      c: `bool isValid(char* s) {
    char stack[10005];
    int top = -1;
    for (int i = 0; s[i] != '\\0'; i++) {
        if (s[i] == '(' || s[i] == '{' || s[i] == '[') {
            stack[++top] = s[i];
        } else {
            if (top == -1) return false;
            char open = stack[top--];
            if (s[i] == ')' && open != '(') return false;
            if (s[i] == '}' && open != '{') return false;
            if (s[i] == ']' && open != '[') return false;
        }
    }
    return top == -1;
}
`,
      javascript: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (let c of s) {
        if (map[c]) {
            if (stack.pop() !== map[c]) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.length === 0;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 's = "()"', expected: 'true' },
      { id: 2, input: 's = "()[]{}"', expected: 'true' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 's = "(]"', expected: 'false' },
      { id: 'h2', input: 's = "([)]"', expected: 'false' },
      { id: 'h3', input: 's = "{[]}"', expected: 'true' }
    ],
    hints: [
      "Hint 1: Use a Stack LIFO data structure.",
      "Hint 2: Push opening brackets onto the stack. When you hit a closing bracket, verify it matches the bracket on top of the stack."
    ],
    solutionAnalysis: {
      userComplexity: "O(n) Time • O(n) Space",
      optimalComplexity: "O(n) Time • O(n) Space",
      bruteForceComplexity: "O(n²) String Replacement",
      recommendation: "Stack-based matching is optimal for balanced parenthesization."
    }
  },
  {
    id: 'prob-6',
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    acceptance: '54%',
    attempts: '1,650',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1', explanation: 'The subarray [1] has the largest sum 1.' }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    starterCode: {
      python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        cur_sum = 0
        max_sum = nums[0]
        for n in nums:
            cur_sum = max(n, cur_sum + n)
            max_sum = max(max_sum, cur_sum)
        return max_sum
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int curSum = 0, maxSum = nums[0];
        for (int n : nums) {
            curSum = max(n, curSum + n);
            maxSum = max(maxSum, curSum);
        }
        return maxSum;
    }
};
`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int curSum = 0, maxSum = nums[0];
        for (int n : nums) {
            curSum = Math.max(n, curSum + n);
            maxSum = Math.max(maxSum, curSum);
        }
        return maxSum;
    }
}
`,
      c: `int maxSubArray(int* nums, int numsSize) {
    int curSum = 0, maxSum = nums[0];
    for (int i = 0; i < numsSize; i++) {
        curSum = (nums[i] > curSum + nums[i]) ? nums[i] : (curSum + nums[i]);
        if (curSum > maxSum) maxSum = curSum;
    }
    return maxSum;
}
`,
      javascript: `var maxSubArray = function(nums) {
    let curSum = 0, maxSum = nums[0];
    for (let n of nums) {
        curSum = Math.max(n, curSum + n);
        maxSum = Math.max(maxSum, curSum);
    }
    return maxSum;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expected: '6' },
      { id: 2, input: 'nums = [1]', expected: '1' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'nums = [5,4,-1,7,8]', expected: '23' },
      { id: 'h2', input: 'nums = [-1,-2,-3]', expected: '-1' }
    ],
    hints: [
      "Hint 1: Kadane's algorithm computes the maximum subsegment sum in linear time.",
      "Hint 2: At each element, decide whether to start a new subarray or extend the existing one."
    ],
    solutionAnalysis: {
      userComplexity: "O(n) Time • O(1) Space",
      optimalComplexity: "O(n) Time • O(1) Space",
      bruteForceComplexity: "O(n²) All Subarrays",
      recommendation: "Kadane's algorithm runs in optimal O(n) time with O(1) space."
    }
  },
  {
    id: 'prob-7',
    title: 'Detect Cycle in Directed Graph',
    difficulty: 'Hard',
    topic: 'Graphs',
    acceptance: '35%',
    attempts: '610',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Given a directed graph with \`V\` vertices and \`E\` edges, determine if it contains any cycle.

Return \`true\` if a cycle exists, otherwise \`false\`.`,
    examples: [
      { input: 'V = 4, edges = [[0,1],[1,2],[2,3],[3,0]]', output: 'true', explanation: 'Nodes 0->1->2->3->0 form a cycle.' },
      { input: 'V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]', output: 'false', explanation: 'Directed Acyclic Graph (DAG).' }
    ],
    constraints: [
      '1 <= V <= 10^4',
      '0 <= E <= 10^5'
    ],
    starterCode: {
      python: `class Solution:
    def isCyclic(self, V: int, adj: list[list[int]]) -> bool:
        visited = [0] * V # 0 = unvisited, 1 = visiting, 2 = visited
        
        def dfs(u):
            visited[u] = 1
            for v in adj[u]:
                if visited[v] == 1:
                    return True
                if visited[v] == 0 and dfs(v):
                    return True
            visited[u] = 2
            return False

        for i in range(V):
            if visited[i] == 0:
                if dfs(i):
                    return True
        return False
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool dfs(int u, vector<int>& visited, vector<vector<int>>& adj) {
        visited[u] = 1;
        for (int v : adj[u]) {
            if (visited[v] == 1) return true;
            if (visited[v] == 0 && dfs(v, visited, adj)) return true;
        }
        visited[u] = 2;
        return false;
    }

    bool isCyclic(int V, vector<vector<int>>& adj) {
        vector<int> visited(V, 0);
        for (int i = 0; i < V; i++) {
            if (visited[i] == 0 && dfs(i, visited, adj)) return true;
        }
        return false;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public boolean isCyclic(int V, List<List<Integer>> adj) {
        int[] visited = new int[V];
        for (int i = 0; i < V; i++) {
            if (visited[i] == 0 && dfs(i, visited, adj)) return true;
        }
        return false;
    }

    private boolean dfs(int u, int[] visited, List<List<Integer>> adj) {
        visited[u] = 1;
        for (int v : adj.get(u)) {
            if (visited[v] == 1) return true;
            if (visited[v] == 0 && dfs(v, visited, adj)) return true;
        }
        visited[u] = 2;
        return false;
    }
}
`,
      c: `// Directed Graph Cycle Detection
bool isCyclic(int V, int** adj, int* adjSizes) {
    return true;
}
`,
      javascript: `var isCyclic = function(V, adj) {
    const visited = new Array(V).fill(0);
    const dfs = (u) => {
        visited[u] = 1;
        for (let v of adj[u]) {
            if (visited[v] === 1) return true;
            if (visited[v] === 0 && dfs(v)) return true;
        }
        visited[u] = 2;
        return false;
    };
    for (let i = 0; i < V; i++) {
        if (visited[i] === 0 && dfs(i)) return true;
    }
    return false;
};
`
    },
    sampleTestCases: [
      { id: 1, input: 'V = 4, edges = [[0,1],[1,2],[2,3],[3,0]]', expected: 'true' },
      { id: 2, input: 'V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]', expected: 'false' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'V = 2, edges = [[0,1],[1,0]]', expected: 'true' },
      { id: 'h2', input: 'V = 3, edges = [[0,1],[1,2]]', expected: 'false' }
    ],
    hints: [
      "Hint 1: Use 3-color DFS (0 = unvisited, 1 = in current recursion call stack, 2 = finished processing).",
      "Hint 2: Encountering a neighbor that is currently marked 1 indicates a back-edge, proving a cycle exists."
    ],
    solutionAnalysis: {
      userComplexity: "O(V + E) Time • O(V) Space",
      optimalComplexity: "O(V + E) Time • O(V) Space",
      bruteForceComplexity: "O(V * E) Path Checking",
      recommendation: "3-state DFS or Kahn's algorithm (indegree topological sorting) achieves optimal linear O(V + E)."
    }
  },
  {
    id: 'prob-8',
    title: 'Combine Two Tables',
    difficulty: 'Easy',
    topic: 'Database Programming',
    acceptance: '74%',
    attempts: '940',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Table: \`Person\`
\`\`\`
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| personId    | int     |
| lastName    | varchar |
| firstName   | varchar |
+-------------+---------+
personId is the primary key.
\`\`\`

Table: \`Address\`
\`\`\`
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| addressId   | int     |
| personId    | int     |
| city        | varchar |
| state       | varchar |
+-------------+---------+
addressId is the primary key.
\`\`\`

Write a solution to report the first name, last name, city, and state of each person in the \`Person\` table. If the address of a \`personId\` is not present in the \`Address\` table, report \`null\` instead.

Return the result table in **any order**.`,
    examples: [
      {
        input: 'Person = [[1, "Wang", "Allen"], [2, "Alice", "Bob"]], Address = [[1, 2, "New York City", "New York"]]',
        output: '+-----------+----------+---------------+----------+\n| firstName | lastName | city          | state    |\n+-----------+----------+---------------+----------+\n| Allen     | Wang     | null          | null     |\n| Bob       | Alice    | New York City | New York |\n+-----------+----------+---------------+----------+',
        explanation: 'There is no address in Address table for personId = 1, so city and state are null.'
      }
    ],
    constraints: [
      'Person table contains unique personId values.',
      'Address table contains unique addressId values.'
    ],
    starterCode: {
      mysql: `# Write your MySQL query statement below
SELECT p.firstName, p.lastName, a.city, a.state
FROM Person p
LEFT JOIN Address a ON p.personId = a.personId;
`
    },
    sampleTestCases: [
      { id: 1, input: 'Person: 2 rows, Address: 1 row', expected: 'Allen Wang null null, Bob Alice NYC NY' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'Person: 10 rows, Address: 5 rows', expected: '10 rows matched via LEFT JOIN' }
    ],
    hints: [
      "Hint 1: Use an outer join (LEFT JOIN) since person records must appear even when no corresponding address exists."
    ],
    solutionAnalysis: {
      userComplexity: "O(N + M) Time • O(N) Space",
      optimalComplexity: "O(N + M) Time • O(N) Space",
      bruteForceComplexity: "O(N * M) Cartesian Product",
      recommendation: "Hash Join or Nested Loop with index on Address.personId yields optimal O(N + M) performance."
    }
  },
  {
    id: 'prob-9',
    title: 'Second Highest Salary',
    difficulty: 'Medium',
    topic: 'Database Programming',
    acceptance: '43%',
    attempts: '1,420',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Table: \`Employee\`
\`\`\`
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key.
\`\`\`

Write a solution to find the second highest distinct salary from the \`Employee\` table. If there is no second highest salary, return \`null\`.`,
    examples: [
      {
        input: 'Employee = [[1, 100], [2, 200], [3, 300]]',
        output: '+---------------------+\n| SecondHighestSalary |\n+---------------------+\n| 200                 |\n+---------------------+',
        explanation: '300 is the highest, and 200 is the second highest salary.'
      }
    ],
    constraints: [
      'Employee table contains 0 or more rows.',
      'Salaries are positive integers.'
    ],
    starterCode: {
      mysql: `# Write your MySQL query statement below
SELECT (
    SELECT DISTINCT salary
    FROM Employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
) AS SecondHighestSalary;
`
    },
    sampleTestCases: [
      { id: 1, input: 'Employee: [100, 200, 300]', expected: '200' },
      { id: 2, input: 'Employee: [100]', expected: 'null' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'Employee: [500, 500, 300]', expected: '300' }
    ],
    hints: [
      "Hint 1: Use DISTINCT to handle duplicate salaries.",
      "Hint 2: Wrapping the query in a subquery returns NULL if OFFSET 1 produces 0 rows."
    ],
    solutionAnalysis: {
      userComplexity: "O(N log N) Time • O(1) Space",
      optimalComplexity: "O(N) Time with Index • O(1) Space",
      bruteForceComplexity: "O(N log N) Full Table Sort",
      recommendation: "Using B-Tree index on salary DESC allows O(1) index scan to locate second distinct salary."
    }
  },
  {
    id: 'prob-10',
    title: 'Customers Who Never Order',
    difficulty: 'Easy',
    topic: 'Database Programming',
    acceptance: '68%',
    attempts: '870',
    status: 'Not Attempted',
    timeLimit: '2.0s',
    memoryLimit: '128 MB',
    description: `Table: \`Customers\`
\`\`\`
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
+-------------+---------+
id is the primary key.
\`\`\`

Table: \`Orders\`
\`\`\`
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| customerId  | int  |
+-------------+------+
id is the primary key. customerId is a foreign key to Customers.id.
\`\`\`

Write a solution to find all customers who never order anything.

Return the result table with single column \`Customers\` in **any order**.`,
    examples: [
      {
        input: 'Customers = [[1, "Joe"], [2, "Henry"], [3, "Sam"], [4, "Max"]], Orders = [[1, 3], [2, 1]]',
        output: '+-----------+\n| Customers |\n+-----------+\n| Henry     |\n| Max       |\n+-----------+',
        explanation: 'Joe and Sam made orders. Henry and Max never ordered anything.'
      }
    ],
    constraints: [
      'Customers table contains unique IDs.',
      'Orders table contains unique IDs.'
    ],
    starterCode: {
      mysql: `# Write your MySQL query statement below
SELECT name AS Customers
FROM Customers
LEFT JOIN Orders ON Customers.id = Orders.customerId
WHERE Orders.customerId IS NULL;
`
    },
    sampleTestCases: [
      { id: 1, input: 'Customers: 4, Orders: 2', expected: 'Henry, Max' }
    ],
    hiddenTestCases: [
      { id: 'h1', input: 'Customers: 10, Orders: 10', expected: 'Empty set' }
    ],
    hints: [
      "Hint 1: Use LEFT JOIN and filter with WHERE Orders.customerId IS NULL, or use NOT IN / NOT EXISTS."
    ],
    solutionAnalysis: {
      userComplexity: "O(N + M) Time • O(N) Space",
      optimalComplexity: "O(N + M) Time with Index",
      bruteForceComplexity: "O(N * M) Nested Loop",
      recommendation: "NOT EXISTS with correlated subquery or LEFT JOIN with IS NULL is optimal in MySQL query planner."
    }
  }
];

export const codingLeaderboardData = [
  { rank: 1, name: "Kavya R.", department: "CSE", solved: 184, points: 3420, streak: 24 },
  { rank: 2, name: "Manoj K.", department: "CSE", solved: 172, points: 3180, streak: 19 },
  { rank: 3, name: "Suresh P.", department: "IT", solved: 165, points: 2990, streak: 15 },
  { rank: 4, name: "Divya N.", department: "CSE", solved: 154, points: 2840, streak: 12 },
  { rank: 5, name: "Ananya B.", department: "ECE", solved: 148, points: 2710, streak: 21 },
  { rank: 14, name: "Rahul K. (You)", department: "CSE", solved: 0, points: 0, streak: 0 }
];

export const codingAchievements = [
  { id: 'ach-1', title: '🔥 7 Day Streak', description: 'Solve problems on 7 consecutive days', unlocked: false, progress: '0/7 days' },
  { id: 'ach-2', title: '💻 First 10 Problems', description: 'Successfully solve your first 10 problems', unlocked: false, progress: '0/10' },
  { id: 'ach-3', title: '🏆 50 Problems Solved', description: 'Cross the 50 solved problems milestone', unlocked: false, progress: '0/50' },
  { id: 'ach-4', title: '⚡ First Problem Solved', description: 'Solve your first programming challenge', unlocked: false, progress: '0/1' },
  { id: 'ach-5', title: '🎯 First Submission', description: 'Submit your code for automated evaluation', unlocked: false, progress: '0/1' },
  { id: 'ach-6', title: '🌟 Algorithm Explorer', description: 'Attempt problems across at least 3 distinct topics', unlocked: false, progress: '0/3' }
];

export const codingAssessmentsList = [
  {
    id: 'assess-coding-01',
    title: 'Data Structures & Algorithms SEE Mid-Term Assessment',
    faculty: 'Dr. Priya Sharma',
    department: 'Computer Science & Engineering',
    className: 'B.Tech CSE — Section A',
    questionsCount: 5,
    durationMinutes: 90,
    startTime: 'Sep 15, 2025 • 10:00 AM',
    endTime: 'Sep 15, 2025 • 11:30 AM',
    status: 'upcoming',
    allowedLanguages: ['C', 'C++', 'Java', 'Python'],
    totalMarks: 100,
    difficulty: 'Medium',
    instructions: [
      'Do not refresh or close the browser during the assessment.',
      'Code editor is locked in high-security full-screen examination mode.',
      'General GMRIT AI assistant and hints are strictly disabled.',
      'Submissions are evaluated against hidden test cases.',
      'Server timer will automatically submit all active code upon expiry.'
    ],
    questionIds: ['prob-1', 'prob-2', 'prob-3', 'prob-5', 'prob-6']
  },
  {
    id: 'assess-coding-02',
    title: 'Object-Oriented Programming & Standard Template Library (STL)',
    faculty: 'Prof. K. S. Rao',
    department: 'Computer Science & Engineering',
    className: 'B.Tech CSE — Section A & B',
    questionsCount: 4,
    durationMinutes: 75,
    startTime: 'Sep 18, 2025 • 02:00 PM',
    endTime: 'Sep 18, 2025 • 03:15 PM',
    status: 'upcoming',
    allowedLanguages: ['C++', 'Java'],
    totalMarks: 80,
    difficulty: 'Medium',
    instructions: [
      'Ensure standard OOP paradigms (encapsulation, abstraction) are maintained.',
      'Each question carries 20 marks evaluated on hidden test edge cases.'
    ],
    questionIds: ['prob-1', 'prob-3', 'prob-5', 'prob-7']
  },
  {
    id: 'assess-coding-03',
    title: 'Python Scientific & Numerical Computing Lab Quiz',
    faculty: 'Dr. Priya Sharma',
    department: 'Computer Science & Engineering',
    className: 'B.Tech CSE — Section A',
    questionsCount: 5,
    durationMinutes: 60,
    startTime: 'Sep 06, 2025 • 11:00 AM',
    endTime: 'Sep 06, 2025 • 12:00 PM',
    status: 'completed',
    allowedLanguages: ['Python'],
    totalMarks: 100,
    score: 82,
    solvedCount: 4,
    testCasesPassed: '38 / 42',
    runtimeScore: 'Good (42 ms avg)',
    problemBreakdown: [
      { id: 'Q1', title: 'Vector Dot Product', marks: '20 / 20', status: 'Passed', testCases: '10/10' },
      { id: 'Q2', title: 'Matrix Transpose & Inversion', marks: '20 / 20', status: 'Passed', testCases: '8/8' },
      { id: 'Q3', title: 'Two Sum Variant', marks: '18 / 20', status: 'Partial', testCases: '9/10' },
      { id: 'Q4', title: 'Kadane Max Contiguous Slice', marks: '24 / 30', status: 'Partial', testCases: '11/14' },
      { id: 'Q5', title: 'Graph Cycle Verification', marks: '0 / 10', status: 'Failed', testCases: '0/10' }
    ]
  }
];

export const facultyStruggleAnalytics = [
  {
    questionId: 'Q3',
    title: 'Graph Traversal & Cycle Detection',
    successRate: '42%',
    averageAttempts: 3.2,
    flag: 'Students may need additional instruction on 3-color DFS and back-edges.',
    strugglingCount: 48,
    totalAssigned: 184
  },
  {
    questionId: 'Q5',
    title: 'Dynamic Programming — Coin Change',
    successRate: '48%',
    averageAttempts: 2.8,
    flag: 'Common misconception: greedy coin choice fails for non-canonical coin sets.',
    strugglingCount: 39,
    totalAssigned: 184
  }
];

export const adminExecutionSettings = {
  cpuLimit: '1.0 vCPU',
  memoryLimit: '256 MB',
  executionTimeout: '5.0s',
  maxOutputSize: '64 KB',
  maxCodeSize: '128 KB',
  networkAccess: 'Disabled (Airgapped Sandbox)',
  filesystemAccess: 'Ephemeral OverlayFS (Read-only root, temporary /tmp)',
  sandboxStatus: '4 / 4 Isolated Worker Nodes Active (Docker Daemon 26.0)'
};

export const adminCodingAnalytics = {
  totalProblems: 180,
  totalSubmissions: 14280,
  totalStudentsPracticing: 1450,
  averageSuccessRate: '68.4%',
  totalAssessmentsConducted: 42,
  languageUsage: [
    { name: 'Python', percentage: 42, color: '#3B82F6' },
    { name: 'Java', percentage: 28, color: '#10B981' },
    { name: 'C++', percentage: 18, color: '#8B5CF6' },
    { name: 'C', percentage: 8, color: '#F97316' },
    { name: 'JavaScript', percentage: 4, color: '#F59E0B' }
  ],
  weeklyActivity: [
    { day: 'Mon', submissions: 1820 },
    { day: 'Tue', submissions: 2140 },
    { day: 'Wed', submissions: 2490 },
    { day: 'Thu', submissions: 2280 },
    { day: 'Fri', submissions: 2850 },
    { day: 'Sat', submissions: 1420 },
    { day: 'Sun', submissions: 1280 }
  ]
};
