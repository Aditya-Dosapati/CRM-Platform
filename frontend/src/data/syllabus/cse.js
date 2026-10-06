// GMR CRM - Computer Science and Engineering (CSE) Academic Syllabus Data (AR23 Regulation)
// Maintained separately from React UI components for clean architecture and modularity.

export const cseSyllabus = {
  branchCode: 'CSE',
  branchName: 'Computer Science and Engineering',
  regulation: 'AR23',
  totalSemesters: 8,
  careerPaths: [
    { id: 'aiml', name: 'AI & ML', description: 'Artificial Intelligence & Machine Learning Track' },
    { id: 'fsd', name: 'Full Stack Developer', description: 'Full Stack Web & Database Engineering Track' },
    { id: 'cloud', name: 'Cloud Computing', description: 'Cloud Infrastructure & AWS Services Track' }
  ],
  semesters: [
    {
      semester: 1,
      title: '1st Semester',
      description: 'Foundations of Computer Programming & Computational Problem Solving',
      subjects: [
        {
          code: '23CS101',
          name: 'Introduction to Programming',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Fundamental concepts of programming, algorithms, control flow, functions, and structured problem solving.'
        },
        {
          code: '23CS102',
          name: 'Computer Programming Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Hands-on laboratory sessions for implementation of basic algorithms, structured programming, and debugging.'
        }
      ]
    },
    {
      semester: 2,
      title: '2nd Semester',
      description: 'Core Data Structures & Algorithmic Problem Solving',
      subjects: [
        {
          code: '23CS201',
          name: 'Data Structures',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Linear data structures, linked lists, stacks, queues, trees, searching and sorting techniques.'
        },
        {
          code: '23CS202',
          name: 'Data Structures Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Practical programming implementations of abstract data types, linked structures, and sorting algorithms.'
        }
      ]
    },
    {
      semester: 3,
      title: '3rd Semester',
      description: 'Discrete Mathematical Structures, Python, Algorithms & Hardware Foundations',
      subjects: [
        {
          code: '23CS301',
          name: 'Problem Solving using Python',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'Advanced Python idioms, functional abstractions, object-oriented concepts, and algorithmic implementations.'
        },
        {
          code: '23CS303',
          name: 'Design and Analysis of Algorithms',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Asymptotic complexity analysis, divide-and-conquer, greedy techniques, dynamic programming, and graph algorithms.'
        },
        {
          code: '23CS304',
          name: 'Digital Logic Design',
          credits: 4,
          type: 'Core',
          category: 'theory',
          description: 'Boolean algebra, combinational and sequential circuit design, flip-flops, registers, and digital counters.'
        },
        {
          code: '23CS305',
          name: 'Discrete Mathematical Structures',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Propositional logic, set theory, relations, functions, algebraic structures, combinatorics, and graph theory.'
        },
        {
          code: '23CS306',
          name: 'Object Oriented Programming with JAVA',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Java classes, inheritance, polymorphism, abstract classes, interfaces, exception handling, and multithreading.'
        }
      ]
    },
    {
      semester: 4,
      title: '4th Semester',
      description: 'Systems Software, Database Architecture & Web Technologies',
      subjects: [
        {
          code: '23IT304',
          name: 'Database Management Systems',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Relational database schema design, normalization, relational algebra, SQL querying, transactions, and indexing.'
        },
        {
          code: '23IT403',
          name: 'Operating Systems',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Process lifecycle management, CPU scheduling, concurrency, synchronization, deadlocks, and virtual memory.'
        },
        {
          code: '23CS403',
          name: 'Computer Organization and Architecture',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Instruction set architecture, processor datapath, pipelining, memory hierarchy, cache coherence, and I/O systems.'
        },
        {
          code: '23CS405',
          name: 'Web Coding and Development',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Modern front-end web development, responsive user interface architecture, DOM manipulation, and asynchronous APIs.'
        }
      ]
    },
    {
      semester: 5,
      title: '5th Semester',
      description: 'Intelligent Systems, Computer Networks & Specialization Career Paths',
      subjects: [
        {
          code: '23EC502',
          name: 'Microprocessors and Microcontrollers (Integrated)',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'Architecture of 8086 microprocessors, assembly programming, 8051 microcontroller architecture, and peripheral interfacing.'
        },
        {
          code: '23CS502',
          name: 'Artificial Intelligence and Machine Learning',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Heuristic state-space search, knowledge representation, probabilistic inference, supervised and unsupervised learning.'
        },
        {
          code: '23CS503',
          name: 'Computer Networks (Integrated)',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'OSI and TCP/IP layered architectures, routing algorithms, transport layer protocols (TCP/UDP), and socket network programming.'
        },
        {
          code: '23CS504',
          name: 'Theory of Computation',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Finite automata, regular expressions, context-free grammars, pushdown automata, Turing machines, and computability theory.'
        }
      ],
      careerPathSubjects: [
        {
          careerPathId: 'aiml',
          careerPathName: 'AI & ML',
          code: '23CSC11',
          name: 'Artificial Neural Networks',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Biological inspiration, perceptrons, multi-layer feedforward networks, backpropagation learning, and optimization.'
        },
        {
          careerPathId: 'fsd',
          careerPathName: 'Full Stack Developer',
          code: '23CSC21',
          name: 'Backend Programming Languages',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Server-side runtime environments, RESTful API design, authentication middleware, and asynchronous microservices.'
        },
        {
          careerPathId: 'cloud',
          careerPathName: 'Cloud Computing',
          code: '23MLC31',
          name: 'Fundamentals of Cloud Computing',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Cloud deployment models (IaaS, PaaS, SaaS), virtualization concepts, hypervisors, and cloud architecture fundamentals.'
        }
      ],
      electiveGroups: [
        {
          groupName: 'Professional Elective I',
          rule: 'Choose one of the following electives:',
          options: [
            {
              code: '23CS004',
              name: 'Principles of Programming Languages',
              credits: 3,
              type: 'Professional Elective',
              description: 'Syntax, semantics, type systems, functional, logic, and object-oriented programming paradigms.'
            },
            {
              code: '23CS005',
              name: 'Mobile Computing',
              credits: 3,
              type: 'Professional Elective',
              description: 'Cellular wireless systems, mobile IP, mobile transport layer, and mobile app architecture.'
            },
            {
              code: '23CS006',
              name: 'Distributed Operating Systems',
              credits: 3,
              type: 'Professional Elective',
              description: 'Distributed synchronization, logical clocks, mutual exclusion, distributed file systems, and fault tolerance.'
            }
          ]
        }
      ]
    },
    {
      semester: 6,
      title: '6th Semester',
      description: 'Compiler Engineering, Network Security & Deep Learning Specialization',
      subjects: [
        {
          code: '23CS601',
          name: 'Compiler Design',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Lexical analysis, syntax analysis, parsing techniques (LL/LR), syntax-directed translation, intermediate code generation, and optimization.'
        },
        {
          code: '23CS602',
          name: 'Cryptography and Network Security',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Symmetric encryption (AES/DES), public key cryptography (RSA/ECC), cryptographic hash functions, digital signatures, and IPsec.'
        },
        {
          code: '23CS603',
          name: 'Software Engineering',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Software lifecycle models, Agile methodologies, requirement engineering, architectural design, verification, and testing.'
        }
      ],
      careerPathSubjects: [
        {
          careerPathId: 'aiml',
          careerPathName: 'AI & ML',
          code: '23CSC12',
          name: 'Deep Learning',
          credits: 4,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Convolutional neural networks (CNNs), recurrent neural networks (RNNs/LSTMs), transformers, attention mechanisms, and deep architectures.'
        },
        {
          careerPathId: 'fsd',
          careerPathName: 'Full Stack Developer',
          code: '23CSC22',
          name: 'Web Application Framework',
          credits: 4,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Enterprise web application frameworks, state management architectures, component lifecycles, and production deployment.'
        },
        {
          careerPathId: 'cloud',
          careerPathName: 'Cloud Computing',
          code: '23MLC32',
          name: 'Cloud Services using AWS',
          credits: 4,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Amazon Web Services (AWS) core infrastructure: EC2, S3, RDS, Lambda serverless computing, VPC networking, and IAM security.'
        }
      ]
    },
    {
      semester: 7,
      title: '7th Semester',
      description: 'Advanced Cloud/Language Engineering & FSI Track Specialization',
      subjects: [],
      careerPathSubjects: [
        {
          careerPathId: 'aiml',
          careerPathName: 'AI & ML',
          code: '23CSC13',
          name: 'Natural Language Processing',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Statistical language models, tokenization, POS tagging, syntactic parsing, semantic analysis, and transformer-based NLP.'
        },
        {
          careerPathId: 'fsd',
          careerPathName: 'Full Stack Developer',
          code: '23CSC23',
          name: 'Web Application Databases',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'NoSQL document databases, distributed caching (Redis), schema migrations, query optimization, and database clustering.'
        },
        {
          careerPathId: 'cloud',
          careerPathName: 'Cloud Computing',
          code: '23MLC33',
          name: 'Cloud Security Essentials',
          credits: 3,
          type: 'Career Path Elective',
          category: 'career_path',
          description: 'Cloud vulnerability assessment, identity federation, cryptographic key management, security monitoring, and regulatory compliance.'
        }
      ],
      fsiConfig: {
        fsiSubject: {
          code: '23CS019',
          name: 'Fundamentals of DevOps',
          credits: 3,
          type: 'Core / FSI Requirement',
          category: 'fsi_subject',
          description: 'Continuous integration and continuous deployment (CI/CD) pipelines, containerization with Docker, Kubernetes orchestration, and automated infrastructure as code.'
        },
        nonFsiElectiveGroup: {
          groupName: 'Professional Elective V',
          rule: 'Offered for Non-FSI Track students:',
          options: [
            {
              code: '23IT010',
              name: 'Social Network Analysis',
              credits: 3,
              type: 'Professional Elective',
              description: 'Network graph models, centrality measures, community detection algorithms, link prediction, and information diffusion.'
            },
            {
              code: '23CS011',
              name: 'Optimization Techniques',
              credits: 3,
              type: 'Professional Elective',
              description: 'Linear programming, simplex method, duality, non-linear programming, integer programming, and dynamic optimization.'
            },
            {
              code: '23CS012',
              name: 'Wireless Adhoc Networks',
              credits: 3,
              type: 'Professional Elective',
              description: 'Ad-hoc routing protocols (AODV, DSR), MAC protocols, wireless sensor network architectures, and security challenges.'
            }
          ]
        }
      }
    },
    {
      semester: 8,
      title: '8th Semester',
      description: 'Capstone Industry Experience & Advanced Professional Electives',
      subjects: [
        {
          code: '23FIX01',
          name: 'Full Semester Internship (FSI)',
          credits: 10,
          type: 'Internship',
          category: 'internship',
          description: 'Full semester immersive industrial or research internship in verified technology organizations and research institutions.'
        }
      ],
      electiveGroups: [
        {
          groupName: 'Professional Elective VIII',
          rule: 'Choose one of the following electives:',
          options: [
            {
              code: '23CS017',
              name: 'Fundamentals of Social Network Analysis',
              credits: 3,
              type: 'Professional Elective',
              description: 'Graph representation of social ties, centrality metrics, influence maximization, and semantic web graphs.'
            },
            {
              code: '23CS018',
              name: 'Information Retrieval Systems',
              credits: 3,
              type: 'Professional Elective',
              description: 'Inverted indexing, vector space models, probabilistic retrieval, web crawling, ranking algorithms, and search evaluation.'
            },
            {
              code: '23CS019',
              name: 'Fundamentals of DevOps',
              credits: 3,
              type: 'Professional Elective',
              description: 'CI/CD pipeline automation, automated testing, containerized deployments, monitoring, and cloud infrastructure management.'
            }
          ]
        }
      ]
    }
  ]
};

export default cseSyllabus;
