// SkillPilot AI — reference data (demo mode)
// In production this ships from FastAPI + MySQL, generated/curated with the Gemini API.
// Here it's static so the whole product works with zero backend.

const CAREERS = [
  {
    id: "cloud-engineer",
    name: "Cloud Engineer",
    icon: "cloud",
    difficulty: "Intermediate",
    description: "Design, deploy and operate infrastructure on public cloud platforms — provisioning, networking, containers and reliability.",
    technologies: ["AWS", "Docker", "Kubernetes", "Terraform", "Linux"],
    skills: [
      { id: "linux", name: "Linux", weight: 0.9, deps: [] },
      { id: "networking", name: "Networking", weight: 0.85, deps: ["linux"] },
      { id: "git", name: "Git", weight: 0.6, deps: [] },
      { id: "aws", name: "AWS", weight: 1.0, deps: ["linux", "networking"] },
      { id: "docker", name: "Docker", weight: 0.95, deps: ["linux"] },
      { id: "kubernetes", name: "Kubernetes", weight: 0.9, deps: ["docker", "networking"] },
      { id: "terraform", name: "Terraform", weight: 0.8, deps: ["aws"] },
      { id: "cicd", name: "CI/CD", weight: 0.75, deps: ["git", "docker"] },
    ],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    icon: "settings",
    difficulty: "Advanced",
    description: "Bridge development and operations — automate delivery pipelines, manage infrastructure as code, and keep systems observable.",
    technologies: ["Docker", "Kubernetes", "CI/CD", "AWS", "Monitoring"],
    skills: [
      { id: "linux", name: "Linux", weight: 0.9, deps: [] },
      { id: "git", name: "Git", weight: 0.7, deps: [] },
      { id: "docker", name: "Docker", weight: 1.0, deps: ["linux"] },
      { id: "cicd", name: "CI/CD", weight: 0.95, deps: ["git", "docker"] },
      { id: "kubernetes", name: "Kubernetes", weight: 0.95, deps: ["docker"] },
      { id: "aws", name: "AWS", weight: 0.85, deps: ["linux"] },
      { id: "terraform", name: "Terraform", weight: 0.8, deps: ["aws"] },
      { id: "monitoring", name: "Monitoring", weight: 0.75, deps: ["kubernetes"] },
    ],
  },
  {
    id: "software-developer",
    name: "Software Developer",
    icon: "code",
    difficulty: "Beginner–Intermediate",
    description: "Build reliable applications end to end — data structures, APIs, testing and clean software design.",
    technologies: ["Python", "JavaScript", "SQL", "Git", "REST APIs"],
    skills: [
      { id: "dsa", name: "Data Structures & Algorithms", weight: 0.9, deps: [] },
      { id: "python", name: "Python", weight: 0.85, deps: [] },
      { id: "javascript", name: "JavaScript", weight: 0.75, deps: [] },
      { id: "git", name: "Git", weight: 0.7, deps: [] },
      { id: "sql", name: "SQL", weight: 0.75, deps: [] },
      { id: "rest", name: "REST APIs", weight: 0.85, deps: ["python"] },
      { id: "testing", name: "Testing", weight: 0.65, deps: ["python"] },
      { id: "systemdesign", name: "System Design", weight: 0.7, deps: ["dsa", "rest"] },
    ],
  },
  {
    id: "fullstack-developer",
    name: "Full Stack Developer",
    icon: "layers",
    difficulty: "Intermediate",
    description: "Own the whole product surface — responsive frontends, backend services, databases and deployment.",
    technologies: ["React", "Node.js", "SQL", "REST APIs", "Docker"],
    skills: [
      { id: "javascript", name: "JavaScript", weight: 0.85, deps: [] },
      { id: "react", name: "React", weight: 0.9, deps: ["javascript"] },
      { id: "nodejs", name: "Node.js", weight: 0.85, deps: ["javascript"] },
      { id: "sql", name: "SQL", weight: 0.75, deps: [] },
      { id: "rest", name: "REST APIs", weight: 0.85, deps: ["nodejs"] },
      { id: "git", name: "Git", weight: 0.6, deps: [] },
      { id: "docker", name: "Docker", weight: 0.6, deps: [] },
      { id: "testing", name: "Testing", weight: 0.6, deps: ["react"] },
    ],
  },
  {
    id: "aiml-engineer",
    name: "AI/ML Engineer",
    icon: "brain-circuit",
    difficulty: "Advanced",
    description: "Design, train and ship machine learning systems — from data pipelines to model serving.",
    technologies: ["Python", "PyTorch", "SQL", "Statistics", "MLOps"],
    skills: [
      { id: "python", name: "Python", weight: 0.9, deps: [] },
      { id: "statistics", name: "Statistics", weight: 0.85, deps: [] },
      { id: "ml", name: "Machine Learning", weight: 1.0, deps: ["python", "statistics"] },
      { id: "dl", name: "Deep Learning", weight: 0.9, deps: ["ml"] },
      { id: "sql", name: "SQL", weight: 0.65, deps: [] },
      { id: "mlops", name: "MLOps", weight: 0.75, deps: ["dl", "docker"] },
      { id: "docker", name: "Docker", weight: 0.6, deps: [] },
      { id: "dataeng", name: "Data Engineering", weight: 0.7, deps: ["sql", "python"] },
    ],
  },
  {
    id: "cybersecurity-engineer",
    name: "Cybersecurity Engineer",
    icon: "shield",
    difficulty: "Advanced",
    description: "Protect systems and data — threat modeling, network defense, secure architecture and incident response.",
    technologies: ["Linux", "Networking", "Security Tools", "Cloud Security"],
    skills: [
      { id: "linux", name: "Linux", weight: 0.9, deps: [] },
      { id: "networking", name: "Networking", weight: 0.95, deps: ["linux"] },
      { id: "security-fundamentals", name: "Security Fundamentals", weight: 1.0, deps: ["networking"] },
      { id: "pentesting", name: "Penetration Testing", weight: 0.85, deps: ["security-fundamentals"] },
      { id: "cryptography", name: "Cryptography", weight: 0.75, deps: [] },
      { id: "cloud-security", name: "Cloud Security", weight: 0.8, deps: ["security-fundamentals", "aws"] },
      { id: "aws", name: "AWS", weight: 0.6, deps: [] },
      { id: "incident-response", name: "Incident Response", weight: 0.7, deps: ["security-fundamentals"] },
    ],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    icon: "bar-chart-3",
    difficulty: "Beginner–Intermediate",
    description: "Turn raw data into decisions — querying, cleaning, visualizing and communicating findings.",
    technologies: ["SQL", "Excel", "Python", "Tableau/PowerBI"],
    skills: [
      { id: "sql", name: "SQL", weight: 1.0, deps: [] },
      { id: "excel", name: "Excel", weight: 0.7, deps: [] },
      { id: "python", name: "Python (Pandas)", weight: 0.85, deps: [] },
      { id: "statistics", name: "Statistics", weight: 0.8, deps: [] },
      { id: "visualization", name: "Data Visualization", weight: 0.85, deps: ["python"] },
      { id: "bi-tools", name: "BI Tools", weight: 0.75, deps: ["visualization"] },
      { id: "storytelling", name: "Data Storytelling", weight: 0.65, deps: ["visualization"] },
    ],
  },
];

