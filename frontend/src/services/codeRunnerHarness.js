// GMRIT Academic Hub - Multi-Language Automated Execution Harness Engine
// Supports Python, JavaScript, C++, C, Java, and MySQL / SQLite for LeetCode-style problems

export function generateExecutionSource(problemId, language, userCode, testCase) {
  const inputStr = testCase?.input || '';
  const lang = (language || 'python').toLowerCase().replace('c++', 'cpp');

  // ==========================================
  // 1. PYTHON HARNESSES
  // ==========================================
  if (lang === 'python') {
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

    if (problemId === 'prob-2') {
      const match = inputStr.match(/head\s*=\s*(\[.*?\])/);
      const arrStr = match ? match[1] : '[]';
      return `${userCode}

import json

class _ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _build_list(arr):
    dummy = _ListNode(0)
    curr = dummy
    for v in arr:
        curr.next = _ListNode(v)
        curr = curr.next
    return dummy.next

def _list_to_arr(head):
    res = []
    curr = head
    while curr:
        res.append(curr.val)
        curr = curr.next
    return res

try:
    arr = ${arrStr}
    head = _build_list(arr)
    sol = Solution()
    rev = sol.reverseList(head)
    print(json.dumps(_list_to_arr(rev)))
except Exception as e:
    import sys
    sys.stderr.write(str(e))
    sys.exit(1)
`;
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

  // ==========================================
  // 2. JAVASCRIPT HARNESSES
  // ==========================================
  if (lang === 'javascript' || lang === 'js') {
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

    if (problemId === 'prob-2') {
      const match = inputStr.match(/head\s*=\s*(\[.*?\])/);
      const arrStr = match ? match[1] : '[]';
      return `function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}

${userCode}

function buildList(arr) {
    let dummy = new ListNode(0);
    let curr = dummy;
    for (let v of arr) {
        curr.next = new ListNode(v);
        curr = curr.next;
    }
    return dummy.next;
}

function listToArr(head) {
    let res = [];
    let curr = head;
    while (curr) {
        res.push(curr.val);
        curr = curr.next;
    }
    return res;
}

try {
    const arr = ${arrStr};
    const head = buildList(arr);
    const rev = reverseList(head);
    console.log(JSON.stringify(listToArr(rev)));
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
`;
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

    if (problemId === 'prob-7') {
      const match = inputStr.match(/V\s*=\s*(\d+)\s*,\s*edges\s*=\s*(\[\[.*?\]\])/);
      if (match) {
        return `${userCode}

try {
  const V = ${match[1]};
  const edges = ${match[2]};
  const adj = Array.from({length: V}, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
  }
  const res = isCyclic(V, adj);
  console.log(String(res));
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
      }
    }
  }

  // ==========================================
  // 3. C++ HARNESSES
  // ==========================================
  if (lang === 'cpp') {
    if (problemId === 'prob-1') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const cppNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <iostream>
#include <vector>
using namespace std;

${userCode}

int main() {
    try {
        Solution sol;
        vector<int> nums = ${cppNums};
        int target = ${match[2]};
        vector<int> res = sol.twoSum(nums, target);
        cout << "[";
        for (size_t i = 0; i < res.size(); ++i) {
            cout << res[i] << (i + 1 < res.size() ? ", " : "");
        }
        cout << "]" << endl;
    } catch (const std::exception& e) {
        cerr << e.what() << endl;
        return 1;
    }
    return 0;
}
`;
      }
    }

    if (problemId === 'prob-2') {
      const match = inputStr.match(/head\s*=\s*(\[.*?\])/);
      const arr = match ? match[1].replace(/\[/g, '{').replace(/\]/g, '}') : '{}';
      return `#include <iostream>
#include <vector>
using namespace std;

#ifndef LISTNODE_DEF
#define LISTNODE_DEF
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
#endif

${userCode}

int main() {
    try {
        vector<int> arr = ${arr};
        ListNode dummy(0);
        ListNode* curr = &dummy;
        for (int v : arr) {
            curr->next = new ListNode(v);
            curr = curr->next;
        }
        Solution sol;
        ListNode* rev = sol.reverseList(dummy.next);
        cout << "[";
        curr = rev;
        while (curr) {
            cout << curr->val;
            if (curr->next) cout << ", ";
            curr = curr->next;
        }
        cout << "]" << endl;
    } catch (const std::exception& e) {
        cerr << e.what() << endl;
        return 1;
    }
    return 0;
}
`;
    }

    if (problemId === 'prob-3') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const cppNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <iostream>
#include <vector>
using namespace std;

${userCode}

int main() {
    Solution sol;
    vector<int> nums = ${cppNums};
    int target = ${match[2]};
    cout << sol.search(nums, target) << endl;
    return 0;
}
`;
      }
    }

    if (problemId === 'prob-4') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `#include <iostream>
#include <string>
using namespace std;

${userCode}

int main() {
    Solution sol;
    string s = ${strVal};
    cout << sol.lengthOfLongestSubstring(s) << endl;
    return 0;
}
`;
    }

    if (problemId === 'prob-5') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

${userCode}

int main() {
    Solution sol;
    string s = ${strVal};
    cout << (sol.isValid(s) ? "true" : "false") << endl;
    return 0;
}
`;
    }

    if (problemId === 'prob-6') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])/);
      if (match) {
        const cppNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <iostream>
#include <vector>
using namespace std;

${userCode}

int main() {
    Solution sol;
    vector<int> nums = ${cppNums};
    cout << sol.maxSubArray(nums) << endl;
    return 0;
}
`;
      }
    }

    if (problemId === 'prob-7') {
      const match = inputStr.match(/V\s*=\s*(\d+)\s*,\s*edges\s*=\s*(\[\[.*?\]\])/);
      if (match) {
        const cppEdges = match[2].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <iostream>
#include <vector>
using namespace std;

${userCode}

int main() {
    int V = ${match[1]};
    vector<vector<int>> edges = ${cppEdges};
    vector<vector<int>> adj(V);
    for (const auto& e : edges) {
        if (!e.empty() && e.size() >= 2) {
            adj[e[0]].push_back(e[1]);
        }
    }
    Solution sol;
    cout << (sol.isCyclic(V, adj) ? "true" : "false") << endl;
    return 0;
}
`;
      }
    }
  }

  // ==========================================
  // 4. C HARNESSES
  // ==========================================
  if (lang === 'c') {
    if (problemId === 'prob-1') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const cNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <stdio.h>
#include <stdlib.h>

${userCode}

int main() {
    int nums[] = ${cNums};
    int n = sizeof(nums) / sizeof(nums[0]);
    int target = ${match[2]};
    int returnSize = 0;
    int* res = twoSum(nums, n, target, &returnSize);
    if (!res) {
        printf("[]\\n");
        return 0;
    }
    printf("[");
    for (int i = 0; i < returnSize; i++) {
        printf("%d%s", res[i], (i + 1 < returnSize ? ", " : ""));
    }
    printf("]\\n");
    free(res);
    return 0;
}
`;
      }
    }

    if (problemId === 'prob-2') {
      const match = inputStr.match(/head\s*=\s*(\[.*?\])/);
      const isNotEmpty = match && match[1] !== '[]';
      const cArr = isNotEmpty ? match[1].replace(/\[/g, '{').replace(/\]/g, '}') : '{0}';
      const count = isNotEmpty ? match[1].split(',').length : 0;
      return `#include <stdio.h>
#include <stdlib.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

${userCode}

int main() {
    int arr[] = ${cArr};
    int n = ${count};
    struct ListNode dummy;
    dummy.next = NULL;
    struct ListNode* curr = &dummy;
    for (int i = 0; i < n; i++) {
        struct ListNode* node = (struct ListNode*)malloc(sizeof(struct ListNode));
        node->val = arr[i];
        node->next = NULL;
        curr->next = node;
        curr = node;
    }
    struct ListNode* rev = reverseList(dummy.next);
    printf("[");
    curr = rev;
    while (curr) {
        printf("%d%s", curr->val, curr->next ? ", " : "");
        curr = curr->next;
    }
    printf("]\\n");
    return 0;
}
`;
    }

    if (problemId === 'prob-3') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const cNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <stdio.h>

${userCode}

int main() {
    int nums[] = ${cNums};
    int n = sizeof(nums) / sizeof(nums[0]);
    int target = ${match[2]};
    printf("%d\\n", search(nums, n, target));
    return 0;
}
`;
      }
    }

    if (problemId === 'prob-4') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `#include <stdio.h>

${userCode}

int main() {
    char s[] = ${strVal};
    printf("%d\\n", lengthOfLongestSubstring(s));
    return 0;
}
`;
    }

    if (problemId === 'prob-5') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `#include <stdio.h>
#include <stdbool.h>

${userCode}

int main() {
    char s[] = ${strVal};
    printf("%s\\n", isValid(s) ? "true" : "false");
    return 0;
}
`;
    }

    if (problemId === 'prob-6') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])/);
      if (match) {
        const cNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `#include <stdio.h>

${userCode}

int main() {
    int nums[] = ${cNums};
    int n = sizeof(nums) / sizeof(nums[0]);
    printf("%d\\n", maxSubArray(nums, n));
    return 0;
}
`;
      }
    }
  }

  // ==========================================
  // 5. JAVA HARNESSES
  // ==========================================
  if (lang === 'java') {
    if (problemId === 'prob-1') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const javaNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            int[] nums = new int[]${javaNums};
            int target = ${match[2]};
            int[] res = sol.twoSum(nums, target);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < res.length; i++) {
                sb.append(res[i]);
                if (i + 1 < res.length) sb.append(", ");
            }
            sb.append("]");
            System.out.println(sb.toString());
        } catch (Exception e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }
}
`;
      }
    }

    if (problemId === 'prob-2') {
      const match = inputStr.match(/head\s*=\s*(\[.*?\])/);
      const javaArr = match ? match[1].replace(/\[/g, '{').replace(/\]/g, '}') : '{}';
      return `import java.util.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

