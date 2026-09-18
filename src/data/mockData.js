// GMRIT Academic Management & AI Learning Platform - Mock Dataset

export const mockUsers = {
  student: {
    id: "usr_std_001",
    name: "Rahul Kumar",
    rollNumber: "23A81A0501",
    email: "23a81a0501@gmrit.edu.in",
    role: "student",
    department: "Computer Science & Engineering",
    program: "B.Tech",
    regulation: "R20",
    semester: 4,
    academicYear: "2025-2026",
    section: "CSE-A",
    avatar: "RK",
    cgpa: 8.42,
    cgpaGrowth: "+0.34",
    overallPerformance: 82.4,
    performanceGrowth: "+6.2%",
    attendance: 91.0,
    attendanceStatus: "Good Standing",
    assessmentsCompleted: "18 / 22"
  },
  faculty: {
    id: "usr_fac_1042",
    name: "Dr. Priya Sharma",
    employeeId: "GMR-CSE-1042",
    email: "priya.sharma@gmrit.edu.in",
    role: "faculty",
    designation: "Associate Professor & Lead - AI Specialization",
    department: "Computer Science & Engineering",
    subjects: ["Machine Learning", "Artificial Intelligence", "Deep Learning"],
    totalStudents: 184,
    averagePerformance: 78.6,
    averageAttendance: 87.4,
    activeAssessments: 12,
    avatar: "PS"
  },
  admin: {
    id: "usr_adm_0001",
    name: "Admin Console",
    officialName: "Er. M. V. Subrahmanyam",
    email: "dean.academics@gmrit.edu.in",
    role: "admin",
    designation: "Dean of Academic Computing & IT Operations",
    department: "Central Administrative IT Cell",
    permissions: "Super Administrator (All Access)",
    avatar: "AD"
  }
};

export const studentKPIs = [
  {
    id: "perf",
    label: "Overall Performance",
    value: "82.4%",
    subtext: "↑ 6.2% this semester",
    trend: "positive",
    icon: "TrendingUp"
  },
  {
    id: "att",
    label: "Attendance",
    value: "91%",
    subtext: "Good Standing (Min 75%)",
    trend: "positive",
    icon: "UserCheck"
  },
  {
    id: "assess",
    label: "Assessments",
    value: "18 / 22",
    subtext: "4 Quizzes Remaining",
    trend: "neutral",
    icon: "CheckSquare"
  },
  {
    id: "cgpa",
    label: "Current CGPA",
    value: "8.42",
    subtext: "↑ 0.34 from Sem 3",
    trend: "positive",
    icon: "Award"
  }
];

