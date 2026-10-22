// Harness generator test
export function generateExecutionSource(problemId, language, userCode, testCase) {
  const inputStr = testCase?.input || '';
  
  if (language === 'python') {
    if (problemId === 'prob-1') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        return `${userCode}

import json
try:
    sol = Solution()
    res = sol.twoSum(${match[1]}, ${match[2]})
    if isinstance(res, (list, tuple)):
        print(json.dumps(list(res)))
    else:
        print(res)
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
      }
    }

    if (problemId === 'prob-3') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        return `${userCode}

try:
    sol = Solution()
    res = sol.search(${match[1]}, ${match[2]})
    print(res)
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
      }
    }

    if (problemId === 'prob-4') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `${userCode}

try:
    sol = Solution()
    res = sol.lengthOfLongestSubstring(${strVal})
    print(res)
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
    }

    if (problemId === 'prob-5') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `${userCode}

try:
    sol = Solution()
    res = sol.isValid(${strVal})
    print(str(res).lower())
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
    }

    if (problemId === 'prob-6') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])/);
      if (match) {
        return `${userCode}

try:
    sol = Solution()
    res = sol.maxSubArray(${match[1]})
    print(res)
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
      }
    }

    if (problemId === 'prob-7') {
      const match = inputStr.match(/V\s*=\s*(\d+)\s*,\s*edges\s*=\s*(\[\[.*?\]\])/);
      if (match) {
        return `${userCode}

try:
    V = ${match[1]}
    edges = ${match[2]}
    adj = [[] for _ in range(V)]
    for u, v in edges:
        adj[u].append(v)
    sol = Solution()
    res = sol.isCyclic(V, adj)
    print(str(res).lower())
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
      }
    }
  }

  if (language === 'javascript') {
    if (problemId === 'prob-1') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        return `${userCode}

try {
  const res = twoSum(${match[1]}, ${match[2]});
  console.log(JSON.stringify(res));
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
      }
    }

    if (problemId === 'prob-3') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        return `${userCode}

try {
  const res = search(${match[1]}, ${match[2]});
  console.log(res);
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
      }
    }

    if (problemId === 'prob-4') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `${userCode}

try {
  const res = lengthOfLongestSubstring(${strVal});
  console.log(res);
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
    }

    if (problemId === 'prob-5') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `${userCode}

try {
  const res = isValid(${strVal});
  console.log(String(res));
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
    }

    if (problemId === 'prob-6') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])/);
      if (match) {
        return `${userCode}

try {
  const res = maxSubArray(${match[1]});
  console.log(res);
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
      }
    }
  }

  // SQLite Schema execution for SQL problems
  if (language === 'mysql' || language === 'sql') {
    if (problemId === 'prob-8') {
      return `CREATE TABLE Person (personId INT PRIMARY KEY, lastName TEXT, firstName TEXT);
CREATE TABLE Address (addressId INT PRIMARY KEY, personId INT, city TEXT, state TEXT);
INSERT INTO Person VALUES (1, 'Wang', 'Allen'), (2, 'Alice', 'Bob');
INSERT INTO Address VALUES (1, 2, 'New York City', 'New York');

.mode csv
${userCode}
`;
    }
    if (problemId === 'prob-9') {
      return `CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);
INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);

.mode csv
${userCode}
`;
    }
    if (problemId === 'prob-10') {
      return `CREATE TABLE Customers (id INT PRIMARY KEY, name TEXT);
CREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);
INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');
INSERT INTO Orders VALUES (1, 3), (2, 1);

.mode csv
${userCode}
`;
    }
    return userCode;
  }

  return userCode;
}