// Resources shown per skill in the roadmap (demo curation)
const SKILL_RESOURCES = {
  linux: ["Linux Journey (free)", "OverTheWire: Bandit"],
  networking: ["Cisco Networking Basics", "PracticalNetworking.net"],
  aws: ["AWS Cloud Practitioner Essentials", "AWS Skill Builder labs"],
  docker: ["Docker official 'Get Started' guide", "Build & ship a container from scratch"],
  kubernetes: ["Kubernetes the Hard Way (concepts only)", "KillerCoda K8s playgrounds"],
  terraform: ["HashiCorp Terraform tutorials", "Provision an EC2 instance via Terraform"],
  cicd: ["GitHub Actions docs", "Build a CI pipeline for a sample repo"],
  git: ["Git branching interactive tutorial", "Contribute to an open-source repo"],
  python: ["Python for Everybody", "Automate the Boring Stuff"],
  dsa: ["NeetCode 150", "Grokking Algorithms"],
  sql: ["Mode SQL tutorial", "SQLZoo practice sets"],
  rest: ["REST API design best practices", "Build a FastAPI CRUD service"],
  testing: ["Pytest docs", "Write tests for an existing project"],
  systemdesign: ["System Design Primer", "Design a URL shortener"],
  javascript: ["JavaScript.info", "Eloquent JavaScript"],
  react: ["Official React docs (beta)", "Build and deploy a small React app"],
  nodejs: ["Node.js official guides", "Build a REST API with Express"],
  ml: ["Andrew Ng's Machine Learning Specialization", "Kaggle Titanic + tabular comps"],
  dl: ["fast.ai Practical Deep Learning", "PyTorch official tutorials"],
  statistics: ["Seeing Theory (visual stats)", "Khan Academy Statistics"],
  mlops: ["Made With ML: MLOps", "Deploy a model with FastAPI + Docker"],
  dataeng: ["Data Engineering Zoomcamp", "Build an ETL pipeline"],
  "security-fundamentals": ["TryHackMe: Pre-Security path", "OWASP Top 10"],
  pentesting: ["TryHackMe: Offensive Pentesting", "HackTheBox starter labs"],
  cryptography: ["Cryptography I (Stanford, audit)", "CryptoHack"],
  "cloud-security": ["AWS Security Fundamentals", "CIS AWS Benchmark walkthrough"],
  "incident-response": ["NIST Incident Handling Guide", "Blue Team labs"],
  excel: ["ExcelJet functions reference", "Build a dashboard from raw data"],
  visualization: ["Storytelling with Data (book)", "Rebuild 3 charts from FT/NYT"],
  "bi-tools": ["Tableau Public tutorials", "Power BI Guided Learning"],
  storytelling: ["Storytelling with Data (book)", "Present a 1-page insight memo"],
};