export const academicSubjects = [
  {
    id: "sub_ml",
    code: "20CS401",
    name: "Machine Learning",
    department: "CSE",
    semester: 4,
    credits: 4,
    progress: 78,
    score: 91,
    syllabusProgress: "12 / 15 Units",
    assessmentsCompleted: "4 / 5",
    pyqAvailable: true,
    faculty: "Dr. Priya Sharma",
    color: "#00F2FE",
    units: [
      {
        number: "Unit I",
        title: "Introduction to Machine Learning",
        summary: "Supervised vs Unsupervised, Machine Learning Pipeline, Overfitting and Regularization.",
        pdfName: "GMRIT_R20_ML_Unit1_Syllabus.pdf",
        notesCount: 3,
        ragChunks: 42,
        indexed: true
      },
      {
        number: "Unit II",
        title: "Regression Analysis & Gradient Descent",
        summary: "Simple and Multiple Linear Regression, Cost Functions, Batch vs Stochastic Gradient Descent.",
        pdfName: "GMRIT_R20_ML_Unit2_Regression.pdf",
        notesCount: 4,
        ragChunks: 58,
        indexed: true
      },
      {
        number: "Unit III",
        title: "Classification & Decision Trees",
        summary: "Logistic Regression, Support Vector Machines (SVM), Decision Trees, Information Gain, Gini Index.",
        pdfName: "GMRIT_R20_ML_Unit3_Classification.pdf",
        notesCount: 5,
        ragChunks: 74,
        indexed: true
      },
      {
        number: "Unit IV",
        title: "Unsupervised Learning & Clustering",
        summary: "K-Means Clustering, Hierarchical Clustering, Principal Component Analysis (PCA), Dimensionality Reduction.",
        pdfName: "GMRIT_R20_ML_Unit4_Clustering.pdf",
        notesCount: 3,
        ragChunks: 52,
        indexed: true
      },
      {
        number: "Unit V",
        title: "Artificial Neural Networks & Deep Learning Intro",
        summary: "Perceptrons, Multi-Layer Perceptron (MLP), Backpropagation, Activation Functions, CNN fundamentals.",
        pdfName: "GMRIT_R20_ML_Unit5_NeuralNetworks.pdf",
        notesCount: 6,
        ragChunks: 88,
        indexed: true
      }
    ]
  },
  {
    id: "sub_ds",
    code: "20CS402",
    name: "Data Structures & Algorithms",
    department: "CSE",
    semester: 4,
    credits: 4,
    progress: 92,
    score: 82,
    syllabusProgress: "14 / 15 Units",
    assessmentsCompleted: "5 / 5",
    pyqAvailable: true,
    faculty: "Dr. V. Ramesh",
    color: "#10B981",
    units: [
      { number: "Unit I", title: "Linear Data Structures (Arrays & Linked Lists)", pdfName: "DSA_Unit1.pdf", notesCount: 4, ragChunks: 48, indexed: true },
      { number: "Unit II", title: "Stacks & Queues with Applications", pdfName: "DSA_Unit2.pdf", notesCount: 3, ragChunks: 39, indexed: true },
      { number: "Unit III", title: "Trees, Binary Search Trees & AVL Trees", pdfName: "DSA_Unit3.pdf", notesCount: 5, ragChunks: 64, indexed: true },
      { number: "Unit IV", title: "Graphs, Traversals (BFS/DFS) & Shortest Path", pdfName: "DSA_Unit4.pdf", notesCount: 4, ragChunks: 55, indexed: true },
      { number: "Unit V", title: "Dynamic Programming & Greedy Algorithms", pdfName: "DSA_Unit5.pdf", notesCount: 4, ragChunks: 62, indexed: true }
    ]
  },
  {
    id: "sub_dbms",
    code: "20CS403",
    name: "Database Management Systems",
    department: "CSE",
    semester: 4,
    credits: 3,
    progress: 74,
    score: 88,
    syllabusProgress: "10 / 14 Units",
    assessmentsCompleted: "3 / 5",
    pyqAvailable: true,
    faculty: "Prof. K. S. Rao",
    color: "#FF7300",
    units: [
      { number: "Unit I", title: "Database System Concepts & Architecture", pdfName: "DBMS_Unit1.pdf", notesCount: 2, ragChunks: 36, indexed: true },
      { number: "Unit II", title: "Relational Data Model & Relational Algebra", pdfName: "DBMS_Unit2.pdf", notesCount: 3, ragChunks: 44, indexed: true },
      { number: "Unit III", title: "SQL Queries, Integrity Constraints & Triggers", pdfName: "DBMS_Unit3.pdf", notesCount: 4, ragChunks: 56, indexed: true },
      { number: "Unit IV", title: "Database Normalization (1NF, 2NF, 3NF, BCNF)", pdfName: "DBMS_Unit4.pdf", notesCount: 5, ragChunks: 68, indexed: true },
      { number: "Unit V", title: "Transaction Processing, Concurrency & Recovery", pdfName: "DBMS_Unit5.pdf", notesCount: 4, ragChunks: 50, indexed: true }
    ]
  },
  {
    id: "sub_os",
    code: "20CS404",
    name: "Operating Systems",
    department: "CSE",
    semester: 4,
    credits: 3,
    progress: 80,
    score: 76,
    syllabusProgress: "11 / 14 Units",
    assessmentsCompleted: "3 / 4",
    pyqAvailable: true,
    faculty: "Dr. Ch. Lakshmi",
    color: "#8B5CF6",
    units: [
      { number: "Unit I", title: "OS Structures, System Calls & Services", pdfName: "OS_Unit1.pdf", notesCount: 3, ragChunks: 38, indexed: true },
      { number: "Unit II", title: "Process Management & CPU Scheduling", pdfName: "OS_Unit2.pdf", notesCount: 4, ragChunks: 51, indexed: true },
      { number: "Unit III", title: "Process Synchronization & Deadlocks", pdfName: "OS_Unit3.pdf", notesCount: 4, ragChunks: 59, indexed: true },
      { number: "Unit IV", title: "Memory Management & Virtual Memory (Paging)", pdfName: "OS_Unit4.pdf", notesCount: 5, ragChunks: 65, indexed: true },
      { number: "Unit V", title: "File Systems, Storage Management & I/O", pdfName: "OS_Unit5.pdf", notesCount: 3, ragChunks: 42, indexed: true }
    ]
  },
  {
    id: "sub_cn",
    code: "20CS405",
    name: "Computer Networks",
    department: "CSE",
    semester: 4,
    credits: 3,
    progress: 85,
    score: 84,
    syllabusProgress: "13 / 15 Units",
    assessmentsCompleted: "3 / 3",
    pyqAvailable: true,
    faculty: "Er. S. Verma",
    color: "#3B82F6",
    units: [
      { number: "Unit I", title: "Physical Layer & Network Topologies", pdfName: "CN_Unit1.pdf", notesCount: 3, ragChunks: 40, indexed: true },
      { number: "Unit II", title: "Data Link Layer & Error Control (CRC, HDLC)", pdfName: "CN_Unit2.pdf", notesCount: 4, ragChunks: 49, indexed: true },
      { number: "Unit III", title: "Network Layer, Routing Algorithms & IPv4/IPv6", pdfName: "CN_Unit3.pdf", notesCount: 5, ragChunks: 63, indexed: true },
      { number: "Unit IV", title: "Transport Layer Protocols (TCP, UDP, Flow Control)", pdfName: "CN_Unit4.pdf", notesCount: 4, ragChunks: 54, indexed: true },
      { number: "Unit V", title: "Application Layer Protocols (DNS, HTTP, SMTP)", pdfName: "CN_Unit5.pdf", notesCount: 3, ragChunks: 45, indexed: true }
    ]
  }
];