${userCode}

public class Main {
    public static void main(String[] args) {
        try {
            int[] arr = new int[]${javaArr};
            ListNode dummy = new ListNode(0);
            ListNode curr = dummy;
            for (int v : arr) {
                curr.next = new ListNode(v);
                curr = curr.next;
            }
            Solution sol = new Solution();
            ListNode rev = sol.reverseList(dummy.next);
            StringBuilder sb = new StringBuilder("[");
            curr = rev;
            while (curr != null) {
                sb.append(curr.val);
                if (curr.next != null) sb.append(", ");
                curr = curr.next;
            }
            sb.append("]");
            System.out.println(sb.toString());
        } catch (Exception e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }
}
`;
    }

    if (problemId === 'prob-3') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])\s*,\s*target\s*=\s*(-?\d+)/);
      if (match) {
        const javaNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] nums = new int[]${javaNums};
        int target = ${match[2]};
        System.out.println(sol.search(nums, target));
    }
}
`;
      }
    }

    if (problemId === 'prob-4') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        String s = ${strVal};
        System.out.println(sol.lengthOfLongestSubstring(s));
    }
}
`;
    }

    if (problemId === 'prob-5') {
      const match = inputStr.match(/s\s*=\s*(".*?")/);
      const strVal = match ? match[1] : '""';
      return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        String s = ${strVal};
        System.out.println(sol.isValid(s) ? "true" : "false");
    }
}
`;
    }

    if (problemId === 'prob-6') {
      const match = inputStr.match(/nums\s*=\s*(\[.*?\])/);
      if (match) {
        const javaNums = match[1].replace(/\[/g, '{').replace(/\]/g, '}');
        return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] nums = new int[]${javaNums};
        System.out.println(sol.maxSubArray(nums));
    }
}
`;
      }
    }

    if (problemId === 'prob-7') {
      const match = inputStr.match(/V\s*=\s*(\d+)\s*,\s*edges\s*=\s*(\[\[.*?\]\])/);
      if (match) {
        const javaEdges = match[2].replace(/\[/g, '{').replace(/\]/g, '}');
        return `import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        int V = ${match[1]};
        int[][] edges = new int[][]${javaEdges};
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            if (e != null && e.length >= 2) {
                adj.get(e[0]).add(e[1]);
            }
        }
        Solution sol = new Solution();
        System.out.println(sol.isCyclic(V, adj) ? "true" : "false");
    }
}
`;
      }
    }
  }

  // ==========================================
  // 6. MYSQL / SQL SCHEMAS
  // ==========================================
  if (lang === 'mysql' || lang === 'sql') {
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
