// GMR CRM - CSE (Artificial Intelligence & Machine Learning) Academic Syllabus Data (AR23 Regulation)
// Authoritative source: B.Tech AIML Syllabus AR23 (GMRIT Autonomous)
// Maintained separately from React UI components for modularity and extensibility.

export const cseAIMLSyllabus = {
  branchCode: 'CSE-AIML',
  branchName: 'CSE – Artificial Intelligence & Machine Learning',
  regulation: 'AR23',
  totalSemesters: 8,
  careerPaths: [
    {
      id: 'mlops',
      name: 'Machine Learning Operations (ML Ops)',
      shortName: 'ML Ops',
      description: 'Applied machine learning engineering, computer vision, intelligence systems, and conversational AI.'
    },
    {
      id: 'fsd',
      name: 'Full Stack Developer',
      shortName: 'Full Stack Dev',
      description: 'End-to-end full stack web architecture, server-side runtimes, web frameworks, and application databases.'
    },
    {
      id: 'cloud',
      name: 'Cloud Computing',
      shortName: 'Cloud Computing',
      description: 'Cloud systems architecture, Amazon Web Services (AWS), and enterprise cloud security.'
    }
  ],
  semesters: [
    {
      semester: 1,
      title: '1st Semester',
      description: 'Foundations of Computer Programming & Computational Problem Solving',
      subjects: [
        {
          code: '23BEX03',
          name: 'Introduction to Programming',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Fundamental concepts of programming, algorithms, control structures, functions, arrays, and structured problem solving.'
        },
        {
          code: '23BEX07',
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
      description: 'Python Problem Solving, Artificial Intelligence, Algorithms & Mathematical Foundations',
      subjects: [
        {
          code: '23CS301',
          name: 'Problem Solving using Python',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'Advanced Python programming, data structures, functional paradigms, and algorithmic problem solving.'
        },
        {
          code: '23ML302',
          name: 'Artificial Intelligence',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Heuristic search, knowledge representation, reasoning under uncertainty, and intelligent agent systems.'
        },
        {
          code: '23CS303',
          name: 'Design and Analysis of Algorithms',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Asymptotic complexity analysis, divide-and-conquer, greedy algorithms, dynamic programming, and graph algorithms.'
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
          code: '23DS305',
          name: 'Mathematical Foundation for Data Science',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Linear algebra, matrix factorizations, vector spaces, multivariate calculus, and statistical optimization.'
        },
        {
          code: '23CS306',
          name: 'Object Oriented Programming with JAVA',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Java classes, inheritance, polymorphism, interfaces, exception handling, and concurrent multithreading.'
        },
        {
          code: '23CS307',
          name: 'Design and Analysis of Algorithms Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Practical programming and verification of algorithmic design paradigms and computational complexities.'
        },
        {
          code: '23CS308',
          name: 'JAVA Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Hands-on implementation of object-oriented Java solutions, streams, and collection frameworks.'
        }
      ]
    },
    {
      semester: 4,
      title: '4th Semester',
      description: 'Database Systems, Operating Systems, Machine Learning Foundations & Python Statistics',
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
          code: '23MA404',
          name: 'Probability and Statistics using Python',
          credits: 4,
          type: 'Core',
          category: 'theory',
          description: 'Probability distributions, hypothesis testing, random variables, statistical estimation, and regression analysis using Python.'
        },
        {
          code: '23ML405',
          name: 'Foundations of Machine Learning',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Supervised and unsupervised learning, regression, classification, decision trees, clustering, and model validation.'
        },
        {
          code: '23IT308',
          name: 'Database Management Systems Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Relational database queries in SQL, transaction management, constraints, triggers, and stored procedures.'
        },
        {
          code: '23ML407',
          name: 'Foundations of Machine Learning Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Hands-on implementation of machine learning models and data preprocessing pipelines in Python.'
        }
      ]
    },
    {
      semester: 5,
      title: '5th Semester',
      description: 'Neural Networks, Web Technologies, Data Analytics & Professional Elective I',
      subjects: [
        {
          code: '23IT405',
          name: 'Web Technologies',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'Full stack web development, responsive user interface architecture, client-server models, and asynchronous web APIs.'
        },
        {
          code: '23ML502',
          name: 'Neural Networks',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Biological and artificial neurons, perceptron models, feedforward architectures, backpropagation, and optimization algorithms.'
        },
        {
          code: '23DS503',
          name: 'Data Analytics & Visualization Techniques',
          credits: 4,
          type: 'Core',
          category: 'integrated',
          description: 'Exploratory data analysis, statistical visualization, dashboarding, multi-dimensional reporting, and analytical charting.'
        },
        {
          code: '23ML504',
          name: 'Computer Networks',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Layered networking architectures, routing algorithms, transport protocols (TCP/UDP), and network security concepts.'
        },
        {
          code: '23ML507',
          name: 'Neural Networks Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Practical implementation and training of neural network architectures, activation functions, and gradient descent.'
        }
      ],
      careerPathSubjects: [
        {
          careerPathId: 'mlops',
          careerPathName: 'Machine Learning Operations (ML Ops)',
          code: '23MLC11',
          name: 'Computer Vision & Pattern Recognition',
          credits: 3,
          type: 'Career Path Elective / PE I',
          category: 'career_path',
          description: 'Image processing fundamentals, feature extraction, edge detection, pattern recognition, and visual object detection.'
        },
        {
          careerPathId: 'fsd',
          careerPathName: 'Full Stack Developer',
          code: '23CSC21',
          name: 'Backend Programming Languages',
          credits: 3,
          type: 'Career Path Elective / PE I',
          category: 'career_path',
          description: 'Server-side runtime environments, RESTful API design, authentication middleware, and asynchronous microservices.'
        },
        {
          careerPathId: 'cloud',
          careerPathName: 'Cloud Computing',
          code: '23MLC31',
          name: 'Fundamentals of Cloud Computing',
          credits: 3,
          type: 'Career Path Elective / PE I',
          category: 'career_path',
          description: 'Cloud deployment models (IaaS, PaaS, SaaS), virtualization concepts, hypervisors, and cloud infrastructure architecture.'
        }
      ]
    },
    {
      semester: 6,
      title: '6th Semester',
      description: 'Deep Learning, Automata Theory, Software Engineering & Professional Elective III',
      subjects: [
        {
          code: '23ML601',
          name: 'Deep Learning Techniques',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Convolutional neural networks (CNNs), recurrent neural networks (RNNs/LSTMs), transformers, and attention mechanisms.'
        },
        {
          code: '23ML602',
          name: 'Automata Theory and Language Processors',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Finite automata, context-free grammars, pushdown automata, Turing machines, parsing techniques, and syntax analysis.'
        },
        {
          code: '23CS603',
          name: 'Software Engineering',
          credits: 3,
          type: 'Core',
          category: 'theory',
          description: 'Software lifecycle models, Agile methodologies, requirement engineering, architectural design, verification, and testing.'
        },
        {
          code: '23ML606',
          name: 'Deep Learning Techniques Lab',
          credits: 1.5,
          type: 'Technical Lab',
          category: 'lab',
          description: 'Hands-on deep learning model development, transfer learning, computer vision and sequence models using TensorFlow/PyTorch.'
        }
      ],
      careerPathSubjects: [
        {
          careerPathId: 'mlops',
          careerPathName: 'Machine Learning Operations (ML Ops)',
          code: '23MLC12',
          name: 'Machine Learning for Business Intelligence',
          credits: 4,
          type: 'Career Path Elective / PE III',
          category: 'career_path',
          description: 'Business analytics workflows, predictive modeling for enterprise decisions, churn analysis, and automated BI reporting.'
        },
        {
          careerPathId: 'fsd',
          careerPathName: 'Full Stack Developer',
          code: '23CSC22',
          name: 'Web Application Frameworks',
          credits: 4,
          type: 'Career Path Elective / PE III',
          category: 'career_path',
          description: 'Enterprise web application frameworks, state management architectures, component lifecycles, and production deployment.'
        },
        {
          careerPathId: 'cloud',
          careerPathName: 'Cloud Computing',
          code: '23MLC32',
          name: 'Cloud Services using AWS',
          credits: 4,
          type: 'Career Path Elective / PE III',
          category: 'career_path',
          description: 'Amazon Web Services (AWS) core infrastructure: EC2, S3, RDS, Lambda serverless computing, VPC networking, and IAM security.'
        }
      ]
    },
    {
      semester: 7,
      title: '7th Semester',
      description: 'FSI Track Prerequisite or Career Path Professional Elective V',
      subjects: [],
      careerPathSubjects: [],
      fsiConfig: {
        fsiSubject: {
          code: '23CS019',
          name: 'Fundamentals of DevOps',
          credits: 3,
          type: 'Core / FSI Requirement',
          category: 'fsi_subject',
          description: 'Continuous integration and continuous deployment (CI/CD) pipelines, containerization with Docker, Kubernetes orchestration, and automated infrastructure as code.'
        },
        nonFsiCareerPathSubjects: [
          {
            careerPathId: 'mlops',
            careerPathName: 'Machine Learning Operations (ML Ops)',
            code: '23MLC13',
            name: 'Conversational AI',
            credits: 3,
            type: 'Professional Elective V',
            category: 'career_path',
            description: 'Natural language dialogue systems, chatbots, intent classification, entity extraction, prompt engineering, and LLM agent architectures.'
          },
          {
            careerPathId: 'fsd',
            careerPathName: 'Full Stack Developer',
            code: '23CSC23',
            name: 'Web Application Databases',
            credits: 3,
            type: 'Professional Elective V',
            category: 'career_path',
            description: 'NoSQL document databases, distributed caching (Redis), schema migrations, query optimization, and database clustering.'
          },
          {
            careerPathId: 'cloud',
            careerPathName: 'Cloud Computing',
            code: '23MLC33',
            name: 'Cloud Security Essentials',
            credits: 3,
            type: 'Professional Elective V',
            category: 'career_path',
            description: 'Cloud vulnerability assessment, identity federation, cryptographic key management, security monitoring, and regulatory compliance.'
          }
        ]
      }
    },
    {
      semester: 8,
      title: '8th Semester',
      description: 'Capstone Industry Experience & Professional Elective VIII',
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

export default cseAIMLSyllabus;