export const pyqList = [
  {
    id: "pyq_01",
    subject: "Machine Learning",
    subjectCode: "20CS401",
    year: "2025",
    regulation: "R20",
    examType: "Semester End Examination",
    questionCount: 12,
    maxMarks: 70,
    difficulty: "Moderate - Hard",
    pdfUrl: "GMRIT_ML_SEE_2025_Paper.pdf",
    keyTopics: ["Decision Trees vs Random Forests", "Backpropagation proof", "SVM Hyperplane Margin", "K-Means convergence proof"],
    sampleQuestions: [
      "Explain the mathematical intuition of Support Vector Machines (SVM) with soft margins.",
      "Derive the backpropagation weight update formula using gradient descent for a 3-layer neural network.",
      "Contrast Bagging and Boosting algorithms with architectural diagrams."
    ]
  },
  {
    id: "pyq_02",
    subject: "Data Structures & Algorithms",
    subjectCode: "20CS402",
    year: "2024",
    regulation: "R20",
    examType: "Mid Examination",
    questionCount: 18,
    maxMarks: 30,
    difficulty: "Moderate",
    pdfUrl: "GMRIT_DSA_Mid1_2024_Paper.pdf",
    keyTopics: ["AVL Rotations", "BFS vs DFS implementations", "Dijkstra Algorithm", "Binary Search Tree Deletion"],
    sampleQuestions: [
      "Demonstrate AVL tree balancing operations with LL, RR, LR, and RL rotations for given insertion sequence.",
      "Write an algorithm to detect a cycle in a directed graph using DFS coloring method."
    ]
  },
  {
    id: "pyq_03",
    subject: "Database Management Systems",
    subjectCode: "20CS403",
    year: "2024",
    regulation: "R20",
    examType: "Semester End Examination",
    questionCount: 14,
    maxMarks: 70,
    difficulty: "Moderate",
    pdfUrl: "GMRIT_DBMS_SEE_2024_Paper.pdf",
    keyTopics: ["BCNF vs 3NF Decomposition", "ACID properties implementation", "Two-Phase Locking (2PL)", "B+ Tree Indexing"],
    sampleQuestions: [
      "Given relation R(A, B, C, D, E) with FDs {A->BC, CD->E, B->D, E->A}, find candidate keys and decompose to BCNF.",
      "Explain how write-ahead logging (WAL) guarantees Atomicity and Durability during system crashes."
    ]
  },
  {
    id: "pyq_04",
    subject: "Operating Systems",
    subjectCode: "20CS404",
    year: "2023",
    regulation: "R20",
    examType: "Semester End Examination",
    questionCount: 15,
    maxMarks: 70,
    difficulty: "Moderate - Hard",
    pdfUrl: "GMRIT_OS_SEE_2023_Paper.pdf",
    keyTopics: ["Banker's Algorithm", "Page Replacement (LRU/FIFO)", "Dining Philosophers Semaphore", "Inverted Page Tables"],
    sampleQuestions: [
      "Execute Banker's Algorithm on given allocation matrix and determine if the current state is safe.",
      "Calculate total page faults for reference string with 3 frames using FIFO, LRU, and Optimal replacement algorithms."
    ]
  },
  {
    id: "pyq_05",
    subject: "Computer Networks",
    subjectCode: "20CS405",
    year: "2024",
    regulation: "R20",
    examType: "Mid Examination",
    questionCount: 16,
    maxMarks: 30,
    difficulty: "Moderate",
    pdfUrl: "GMRIT_CN_Mid2_2024_Paper.pdf",
    keyTopics: ["Distance Vector Routing", "TCP Congestion Control (Slow Start)", "Subnet Masking Calculation", "Sliding Window Protocol"],
    sampleQuestions: [
      "Explain TCP Tahoe vs TCP Reno congestion window dynamics with graphical representation.",
      "Given IP block 192.168.10.0/24, create 4 subnets and specify network ID, broadcast IP, and usable host range for each."
    ]
  }
];