// Proof-of-skill project templates keyed by 2-3 skill combos
const PROJECT_TEMPLATES = [
  {
    id: "clouddeploy",
    name: "CloudDeploy",
    skills: ["docker", "aws", "cicd"],
    description: "Build and deploy a containerized FastAPI application using Docker, AWS EC2 and GitHub Actions.",
    deliverable: "A public GitHub repo + a working deployment URL + a short README explaining the architecture.",
  },
  {
    id: "k8s-scaler",
    name: "MicroScale",
    skills: ["kubernetes", "docker"],
    description: "Containerize a small multi-service app and orchestrate it on Kubernetes with health checks and autoscaling.",
    deliverable: "A repo with k8s manifests, a load test, and screenshots of pods scaling under load.",
  },
  {
    id: "iac-baseline",
    name: "InfraBaseline",
    skills: ["terraform", "aws"],
    description: "Provision a reproducible AWS environment (VPC, subnets, EC2, security groups) entirely with Terraform.",
    deliverable: "A repo with terraform plan/apply output and a network diagram.",
  },
  {
    id: "secure-api",
    name: "SecureAPI",
    skills: ["rest", "security-fundamentals"],
    description: "Build a REST API and harden it: auth, rate limiting, input validation, and a documented threat model.",
    deliverable: "A repo with the API, a threat model doc, and a short writeup of mitigations.",
  },
  {
    id: "pipeline-guard",
    name: "PipelineGuard",
    skills: ["cicd", "testing"],
    description: "Add automated testing and a CI pipeline to an existing project, gating merges on passing tests.",
    deliverable: "A repo with GitHub Actions config, test coverage report, and branch protection screenshot.",
  },
  {
    id: "insight-deck",
    name: "InsightDeck",
    skills: ["sql", "visualization"],
    description: "Take a public dataset, write the SQL to shape it, and produce a 5-chart insight deck with a written narrative.",
    deliverable: "A repo with SQL queries, charts, and a one-page findings summary.",
  },
  {
    id: "model-ship",
    name: "ModelShip",
    skills: ["ml", "mlops"],
    description: "Train a model, wrap it behind a FastAPI endpoint, containerize it, and document the serving latency.",
    deliverable: "A repo with training code, a Dockerfile, and a benchmark of inference latency.",
  },
  {
    id: "fullstack-mvp",
    name: "LaunchMVP",
    skills: ["react", "nodejs", "rest"],
    description: "Ship a small full-stack product: React frontend, Node/Express API, persistence, and deployed demo.",
    deliverable: "A repo + live demo link + a short Loom-style walkthrough script.",
  },
];