export const assessmentsList = [
  {
    id: "quiz_ml_04",
    subject: "Machine Learning",
    title: "Machine Learning — Quiz 4",
    subtitle: "Classification Models & Evaluation Metrics",
    questionCount: 20,
    duration: "30 minutes",
    dueDate: "Tomorrow, 11:59 PM",
    dueRaw: "Tomorrow",
    status: "upcoming",
    totalPoints: 20,
    faculty: "Dr. Priya Sharma",
    questions: [
      {
        id: "q1",
        question: "Which evaluation metric is most appropriate for a severely imbalanced classification dataset?",
        options: [
          "Raw Accuracy",
          "F1-Score and Area Under ROC Curve (AUC-ROC)",
          "Mean Squared Error (MSE)",
          "Silhouette Coefficient"
        ],
        correctAnswer: 1,
        explanation: "In imbalanced datasets, raw accuracy is deceptive because a model predicting only the majority class can yield 99% accuracy. F1-Score (harmonic mean of Precision & Recall) and PR/ROC AUC evaluate positive class detection accurately."
      },
      {
        id: "q2",
        question: "In Decision Trees, what formula does the Gini Impurity measure utilize for binary classification with proportion p?",
        options: [
          "Gini = 1 - (p² + (1-p)²)",
          "Gini = - (p log p + (1-p) log(1-p))",
          "Gini = (p - 0.5)²",
          "Gini = p / (1 - p)"
        ],
        correctAnswer: 0,
        explanation: "Gini Impurity is defined as 1 - Σ(p_i²). For binary classification, it equals 1 - (p² + (1-p)²), with maximum value 0.5 for equal split."
      },
      {
        id: "q3",
        question: "What is the primary role of the margin in Support Vector Machines (SVM)?",
        options: [
          "To speed up gradient descent iterations",
          "To maximize the distance between the decision hyperplane and the closest training points (support vectors)",
          "To eliminate outlier data points automatically",
          "To convert non-convex loss functions into concave surfaces"
        ],
        correctAnswer: 1,
        explanation: "SVM optimizes for maximum margin classification, maximizing the geometric distance 2/||w|| to ensure best generalization and minimize overfitting risk."
      },
      {
        id: "q4",
        question: "How does L1 Regularization (Lasso) differ from L2 Regularization (Ridge) in regression models?",
        options: [
          "L1 adds squared weights; L2 adds absolute weights",
          "L1 drives less important coefficients strictly to zero (feature selection); L2 shrinks them smoothly towards zero",
          "L1 increases model variance; L2 increases model bias only",
          "L1 can only be used with categorical target variables"
        ],
        correctAnswer: 1,
        explanation: "L1 norm penalty |w| produces sparse models by driving coefficients exactly to 0, serving as embedded feature selection, whereas L2 norm (w²) penalizes extreme weights without setting them to absolute 0."
      },
      {
        id: "q5",
        question: "What mathematical challenge occurs when deep networks use Sigmoid activation functions throughout multiple layers?",
        options: [
          "Exploding gradient only",
          "Vanishing gradient problem due to derivative values bounded between 0 and 0.25",
          "Matrix determinant singularity",
          "Non-differentiable step boundaries"
        ],
        correctAnswer: 1,
        explanation: "The derivative of the sigmoid function σ'(z) = σ(z)(1 - σ(z)) has a maximum peak of 0.25. Multiplying many fractions < 0.25 across layers during backpropagation causes gradients to decay exponentially to near zero."
      }
    ]
  },
  {
    id: "quiz_dbms_03",
    subject: "Database Management Systems",
    title: "DBMS — Mid Examination Quiz 3",
    subtitle: "Normalization & Functional Dependencies",
    questionCount: 15,
    duration: "25 minutes",
    dueDate: "In 3 days",
    dueRaw: "Upcoming",
    status: "upcoming",
    totalPoints: 15,
    faculty: "Prof. K. S. Rao"
  },
  {
    id: "quiz_ds_05",
    subject: "Data Structures & Algorithms",
    title: "DSA — Assessment 5",
    subtitle: "Graph Algorithms & Shortest Path",
    questionCount: 20,
    duration: "30 minutes",
    dueDate: "Completed on Sept 8",
    dueRaw: "Completed",
    status: "completed",
    score: "92%",
    marksObtained: "18.4 / 20",
    faculty: "Dr. V. Ramesh"
  },
  {
    id: "quiz_os_02",
    subject: "Operating Systems",
    title: "OS — Process Scheduling Lab Quiz",
    subtitle: "Preemptive vs Non-Preemptive CPU Scheduling",
    questionCount: 15,
    duration: "20 minutes",
    dueDate: "Completed on Sept 2",
    dueRaw: "Completed",
    status: "completed",
    score: "85%",
    marksObtained: "17 / 20",
    faculty: "Dr. Ch. Lakshmi"
  },
  {
    id: "quiz_cn_01",
    subject: "Computer Networks",
    title: "CN — Subnetting & IP Addressing",
    subtitle: "CIDR notation and Network Address Translation",
    questionCount: 10,
    duration: "15 minutes",
    dueDate: "Missed on Aug 24",
    dueRaw: "Missed",
    status: "missed",
    score: "0%",
    marksObtained: "0 / 10",
    faculty: "Er. S. Verma"
  }
];

export const performanceAnalytics = {
  cgpaJourney: [
    { semester: "Semester 1", sgpa: 7.80, cgpa: 7.80, label: "Sem 1 (7.80)" },
    { semester: "Semester 2", sgpa: 8.40, cgpa: 8.10, label: "Sem 2 (8.10)" },
    { semester: "Semester 3", sgpa: 8.05, cgpa: 8.08, label: "Sem 3 (8.08)" },
    { semester: "Semester 4 (Current)", sgpa: 8.78, cgpa: 8.42, label: "Sem 4 (8.42)" }
  ],
  subjectPerformance: [
    { subject: "Machine Learning", score: 91, benchmark: 78, grade: "A+" },
    { subject: "Database Management", score: 88, benchmark: 76, grade: "A" },
    { subject: "Computer Networks", score: 84, benchmark: 74, grade: "A" },
    { subject: "Data Structures", score: 82, benchmark: 75, grade: "A" },
    { subject: "Operating Systems", score: 76, benchmark: 72, grade: "B+" }
  ],
  radarMetrics: [
    { attribute: "Theory Exams", value: 86, fullMark: 100 },
    { attribute: "Practicals & Labs", value: 92, fullMark: 100 },
    { attribute: "Assessments", value: 84, fullMark: 100 },
    { attribute: "Attendance", value: 91, fullMark: 100 },
    { attribute: "Mini Project", value: 88, fullMark: 100 },
    { attribute: "RAG AI Engagement", value: 94, fullMark: 100 }
  ],
  areasToImprove: [
    {
      subject: "Machine Learning",
      topic: "Neural Networks & Backpropagation",
      currentScore: "64%",
      recommendation: "Review Unit V activation function derivations in RAG assistant. Practice multi-layer matrix calculations."
    },
    {
      subject: "Operating Systems",
      topic: "Memory Management & Paging Tables",
      currentScore: "68%",
      recommendation: "Solve numerical problems on TLB hit ratio and 2-level page table address translations from 2024 PYQs."
    },
    {
      subject: "Database Systems",
      topic: "Normalization & Lossless Decomposition",
      currentScore: "71%",
      recommendation: "Focus on BCNF vs 3NF dependency preservation proofs. Check Dr. Rao's lecture notes."
    }
  ],
  strongAreas: [
    {
      subject: "Data Structures",
      topic: "Trees & Balanced BSTs (AVL)",
      currentScore: "94%",
      highlight: "Mastery in tree balancing rotations and runtime complexity analysis."
    },
    {
      subject: "Machine Learning",
      topic: "Linear & Logistic Regression",
      currentScore: "91%",
      highlight: "Exceptional score in gradient descent equations and classification cost functions."
    }
  ]
};