// Assessment question bank, keyed by skill id
const ASSESSMENT_BANK = {
  linux: [
    { q: "Which command shows currently running processes with live resource usage?", options: ["ls -la", "top / htop", "cat /proc", "chmod +x"], answer: 1 },
    { q: "What does `chmod 755 file.sh` do?", options: ["Deletes the file", "Owner: rwx, group/others: rx", "Makes it read-only for everyone", "Compresses the file"], answer: 1 },
  ],
  aws: [
    { q: "Which AWS service is primarily used for object storage?", options: ["EC2", "S3", "IAM", "Route 53"], answer: 1 },
    { q: "What is the purpose of an IAM role in AWS?", options: ["Store files", "Grant temporary permissions to a resource or user", "Route DNS traffic", "Cache database queries"], answer: 1 },
  ],
  docker: [
    { q: "What's the difference between a Docker image and a container?", options: ["No difference", "Image is a running instance of a container", "Container is a running instance of an image", "Image only works on Linux"], answer: 2 },
    { q: "Which file defines how a Docker image is built?", options: ["docker-compose.yml", "Dockerfile", "package.json", ".dockerignore"], answer: 1 },
  ],
  kubernetes: [
    { q: "What is the smallest deployable unit in Kubernetes?", options: ["Node", "Pod", "Cluster", "Deployment"], answer: 1 },
    { q: "What does a Kubernetes Service primarily provide?", options: ["Persistent storage", "Stable network access to a set of pods", "A build pipeline", "A container image"], answer: 1 },
  ],
  terraform: [
    { q: "What does `terraform plan` do?", options: ["Applies changes immediately", "Shows a preview of proposed infrastructure changes", "Destroys all resources", "Formats code"], answer: 1 },
  ],
  cicd: [
    { q: "In a CI/CD pipeline, what is the main purpose of the 'CI' (Continuous Integration) stage?", options: ["Deploy to production automatically", "Automatically build & test code on every change", "Manage cloud billing", "Monitor uptime"], answer: 1 },
  ],
  python: [
    { q: "What data structure would you use for fast key-based lookups in Python?", options: ["list", "tuple", "dict", "set of tuples"], answer: 2 },
  ],
  dsa: [
    { q: "What is the time complexity of binary search on a sorted array?", options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"], answer: 2 },
  ],
  sql: [
    { q: "Which SQL clause is used to filter grouped results?", options: ["WHERE", "HAVING", "GROUP", "FILTER"], answer: 1 },
  ],
  react: [
    { q: "What triggers a React function component to re-render?", options: ["Changing a local variable", "State or props changing", "Refreshing the CSS", "Calling console.log"], answer: 1 },
  ],
  ml: [
    { q: "What's the main risk of overfitting a model?", options: ["It trains too slowly", "It performs well on training data but poorly on unseen data", "It uses too little memory", "It can't be deployed"], answer: 1 },
  ],
  "security-fundamentals": [
    { q: "What does the principle of 'least privilege' mean?", options: ["Give every user admin access", "Grant only the minimum access needed to do a task", "Disable all firewalls", "Use the same password everywhere"], answer: 1 },
  ],
};

// Interview question templates by mode
const INTERVIEW_QUESTIONS = {
  technical: [
    "Walk me through how you'd design a system that needs to handle a sudden spike in traffic.",
    "What's a bug you fixed recently that taught you something? Explain your debugging process.",
    "How would you decide between a relational and a non-relational database for a new project?",
  ],
  "project-based": [
    "Pick your strongest GitHub project — explain the architecture and why you chose it.",
    "What was the hardest technical decision you made on that project, and what did you trade off?",
    "If you had another month on that project, what would you change or add?",
  ],
  hr: [
    "Tell me about a time you disagreed with a teammate. How did you resolve it?",
    "Why are you interested in this specific career path?",
    "Describe a situation where you had to learn something quickly under a deadline.",
  ],
  "role-specific": [
    "How would you troubleshoot a production service that's suddenly returning 500 errors?",
    "Explain how you'd secure a public-facing API from common attacks.",
    "How do you decide what to monitor and alert on for a new service?",
  ],
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