// Faculty Class Data & Student Roster
export const facultyClasses = [
  {
    id: "cls_csea",
    name: "CSE — Section A",
    subject: "Machine Learning (20CS401)",
    semester: 4,
    studentsCount: 62,
    averageMarks: "81.4%",
    attendance: "92%",
    assessmentsCount: 8,
    status: "On Schedule"
  },
  {
    id: "cls_cseb",
    name: "CSE — Section B",
    subject: "Machine Learning (20CS401)",
    semester: 4,
    studentsCount: 58,
    averageMarks: "76.2%",
    attendance: "88%",
    assessmentsCount: 7,
    status: "Review Required"
  },
  {
    id: "cls_csec",
    name: "CSE — Section C",
    subject: "Artificial Intelligence (20CS602)",
    semester: 6,
    studentsCount: 64,
    averageMarks: "78.1%",
    attendance: "82%",
    assessmentsCount: 6,
    status: "On Schedule"
  }
];

export const facultyStudentRoster = [
  {
    id: "std_01",
    name: "Rahul Kumar",
    rollNumber: "23A81A0501",
    section: "CSE-A",
    attendance: 92,
    averageMarks: 84,
    assignments: "8/8",
    assessments: "4/4",
    performance: "Excellent",
    status: "Good Standing",
    isAtRisk: false
  },
  {
    id: "std_02",
    name: "Ananya Rao",
    rollNumber: "23A81A0502",
    section: "CSE-A",
    attendance: 88,
    averageMarks: 76,
    assignments: "7/8",
    assessments: "3/4",
    performance: "Good",
    status: "Good Standing",
    isAtRisk: false
  },
  {
    id: "std_03",
    name: "Sai Teja K.",
    rollNumber: "23A81A0503",
    section: "CSE-A",
    attendance: 68,
    averageMarks: 48,
    assignments: "4/8",
    assessments: "1/4",
    performance: "At Risk",
    status: "Critical Attendance & Score",
    isAtRisk: true,
    riskReason: "Attendance < 75% and Mid marks < 50%"
  },
  {
    id: "std_04",
    name: "Bhavya Sri V.",
    rollNumber: "23A81A0504",
    section: "CSE-A",
    attendance: 95,
    averageMarks: 91,
    assignments: "8/8",
    assessments: "4/4",
    performance: "Excellent",
    status: "Top Performer",
    isAtRisk: false
  },
  {
    id: "std_05",
    name: "Dinesh Varma G.",
    rollNumber: "23A81A0505",
    section: "CSE-A",
    attendance: 71,
    averageMarks: 52,
    assignments: "5/8",
    assessments: "2/4",
    performance: "At Risk",
    status: "Attendance Shortage",
    isAtRisk: true,
    riskReason: "Attendance 71% (Below 75% condonation)"
  },
  {
    id: "std_06",
    name: "Sneha Reddy M.",
    rollNumber: "23A81A0506",
    section: "CSE-A",
    attendance: 90,
    averageMarks: 82,
    assignments: "8/8",
    assessments: "4/4",
    performance: "Good",
    status: "Good Standing",
    isAtRisk: false
  },
  {
    id: "std_07",
    name: "Manoj Kumar P.",
    rollNumber: "23A81A0507",
    section: "CSE-A",
    attendance: 64,
    averageMarks: 42,
    assignments: "3/8",
    assessments: "1/4",
    performance: "At Risk",
    status: "Severe Risk",
    isAtRisk: true,
    riskReason: "Repeated assessment failure and 64% attendance"
  },
  {
    id: "std_08",
    name: "Harika Chowdary",
    rollNumber: "23A81A0508",
    section: "CSE-A",
    attendance: 94,
    averageMarks: 86,
    assignments: "8/8",
    assessments: "4/4",
    performance: "Excellent",
    status: "Good Standing",
    isAtRisk: false
  }
];

export const facultyResourcesList = [
  {
    id: "res_01",
    title: "Support Vector Machines (SVM) Mathematical Intuition",
    subject: "Machine Learning",
    unit: "Unit III",
    fileType: "PDF Document",
    size: "4.2 MB",
    uploadedDate: "10 Sept 2025",
    visibility: "Public to Students",
    ragStatus: "Indexed (74 chunks)",
    downloads: 142
  },
  {
    id: "res_02",
    title: "Backpropagation Step-by-Step Numerical Example",
    subject: "Machine Learning",
    unit: "Unit V",
    fileType: "Jupyter / Handout",
    size: "2.1 MB",
    uploadedDate: "06 Sept 2025",
    visibility: "Public to Students",
    ragStatus: "Indexed (88 chunks)",
    downloads: 189
  },
  {
    id: "res_03",
    title: "Unit II Regression Analysis PYQ Solutions 2020-2024",
    subject: "Machine Learning",
    unit: "Unit II",
    fileType: "PDF Document",
    size: "6.8 MB",
    uploadedDate: "28 Aug 2025",
    visibility: "Public to Students",
    ragStatus: "Indexed (58 chunks)",
    downloads: 215
  },
  {
    id: "res_04",
    title: "Decision Trees & Information Gain Cheat Sheet",
    subject: "Machine Learning",
    unit: "Unit III",
    fileType: "Infographic / PDF",
    size: "1.4 MB",
    uploadedDate: "20 Aug 2025",
    visibility: "Public to Students",
    ragStatus: "Indexed (32 chunks)",
    downloads: 304
  }
];

// Admin Dashboard Data
export const adminKPIs = [
  { id: "kpi_std", label: "Students Enrolled", value: "8,492", subtext: "Active in 8 Departments", icon: "Users" },
  { id: "kpi_fac", label: "Faculty Members", value: "428", subtext: "34 Doctorates Joined", icon: "Award" },
  { id: "kpi_sub", label: "Active Subjects", value: "164", subtext: "R20 & R23 Regulations", icon: "BookOpen" },
  { id: "kpi_res", label: "Academic Resources", value: "12,842", subtext: "Notes, PDFs & Slides", icon: "FileText" },
  { id: "kpi_rag", label: "RAG Documents", value: "4,284", subtext: "100% Vectorized in DB", icon: "Cpu" }
];

export const adminSystemHealth = {
  vectorDatabase: "Active & Healthy (Qdrant Cloud)",
  vectorLatency: "18ms",
  embeddingQueue: "0 Pending",
  ragThroughput: "1,420 queries / hr",
  storageUsed: "1.42 GB / 10.0 GB",
  indexedDocs: 4240,
  processingDocs: 32,
  failedDocs: 12
};

export const adminRagDocuments = [
  {
    id: "rag_doc_01",
    document: "GMRIT_R20_CSE_ML_Unit3.pdf",
    category: "Syllabus & Course Handout",
    subject: "Machine Learning",
    department: "CSE",
    chunks: 142,
    embeddingModel: "text-embedding-3-small",
    status: "Indexed",
    statusType: "success",
    lastUpdated: "Today, 11:20 AM"
  },
  {
    id: "rag_doc_02",
    document: "GMRIT_DBMS_SEE_2025_AnswerKey.pdf",
    category: "PYQ & Model Solutions",
    subject: "Database Management",
    department: "CSE",
    chunks: 84,
    embeddingModel: "text-embedding-3-small",
    status: "Indexed",
    statusType: "success",
    lastUpdated: "Yesterday, 04:15 PM"
  },
  {
    id: "rag_doc_03",
    document: "DSA_AVL_Trees_Prof_Ramesh_Handout.pdf",
    category: "Faculty Lecture Notes",
    subject: "Data Structures",
    department: "CSE",
    chunks: 64,
    embeddingModel: "text-embedding-3-small",
    status: "Indexed",
    statusType: "success",
    lastUpdated: "08 Sept 2025"
  },
  {
    id: "rag_doc_04",
    document: "Operating_Systems_VirtualMemory_Paging.pdf",
    category: "Syllabus Material",
    subject: "Operating Systems",
    department: "CSE",
    chunks: 92,
    embeddingModel: "text-embedding-3-small",
    status: "Processing",
    statusType: "warning",
    lastUpdated: "Just now"
  },
  {
    id: "rag_doc_05",
    document: "ComputerNetworks_SocketProgramming_Lab.pdf",
    category: "Lab Manual",
    subject: "Computer Networks",
    department: "CSE",
    chunks: 0,
    embeddingModel: "text-embedding-3-small",
    status: "Failed (Corrupt PDF header)",
    statusType: "danger",
    lastUpdated: "05 Sept 2025"
  }
];

export const adminAllUsersList = [
  { id: "usr_101", name: "Rahul Kumar", userId: "23A81A0501", role: "Student", department: "CSE", year: "II Year", semester: "IV Sem", status: "Active", lastLogin: "10 mins ago" },
  { id: "usr_102", name: "Ananya Rao", userId: "23A81A0502", role: "Student", department: "CSE", year: "II Year", semester: "IV Sem", status: "Active", lastLogin: "1 hour ago" },
  { id: "usr_103", name: "Dr. Priya Sharma", userId: "GMR-CSE-1042", role: "Faculty", department: "CSE", year: "Faculty", semester: "All", status: "Active", lastLogin: "Active Now" },
  { id: "usr_104", name: "Dr. V. Ramesh", userId: "GMR-CSE-1018", role: "Faculty", department: "CSE", year: "Faculty", semester: "All", status: "Active", lastLogin: "Yesterday" },
  { id: "usr_105", name: "Prof. K. S. Rao", userId: "GMR-CSE-1025", role: "Faculty", department: "CSE", year: "Faculty", semester: "All", status: "Active", lastLogin: "3 days ago" },
  { id: "usr_106", name: "Er. M. V. Subrahmanyam", userId: "GMR-ADM-001", role: "Admin", department: "Admin IT", year: "Staff", semester: "All", status: "Active", lastLogin: "Active Now" },
  { id: "usr_107", name: "Sai Teja K.", userId: "23A81A0503", role: "Student", department: "CSE", year: "II Year", semester: "IV Sem", status: "Warning", lastLogin: "4 days ago" },
  { id: "usr_108", name: "Bhavya Sri V.", userId: "23A81A0504", role: "Student", department: "CSE", year: "II Year", semester: "IV Sem", status: "Active", lastLogin: "2 hours ago" }
];

export const notificationsList = {
  student: [
    { id: "n_std_1", title: "Machine Learning Quiz 4 Scheduled", desc: "Duration: 30 mins. Due tomorrow at 11:59 PM.", time: "10m ago", read: false, type: "assessment" },
    { id: "n_std_2", title: "New Unit V RAG Material Indexed", desc: "Dr. Priya Sharma uploaded Deep Learning & Backpropagation notes.", time: "2h ago", read: false, type: "rag" },
    { id: "n_std_3", title: "Monthly Attendance Report Published", desc: "Current attendance: 91% (Good standing maintained).", time: "1d ago", read: true, type: "system" }
  ],
  faculty: [
    { id: "n_fac_1", title: "At-Risk Alert: 8 Students Below Threshold", desc: "CSE-A & CSE-B have 8 students with attendance <75% or scores <50%.", time: "15m ago", read: false, type: "warning" },
    { id: "n_fac_2", title: "Quiz 4 Submission Window Closes Tomorrow", desc: "58 of 62 students have submitted responses so far.", time: "3h ago", read: false, type: "assessment" },
    { id: "n_fac_3", title: "RAG Document Indexing Completed", desc: "Support Vector Machines Handout indexed with 74 vectors.", time: "1d ago", read: true, type: "rag" }
  ],
  admin: [
    { id: "n_adm_1", title: "RAG Ingestion Error Detected", desc: "1 document failed to parse chunk vectors (Invalid PDF header).", time: "5m ago", read: false, type: "danger" },
    { id: "n_adm_2", title: "Batch Student Provisioning Completed", desc: "120 accounts provisioned for B.Tech lateral entry cohort.", time: "1h ago", read: false, type: "system" },
    { id: "n_adm_3", title: "Vector DB Storage Alert", desc: "Storage usage at 1.42 GB of 10.0 GB quota.", time: "4h ago", read: true, type: "warning" }
  ]
};
