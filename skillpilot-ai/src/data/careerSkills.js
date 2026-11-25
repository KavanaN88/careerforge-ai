// ============================================================================
// CAREER SKILL LIBRARY + CATEGORIES  (data only — see careerCatalog.js for roles & logic)
//
// Every skill a career can require is defined ONCE here, so no skill is ever duplicated and
// every career's dependency graph is generated from the same relationships.
//
//   cSkill(id, name, kind, purpose, deps, claims)
//     kind    : lang | fw | db | tool | cloud | cs      (grouping in the career details panel)
//     purpose : "what it is used for" — also powers auto-generated assessment questions
//     deps    : soft prerequisites. A career's graph only draws the edges whose prerequisite is
//               ALSO required by that career (so the same skill links differently per career).
//     claims  : ids from the onboarding skill picker (skillCatalog.js) that count as "I know this".
//               A picker id identical to this skill's id is claimed automatically.
// ============================================================================

const SKILL_LIB = {};
function cSkill(id, name, kind, purpose, deps = "", claims = "") {
  SKILL_LIB[id] = {
    id, name, kind, purpose,
    deps: deps ? deps.split(",") : [],
    claims: claims ? claims.split(",") : [],
  };
}

// ---- Languages ------------------------------------------------------------
cSkill("python", "Python", "lang", "scripting, automation, data work and backend services");
cSkill("java", "Java", "lang", "building large, typed, object-oriented enterprise applications");
cSkill("javascript", "JavaScript", "lang", "adding interactivity to web pages and running services on Node.js");
cSkill("typescript", "TypeScript", "lang", "adding static types to JavaScript for safer large codebases", "javascript");
cSkill("c", "C", "lang", "low-level systems and embedded programming with manual memory control");
cSkill("cpp", "C++", "lang", "high-performance software such as game engines, trading and systems code");
cSkill("csharp", "C#", "lang", "building .NET applications, Unity games and enterprise software");
cSkill("go", "Go", "lang", "fast concurrent backend services and cloud tooling");
cSkill("rust", "Rust", "lang", "memory-safe systems programming without a garbage collector");
cSkill("php", "PHP", "lang", "server-side web development");
cSkill("ruby", "Ruby", "lang", "productive web development, most often with Rails");
cSkill("swift", "Swift", "lang", "building iOS and macOS applications");
cSkill("kotlin", "Kotlin", "lang", "Android development and modern JVM applications");
cSkill("dart", "Dart", "lang", "building cross-platform apps with Flutter");
cSkill("r", "R", "lang", "statistical computing and data visualization");
cSkill("scala", "Scala", "lang", "functional programming and big-data jobs on the JVM");
cSkill("sql", "SQL", "lang", "querying and managing data in relational databases", "", "mysql,postgres,oracledb,mssql,sqlite,mariadb");
cSkill("bash", "Bash / Shell Scripting", "lang", "automating tasks on Linux and Unix systems", "linux", "bash,shellscripting,powershell,terminal");
cSkill("matlab", "MATLAB", "lang", "numerical computing, simulation and control design");
cSkill("solidity", "Solidity", "lang", "writing smart contracts for Ethereum-compatible blockchains");
cSkill("html", "HTML", "lang", "structuring content on the web");
cSkill("css", "CSS", "lang", "styling and laying out web pages", "html");
cSkill("assembly", "Assembly Language", "lang", "writing processor-level code and analysing binaries", "c", "asm");
cSkill("vhdl", "Verilog / VHDL", "lang", "describing digital hardware for FPGAs and chips");

// ---- Frontend ---------------------------------------------------------------
cSkill("react", "React", "fw", "building component-based user interfaces", "javascript,html,css");
cSkill("angular", "Angular", "fw", "building large single-page applications with TypeScript", "typescript,html,css");
cSkill("vue", "Vue.js", "fw", "building approachable, reactive user interfaces", "javascript,html,css");
cSkill("nextjs", "Next.js", "fw", "server-rendered and full-stack React applications", "react");
cSkill("svelte", "Svelte", "fw", "compiling lightweight reactive user interfaces", "javascript,html,css", "svelte,sveltekit");
cSkill("tailwind", "Tailwind CSS", "fw", "utility-first styling of responsive interfaces", "css");
cSkill("state-management", "State Management", "fw", "managing complex client-side state (Redux, Zustand)", "react", "redux");
cSkill("build-tools", "Build Tools (Vite / Webpack)", "tool", "bundling and optimising front-end code", "javascript", "vite,webpack");
cSkill("web-performance", "Web Performance", "cs", "making sites fast — Core Web Vitals, caching and lazy loading", "javascript,css");
cSkill("accessibility", "Web Accessibility", "cs", "building interfaces everyone can use (WCAG, ARIA)", "html");
cSkill("responsive-design", "Responsive Design", "cs", "layouts that adapt to every screen size", "css");
cSkill("ui-ux", "UI/UX Design", "cs", "designing usable, attractive interfaces with tools like Figma", "", "figma");
cSkill("design-systems", "Design Systems", "cs", "reusable component libraries with consistent design tokens", "css,ui-ux");

// ---- Backend ----------------------------------------------------------------
cSkill("nodejs", "Node.js", "fw", "running JavaScript on the server", "javascript");
cSkill("express", "Express.js", "fw", "building HTTP APIs on top of Node.js", "nodejs");
cSkill("nestjs", "NestJS", "fw", "structured, TypeScript-first Node.js back ends", "typescript,nodejs");
cSkill("django", "Django", "fw", "batteries-included Python web applications", "python");
cSkill("fastapi", "FastAPI", "fw", "fast, typed Python APIs with automatic documentation", "python");
cSkill("spring", "Spring Boot", "fw", "production-grade Java services and microservices", "java", "spring,springboot");
cSkill("aspnet", "ASP.NET Core", "fw", "web APIs and apps on the .NET platform", "csharp");
cSkill("laravel", "Laravel", "fw", "elegant full-featured PHP web applications", "php");
cSkill("rails", "Ruby on Rails", "fw", "convention-over-configuration Ruby web apps", "ruby");
cSkill("rest", "REST APIs", "cs", "designing HTTP APIs around resources and status codes", "python,java,nodejs,csharp,go,php,ruby");
cSkill("graphql", "GraphQL", "cs", "letting clients query exactly the data they need", "rest");
cSkill("grpc", "gRPC", "cs", "fast, typed service-to-service communication", "rest");
cSkill("microservices", "Microservices", "cs", "splitting systems into independently deployable services", "rest,docker");
cSkill("auth", "Authentication & Authorization", "cs", "securing APIs with sessions, JWT and OAuth", "rest");
cSkill("message-queues", "Message Queues (Kafka / RabbitMQ)", "tool", "decoupling services with asynchronous messaging", "");
cSkill("caching", "Caching (Redis)", "tool", "speeding up reads by storing hot data in memory", "", "redis");

// ---- Databases --------------------------------------------------------------
cSkill("postgres", "PostgreSQL", "db", "a powerful open-source relational database", "sql");
cSkill("mysql", "MySQL", "db", "a widely used open-source relational database", "sql");
cSkill("mongodb", "MongoDB", "db", "storing flexible JSON-like documents", "");
cSkill("redis", "Redis", "db", "in-memory data storage for caching and queues", "");
cSkill("elasticsearch", "Elasticsearch", "db", "full-text search and log analytics at scale", "");
cSkill("cassandra", "Cassandra / Wide-Column Stores", "db", "highly available writes across many nodes", "", "cassandra,dynamodb");
cSkill("neo4j", "Graph Databases (Neo4j)", "db", "modelling and querying highly connected data", "");
cSkill("oracle", "Oracle / PL-SQL", "db", "enterprise relational databases and stored procedures", "sql", "oracledb");
cSkill("mssql", "SQL Server / T-SQL", "db", "Microsoft relational databases and T-SQL programming", "sql");
cSkill("db-design", "Database Design", "cs", "normalisation, keys and entity-relationship modelling", "sql");
cSkill("query-opt", "Query Optimization", "cs", "making slow queries fast with indexes and execution plans", "sql");
cSkill("db-admin", "Database Administration", "cs", "installing, securing, tuning and monitoring databases", "sql,linux");
cSkill("backup-recovery", "Backup & Recovery", "cs", "protecting data with backups, replication and failover", "db-admin");
cSkill("data-modeling", "Data Modeling", "cs", "structuring data for analytics and applications", "sql");

// ---- Cloud ------------------------------------------------------------------
cSkill("aws", "AWS", "cloud", "running infrastructure and services on Amazon Web Services", "linux,networking");
cSkill("azure", "Microsoft Azure", "cloud", "running infrastructure and services on Microsoft's cloud", "linux,networking");
cSkill("gcp", "Google Cloud (GCP)", "cloud", "running infrastructure and services on Google's cloud", "linux,networking");
cSkill("cloud-arch", "Cloud Architecture", "cs", "designing scalable, resilient, cost-aware cloud systems", "aws,azure,gcp,networking");
cSkill("serverless", "Serverless (Lambda / Functions)", "cloud", "running code without managing servers", "aws,azure,gcp");
cSkill("cloud-security", "Cloud Security", "cs", "securing identities, data and workloads in the cloud", "security-fundamentals,aws,azure,gcp");
cSkill("iam", "Identity & Access Management", "cs", "controlling who can access which resources", "security-fundamentals");
cSkill("finops", "Cloud Cost Optimization (FinOps)", "cs", "controlling and reducing cloud spend", "aws,azure,gcp");
cSkill("cloud-networking", "Cloud Networking", "cs", "VPCs, subnets, DNS, CDNs and load balancing in the cloud", "networking,aws,azure,gcp");

// ---- DevOps / infrastructure -----------------------------------------------
cSkill("linux", "Linux", "tool", "administering and scripting on Linux servers", "", "linux,terminal,kali");
cSkill("git", "Git", "tool", "tracking changes and collaborating on code", "");
cSkill("docker", "Docker", "tool", "packaging applications into portable containers", "linux");
cSkill("kubernetes", "Kubernetes", "tool", "orchestrating containers across clusters", "docker,networking");
cSkill("helm", "Helm", "tool", "packaging and deploying Kubernetes applications", "kubernetes");
cSkill("terraform", "Terraform", "tool", "defining infrastructure as reviewable code", "aws,azure,gcp", "terraform,iac");
cSkill("ansible", "Ansible", "tool", "automating server configuration", "linux");
cSkill("cicd", "CI/CD", "cs", "automating build, test and deployment pipelines", "git,docker", "cicd,ghactions,jenkins,gitlab");
cSkill("monitoring", "Monitoring", "cs", "tracking system health with Prometheus and Grafana", "linux,kubernetes", "prometheus,grafana");
cSkill("observability", "Observability", "cs", "understanding systems through logs, metrics and traces", "monitoring");
cSkill("gitops", "GitOps (Argo CD / Flux)", "tool", "deploying to Kubernetes from Git as the source of truth", "kubernetes,git");
cSkill("service-mesh", "Service Mesh (Istio)", "tool", "managing traffic and security between services", "kubernetes");
cSkill("sre-practices", "SRE Practices", "cs", "reliability engineering with SLOs and error budgets", "monitoring");
cSkill("incident-mgmt", "Incident Management", "cs", "responding to, resolving and learning from outages", "");
cSkill("platform-eng", "Internal Developer Platforms", "cs", "building self-service platforms that speed up developers", "kubernetes,terraform");
cSkill("devsecops", "DevSecOps", "cs", "building security checks into delivery pipelines", "cicd,security-fundamentals");
cSkill("virtualization", "Virtualization", "tool", "running many virtual machines on shared hardware", "linux", "virtualization");

// ---- AI / ML ----------------------------------------------------------------
cSkill("mathematics", "Mathematics", "cs", "linear algebra, calculus and probability behind ML");
cSkill("statistics", "Statistics", "cs", "drawing reliable conclusions from data", "", "datascience");
cSkill("ml", "Machine Learning", "cs", "training models that learn patterns from data", "python,statistics,mathematics");
cSkill("dl", "Deep Learning", "cs", "neural networks for vision, language and speech", "ml");
cSkill("nlp", "Natural Language Processing", "cs", "making software understand and generate human language", "ml,python");
cSkill("cv", "Computer Vision", "cs", "extracting meaning from images and video", "dl");
cSkill("pytorch", "PyTorch", "fw", "building and training neural networks", "dl,python");
cSkill("tensorflow", "TensorFlow / Keras", "fw", "building and deploying neural networks", "dl,python", "tensorflow,keras");
cSkill("sklearn", "Scikit-learn", "fw", "classical machine-learning algorithms in Python", "ml,python");
cSkill("pandas", "Pandas & NumPy", "fw", "cleaning and analysing tabular data in Python", "python", "pandas,numpy");
cSkill("mlops", "MLOps", "cs", "taking models to production and keeping them healthy", "ml,docker");
cSkill("model-deploy", "Model Deployment", "cs", "serving trained models through APIs and containers", "ml,docker");
cSkill("genai", "Generative AI", "cs", "systems that generate text, images, audio and code", "dl", "genai,ai");
cSkill("llm", "LLM Engineering", "cs", "building applications on top of large language models", "genai,python");
cSkill("rag", "RAG & Vector Databases", "cs", "grounding LLM answers in your own documents", "llm");
cSkill("prompt-eng", "Prompt Engineering", "cs", "designing prompts and evaluations that make LLMs reliable", "genai");
cSkill("langchain", "LangChain / Agent Frameworks", "fw", "composing LLM calls, tools and memory", "llm", "langchain,huggingface");
cSkill("ai-agents", "AI Agents", "cs", "LLM-driven systems that plan and use tools", "llm");
cSkill("rl", "Reinforcement Learning", "cs", "training agents through reward and trial", "ml");
cSkill("ai-ethics", "Responsible AI", "cs", "fairness, safety, privacy and governance of AI systems", "");
cSkill("feature-eng", "Feature Engineering", "cs", "turning raw data into signals models can use", "pandas,ml");
cSkill("time-series", "Time-Series Forecasting", "cs", "predicting values that change over time", "statistics,ml");
cSkill("recsys", "Recommender Systems", "cs", "suggesting items users are likely to want", "ml");
cSkill("speech", "Speech & Audio AI", "cs", "speech recognition, synthesis and audio models", "dl");

// ---- Data -------------------------------------------------------------------
cSkill("excel", "Excel", "tool", "analysing and presenting data in spreadsheets");
cSkill("visualization", "Data Visualization", "cs", "turning numbers into clear charts and dashboards", "sql,python");
cSkill("bi-tools", "BI Tools (Tableau / Power BI)", "tool", "building interactive business dashboards", "visualization");
cSkill("storytelling", "Data Storytelling", "cs", "communicating insights so people act on them", "visualization");
cSkill("dataeng", "Data Engineering", "cs", "building reliable pipelines that move and shape data", "sql,python");
cSkill("etl", "ETL / ELT Pipelines", "cs", "extracting, transforming and loading data between systems", "sql,python");
cSkill("spark", "Apache Spark", "fw", "processing very large datasets in parallel", "python,sql,scala");
cSkill("airflow", "Workflow Orchestration (Airflow)", "tool", "scheduling and monitoring data pipelines", "python");
cSkill("kafka", "Apache Kafka / Streaming", "tool", "processing real-time event streams", "");
cSkill("dwh", "Data Warehousing", "cs", "storing analytics data in star schemas and warehouses", "sql");
cSkill("analytics-eng", "dbt & Analytics Engineering", "tool", "version-controlled, tested SQL transformations", "sql,git");
cSkill("data-governance", "Data Governance & Quality", "cs", "keeping data accurate, secure and compliant", "");
cSkill("big-data", "Big Data Ecosystem", "cs", "Hadoop-style storage and processing of huge datasets", "sql,linux");
cSkill("ab-testing", "Experimentation (A/B Testing)", "cs", "measuring the real effect of product changes", "statistics");
cSkill("product-analytics", "Product Analytics", "cs", "understanding how users behave inside a product", "sql");

// ---- Security ---------------------------------------------------------------
cSkill("networking", "Networking", "cs", "how devices communicate — TCP/IP, DNS and HTTP", "linux", "networks");
cSkill("security-fundamentals", "Security Fundamentals", "cs", "core ideas like least privilege and defence in depth", "networking", "ethhack,owasp,vulnassess");
cSkill("cryptography", "Cryptography", "cs", "protecting data with encryption, hashing and signatures", "", "crypto");
cSkill("pentesting", "Penetration Testing", "cs", "legally attacking systems to find weaknesses", "security-fundamentals");
cSkill("web-security", "Web Application Security", "cs", "preventing OWASP Top 10 flaws such as injection and XSS", "security-fundamentals", "owasp");
cSkill("security-tools", "Security Tools", "tool", "using Burp Suite, Wireshark, Nmap and Metasploit", "security-fundamentals", "burp,wireshark,kali");
cSkill("incident-response", "Incident Response", "cs", "detecting, containing and recovering from attacks", "security-fundamentals", "secops");
cSkill("siem", "SIEM & Log Analysis", "tool", "correlating logs to detect threats (Splunk, Sentinel)", "security-fundamentals");
cSkill("threat-intel", "Threat Intelligence", "cs", "tracking attackers, tactics and indicators of compromise", "security-fundamentals");
cSkill("malware-analysis", "Malware Analysis", "cs", "dissecting malicious software to learn what it does", "security-fundamentals,assembly");
cSkill("forensics", "Digital Forensics", "cs", "collecting and analysing evidence from devices and networks", "security-fundamentals");
cSkill("appsec", "Secure SDLC / AppSec", "cs", "building security into the software development lifecycle", "web-security");
cSkill("grc", "Governance, Risk & Compliance", "cs", "policies, risk assessment and standards such as ISO 27001", "");
cSkill("network-security", "Network Security", "cs", "firewalls, IDS/IPS, VPNs and segmentation", "networking,security-fundamentals", "netsec");
cSkill("red-team", "Red Teaming", "cs", "simulating real adversaries end to end", "pentesting");
cSkill("reverse-engineering", "Reverse Engineering", "cs", "understanding compiled programs without source code", "assembly,c");
cSkill("wireless-security", "Wireless Security", "cs", "assessing and securing Wi-Fi and radio networks", "networking");
cSkill("exploit-dev", "Exploit Development", "cs", "turning memory-safety bugs into proofs of concept", "assembly,c");
cSkill("soc-ops", "SOC Operations", "cs", "monitoring, triaging and escalating security alerts", "siem");
cSkill("vuln-mgmt", "Vulnerability Management", "cs", "scanning, prioritising and fixing vulnerabilities", "security-fundamentals", "vulnassess");

// ---- Networking & infrastructure -------------------------------------------
cSkill("routing-switching", "Routing & Switching", "cs", "moving traffic across LANs and WANs (OSPF, BGP, VLANs)", "networking");
cSkill("wireless", "Wireless Networking", "cs", "designing and troubleshooting Wi-Fi networks", "networking");
cSkill("sysadmin", "System Administration", "cs", "keeping servers patched, monitored and backed up", "linux");
cSkill("windows-server", "Windows Server & Active Directory", "tool", "managing Windows servers and user identities");
cSkill("network-automation", "Network Automation", "cs", "configuring networks with code instead of by hand", "networking,python,ansible");
cSkill("load-balancing", "Load Balancing & Proxies", "tool", "spreading traffic with Nginx, HAProxy or cloud load balancers", "networking", "nginx,apache");
cSkill("network-design", "Network Design", "cs", "planning topologies, capacity and redundancy", "routing-switching");

// ---- Mobile -----------------------------------------------------------------
cSkill("android", "Android Development", "cs", "building native Android apps", "kotlin,java", "android,androidstudio");
cSkill("ios", "iOS Development", "cs", "building native iPhone and iPad apps", "swift");
cSkill("flutter", "Flutter", "fw", "one codebase for iOS and Android", "dart");
cSkill("react-native", "React Native", "fw", "building mobile apps with React", "react,javascript", "reactnative");
cSkill("jetpack-compose", "Jetpack Compose", "fw", "declarative Android user interfaces", "kotlin", "compose,kmp");
cSkill("swiftui", "SwiftUI", "fw", "declarative Apple-platform user interfaces", "swift");
cSkill("firebase", "Firebase", "tool", "managed auth, database and push notifications for apps", "", "firestore,supabase");
cSkill("mobile-ui", "Mobile UI Design", "cs", "designing for touch, small screens and platform guidelines", "ui-ux");

// ---- Games / graphics -------------------------------------------------------
cSkill("unity", "Unity", "tool", "building 2D, 3D and mobile games and XR apps", "csharp");
cSkill("unreal", "Unreal Engine", "tool", "building high-fidelity 3D games and simulations", "cpp");
cSkill("game-math", "Game Math & Physics", "cs", "vectors, matrices, collisions and physics simulation", "mathematics");
cSkill("game-design", "Game Design", "cs", "mechanics, level design and player experience");
cSkill("graphics", "Graphics Programming", "cs", "rendering with OpenGL, Vulkan, DirectX or WebGL", "cpp,game-math", "webgl,threejs");
cSkill("shaders", "Shader Programming", "cs", "writing GPU programs that control how things look", "graphics");
cSkill("game-ai", "Game AI", "cs", "pathfinding, behaviour trees and believable NPCs", "game-math");
cSkill("multiplayer", "Multiplayer Networking", "cs", "synchronising game state between players", "networking");

// ---- Blockchain -------------------------------------------------------------
cSkill("blockchain-fundamentals", "Blockchain Fundamentals", "cs", "how blocks, consensus and wallets work", "cryptography");
cSkill("smart-contracts", "Smart Contracts", "cs", "self-executing programs that run on a blockchain", "solidity,blockchain-fundamentals");
cSkill("web3", "Web3.js / Ethers.js", "fw", "connecting web apps to blockchains and wallets", "javascript,smart-contracts");
cSkill("defi", "DeFi Protocols", "cs", "lending, trading and staking built from smart contracts", "smart-contracts");
cSkill("contract-security", "Smart Contract Security", "cs", "finding reentrancy, overflow and access-control bugs", "smart-contracts");
cSkill("zk", "Zero-Knowledge Proofs", "cs", "proving something is true without revealing the data", "cryptography");

// ---- Embedded / IoT / robotics ----------------------------------------------
cSkill("electronics", "Digital & Analog Electronics", "cs", "circuits, components and reading schematics");
cSkill("embedded-fundamentals", "Embedded Systems Fundamentals", "cs", "firmware, interrupts and memory-constrained design", "c,electronics");
cSkill("microcontrollers", "Microcontrollers", "tool", "programming Arduino, STM32 and ESP32 boards", "c,electronics");
cSkill("rtos", "RTOS (FreeRTOS)", "tool", "scheduling real-time tasks on small devices", "c,embedded-fundamentals");
cSkill("comm-protocols", "Communication Protocols", "cs", "I2C, SPI, UART and CAN between chips and devices", "embedded-fundamentals");
cSkill("pcb-design", "PCB Design", "tool", "laying out printed circuit boards", "electronics");
cSkill("fpga", "FPGA & HDL", "cs", "building custom digital hardware", "vhdl,electronics");
cSkill("embedded-linux", "Embedded Linux", "cs", "building Linux images for devices (Yocto, Buildroot)", "linux,c");
cSkill("dsp", "Digital Signal Processing", "cs", "filtering and transforming sensor and audio signals", "mathematics");
cSkill("iot-fundamentals", "IoT Fundamentals", "cs", "devices, gateways, connectivity and cloud together");
cSkill("mqtt", "MQTT & IoT Protocols", "tool", "lightweight messaging between devices and cloud", "networking");
cSkill("edge-computing", "Edge Computing", "cs", "processing data close to where it is produced", "linux");
cSkill("sensors", "Sensors & Actuators", "cs", "reading the physical world and acting on it", "electronics");
cSkill("iot-cloud", "IoT Cloud Platforms", "cloud", "AWS IoT, Azure IoT Hub and device fleets", "aws,azure,mqtt");
cSkill("wireless-protocols", "BLE, LoRa & Zigbee", "cs", "low-power wireless links for devices", "electronics");
cSkill("iot-security", "IoT Security", "cs", "securing devices, firmware updates and fleets", "security-fundamentals,iot-fundamentals");
cSkill("digital-twins", "Digital Twins", "cs", "live virtual models of physical assets", "iot-fundamentals");
cSkill("ros", "ROS / ROS 2", "fw", "building robot software from reusable nodes", "python,cpp,linux");
cSkill("control-systems", "Control Systems", "cs", "feedback control such as PID for machines and robots", "mathematics");
cSkill("kinematics", "Kinematics & Dynamics", "cs", "modelling how robot arms and vehicles move", "mathematics");
cSkill("slam", "SLAM & Navigation", "cs", "mapping and localising a robot at the same time", "cv,ros");
cSkill("motion-planning", "Motion Planning", "cs", "finding safe, efficient paths for robots", "kinematics");
cSkill("plc", "PLC Programming", "tool", "programming industrial controllers in ladder logic", "electronics");
cSkill("industrial-automation", "Industrial Automation", "cs", "SCADA, HMI and factory-floor control", "plc");
cSkill("rpa", "RPA", "tool", "automating repetitive software tasks with UiPath or Automation Anywhere");

// ---- Testing / QA -----------------------------------------------------------
cSkill("testing", "Software Testing", "cs", "verifying software behaves as intended", "python,java,javascript", "testing");
cSkill("unit-testing", "Unit & Integration Testing", "cs", "automated tests with pytest, JUnit or Jest", "testing");
cSkill("test-automation", "Test Automation", "tool", "automating UI tests with Selenium, Playwright or Cypress", "testing");
cSkill("api-testing", "API Testing", "tool", "validating APIs with Postman and automated suites", "rest,testing", "postman");
cSkill("performance-testing", "Performance Testing", "tool", "load testing with JMeter or k6", "testing");
cSkill("qa-process", "Test Planning & QA Process", "cs", "test plans, cases, bug reports and release sign-off");
cSkill("bdd", "BDD (Cucumber)", "tool", "writing tests as readable behaviour specifications", "test-automation");
cSkill("security-testing", "Security Testing", "cs", "testing applications for vulnerabilities", "testing,web-security");

// ---- Architecture / CS fundamentals -----------------------------------------
cSkill("dsa", "Data Structures & Algorithms", "cs", "choosing efficient ways to store and process data");
cSkill("oop", "Object-Oriented Programming", "cs", "modelling software with classes and objects");
cSkill("os", "Operating Systems", "cs", "processes, memory and scheduling under the hood");
cSkill("systemdesign", "System Design", "cs", "architecting scalable, reliable systems", "dsa,rest", "sysdesign");
cSkill("design-patterns", "Design Patterns", "cs", "proven solutions to recurring design problems", "oop");
cSkill("distributed", "Distributed Systems", "cs", "consensus, replication and failure in multi-node systems", "networking");
cSkill("ent-arch", "Enterprise Architecture", "cs", "aligning technology landscapes to business strategy (TOGAF)");
cSkill("ddd", "Domain-Driven Design", "cs", "structuring software around the business domain", "design-patterns");
cSkill("api-design", "API Design", "cs", "designing consistent, versioned, well-documented APIs", "rest");
cSkill("event-driven", "Event-Driven Architecture", "cs", "systems that communicate through events", "message-queues");
cSkill("tech-leadership", "Technical Leadership", "cs", "guiding technical decisions and mentoring engineers");
cSkill("integration-patterns", "Enterprise Integration Patterns", "cs", "connecting systems reliably through messaging and APIs", "api-design");
cSkill("scalability", "Scalability & Performance", "cs", "keeping systems fast as load grows", "systemdesign");

// ---- Enterprise platforms ---------------------------------------------------
cSkill("sap", "SAP (S/4HANA & ABAP)", "tool", "configuring and extending SAP business systems");
cSkill("salesforce", "Salesforce (Apex & Lightning)", "tool", "customising the Salesforce CRM platform");
cSkill("servicenow", "ServiceNow", "tool", "building IT service-management workflows", "javascript");
cSkill("erp", "ERP Systems", "cs", "integrated finance, supply-chain and HR software");
cSkill("business-analysis", "Business Analysis", "cs", "turning business needs into clear solutions");
cSkill("requirements", "Requirements Analysis", "cs", "gathering and documenting what a system must do");
cSkill("low-code", "Low-Code / Power Platform", "tool", "building apps and automations with Microsoft Power Platform");
cSkill("itil", "ITIL / IT Service Management", "cs", "running IT services with incident, change and problem processes");
cSkill("crm", "CRM Systems", "cs", "managing customer data and sales processes");
cSkill("integration", "Enterprise Integration Tools", "tool", "connecting systems with MuleSoft, Boomi or Azure Logic Apps", "rest");

// ---- XR / emerging ----------------------------------------------------------
cSkill("xr-dev", "XR Development", "cs", "building augmented and virtual reality experiences", "unity");
cSkill("arcore", "ARKit / ARCore", "fw", "mobile augmented-reality SDKs", "xr-dev");
cSkill("webxr", "WebXR / A-Frame", "fw", "immersive experiences in the browser", "javascript,graphics");
cSkill("spatial-ux", "Spatial UX Design", "cs", "designing interaction in 3D space", "ui-ux");
cSkill("3d-modeling", "3D Modeling (Blender)", "tool", "creating 3D assets for games and XR");
cSkill("spatial-computing", "Spatial Computing", "cs", "mixed-reality platforms such as Vision Pro and HoloLens", "xr-dev");
cSkill("quantum", "Quantum Computing Fundamentals", "cs", "qubits, superposition and quantum gates", "mathematics");
cSkill("qiskit", "Qiskit / Quantum SDKs", "fw", "writing quantum programs in Python", "python,quantum");
cSkill("quantum-algorithms", "Quantum Algorithms", "cs", "Grover, Shor and variational algorithms", "quantum");
cSkill("tinyml", "TinyML / Edge AI", "cs", "running ML models on small, low-power devices", "dl,embedded-fundamentals");
cSkill("bioinformatics", "Bioinformatics", "cs", "analysing genomic and biological data", "python,statistics");
cSkill("geospatial", "GIS & Geospatial Analysis", "cs", "mapping and analysing location data", "python,sql");
cSkill("5g", "5G & Telecom Networks", "cs", "mobile network architecture and radio access", "networking");
cSkill("autonomous", "Autonomous Systems", "cs", "perception, planning and control for self-driving machines", "cv,control-systems");

// ---- Product / project / research -------------------------------------------
cSkill("product-mgmt", "Product Management", "cs", "deciding what to build and why");
cSkill("agile", "Agile & Scrum", "cs", "delivering software in short, iterative cycles");
cSkill("project-mgmt", "Project Management", "cs", "planning scope, schedule, budget and delivery");
cSkill("roadmapping", "Product Roadmapping", "cs", "prioritising and communicating the product plan", "product-mgmt");
cSkill("stakeholder", "Stakeholder Communication", "cs", "aligning engineers, executives and customers");
cSkill("risk-mgmt", "Risk Management", "cs", "identifying and mitigating delivery risks");
cSkill("delivery-tools", "Jira & Delivery Tools", "tool", "tracking work with Jira, Confluence and boards", "", "jira");
cSkill("technical-writing", "Technical Writing", "cs", "clear documentation, guides and API references");
cSkill("ux-research", "UX Research", "cs", "learning what users need through interviews and testing");
cSkill("people-mgmt", "People Management", "cs", "hiring, coaching and growing engineers");
cSkill("metrics", "Metrics & KPIs", "cs", "defining success measures and reading them well", "product-mgmt");
cSkill("research-methods", "Research Methods", "cs", "forming hypotheses, designing and validating experiments", "statistics");
cSkill("scientific-computing", "Scientific Computing", "cs", "numerical methods and simulation in code", "python,mathematics", "matlab,julia");
cSkill("hpc", "High-Performance Computing", "cs", "parallel computing on clusters and supercomputers", "cpp,linux");
cSkill("cuda", "CUDA / GPU Programming", "tool", "accelerating computation on GPUs", "cpp");
cSkill("scientific-writing", "Scientific Writing", "cs", "publishing papers and communicating research");
cSkill("optimization", "Optimization Methods", "cs", "finding the best solution under constraints", "mathematics");
cSkill("simulation", "Modeling & Simulation", "cs", "predicting complex systems with computational models", "mathematics");

// ============================================================================
// CATEGORIES (display order). `resp` = responsibility templates; {a} {b} {c} are filled
// with the role's first three core skills.
// ============================================================================
const CAREER_CATEGORIES = [
  { id: "software", name: "Software Development", icon: "code", blurb: "Build reliable applications in the language you love.",
    resp: ["Design, write and review clean, tested code in {a} and {b}", "Break features into well-scoped tasks and estimate them honestly", "Debug production issues and improve performance and reliability", "Document decisions and collaborate across product and design"] },
  { id: "frontend", name: "Frontend Development", icon: "monitor", blurb: "Craft fast, accessible, beautiful user interfaces.",
    resp: ["Build responsive interfaces with {a} and {b}", "Turn designs into pixel-accurate, accessible components", "Optimise load time, rendering and user experience", "Integrate APIs and manage client-side state"] },
  { id: "backend", name: "Backend Development", icon: "server", blurb: "Power products with APIs, services and data.",
    resp: ["Design and build APIs and services with {a} and {b}", "Model data and write efficient queries", "Secure endpoints with authentication, validation and rate limiting", "Monitor, scale and troubleshoot production services"] },
  { id: "fullstack", name: "Full Stack Development", icon: "layers", blurb: "Own a product from database to browser.",
    resp: ["Build features end to end across {a}, {b} and {c}", "Design the database schema and the API that serves it", "Deploy and operate what you build", "Balance speed, quality and maintainability across the whole stack"] },
  { id: "cloud", name: "Cloud Computing", icon: "cloud", blurb: "Design and run systems on public cloud platforms.",
    resp: ["Provision and operate cloud infrastructure using {a} and {b}", "Design secure, resilient, cost-aware architectures", "Automate deployments and environments with code", "Monitor, troubleshoot and optimise cloud workloads"] },
  { id: "devops", name: "DevOps and Platform Engineering", icon: "settings", blurb: "Automate delivery and keep systems reliable.",
    resp: ["Build and maintain CI/CD pipelines with {a} and {b}", "Manage infrastructure as code and container platforms", "Instrument services for monitoring, alerting and incident response", "Improve developer experience, speed and reliability"] },
  { id: "ai", name: "Artificial Intelligence", icon: "brain-circuit", blurb: "Build intelligent products with modern AI.",
    resp: ["Design and ship AI-powered features using {a} and {b}", "Evaluate model quality, safety and cost in production", "Build data and retrieval pipelines that feed models", "Translate business problems into AI solutions"] },
  { id: "ml", name: "Machine Learning", icon: "sparkles", blurb: "Train, evaluate and deploy learning systems.",
    resp: ["Prepare data and train models with {a} and {b}", "Evaluate, tune and monitor models in production", "Package and serve models through reliable pipelines", "Communicate trade-offs and results to stakeholders"] },
  { id: "datascience", name: "Data Science", icon: "trending-up", blurb: "Find the signal and prove what it means.",
    resp: ["Explore data and form testable hypotheses using {a} and {b}", "Build statistical and predictive models", "Design experiments and interpret results rigorously", "Present findings that change decisions"] },
  { id: "analytics", name: "Data Analytics and Business Intelligence", icon: "bar-chart-3", blurb: "Turn data into dashboards and decisions.",
    resp: ["Query and clean data with {a} and {b}", "Build dashboards and reports stakeholders trust", "Define metrics and track business performance", "Tell clear stories that drive action"] },
  { id: "dataeng", name: "Data Engineering", icon: "database", blurb: "Build the pipelines every data team relies on.",
    resp: ["Build batch and streaming pipelines with {a} and {b}", "Model and maintain data warehouses and lakes", "Ensure data quality, lineage and governance", "Optimise cost and performance of data platforms"] },
  { id: "security", name: "Cybersecurity", icon: "shield", blurb: "Defend systems, data and people.",
    resp: ["Monitor and defend systems using {a} and {b}", "Assess risk and harden infrastructure and applications", "Detect, investigate and respond to incidents", "Write policies and train teams on secure practice"] },
  { id: "pentest", name: "Ethical Hacking and Penetration Testing", icon: "bug", blurb: "Break things legally so they can be fixed.",
    resp: ["Plan and run authorised security assessments with {a} and {b}", "Find, exploit and document vulnerabilities safely", "Write clear reports with risk ratings and fixes", "Retest remediations and advise on prevention"] },
  { id: "networking", name: "Networking and Infrastructure", icon: "globe", blurb: "Keep the world's networks and servers running.",
    resp: ["Design, configure and troubleshoot networks using {a} and {b}", "Maintain servers, directories and core services", "Secure and monitor network and infrastructure health", "Plan capacity, upgrades and disaster recovery"] },
  { id: "database", name: "Database Engineering", icon: "database", blurb: "Design, tune and protect critical data stores.",
    resp: ["Design schemas and write efficient queries using {a} and {b}", "Tune performance with indexes, plans and configuration", "Manage backups, replication, security and failover", "Support developers and plan data migrations"] },
  { id: "mobile", name: "Mobile Application Development", icon: "smartphone", blurb: "Ship apps people carry in their pocket.",
    resp: ["Build polished mobile apps with {a} and {b}", "Integrate APIs, storage and push notifications", "Optimise performance, battery and app size", "Publish and maintain apps on the App Store and Google Play"] },
  { id: "game", name: "Game Development", icon: "gamepad", blurb: "Create worlds, mechanics and play.",
    resp: ["Implement gameplay and systems with {a} and {b}", "Optimise frame rate, memory and load times", "Collaborate with designers and artists on tools and pipelines", "Playtest, debug and ship stable builds"] },
  { id: "blockchain", name: "Blockchain and Web3", icon: "link", blurb: "Build decentralised and trust-minimised systems.",
    resp: ["Design and implement on-chain logic with {a} and {b}", "Test and audit contracts for security flaws", "Build dApp front ends that talk to wallets and chains", "Monitor deployments and manage upgrades"] },
  { id: "embedded", name: "Embedded Systems", icon: "cpu", blurb: "Program the devices around us.",
    resp: ["Write reliable firmware in {a} for constrained devices", "Bring up boards and debug hardware/software issues", "Implement communication protocols and drivers", "Test, optimise and certify products for release"] },
  { id: "iot", name: "IoT Engineering", icon: "radio", blurb: "Connect devices, data and the cloud.",
    resp: ["Connect devices to platforms using {a} and {b}", "Design telemetry pipelines and device management", "Secure devices, firmware updates and communications", "Process data at the edge and in the cloud"] },
  { id: "robotics", name: "Robotics and Automation", icon: "bot", blurb: "Make machines sense, decide and move.",
    resp: ["Develop robot software with {a} and {b}", "Integrate sensors, actuators and controllers", "Simulate, test and tune motion and behaviour", "Automate processes and keep systems safe"] },
  { id: "qa", name: "Testing and Quality Assurance", icon: "check", blurb: "Protect quality before users find the bugs.",
    resp: ["Design test plans and cases covering {a} and {b}", "Build and maintain automated test suites", "Report, triage and verify defects", "Embed quality checks in CI/CD pipelines"] },
  { id: "architecture", name: "Software Architecture", icon: "git-branch", blurb: "Shape how large systems are built.",
    resp: ["Define system architecture and technology choices using {a} and {b}", "Review designs and set engineering standards", "Balance scalability, cost, security and delivery speed", "Mentor teams and communicate technical strategy"] },
  { id: "enterprise", name: "Enterprise Technology", icon: "building", blurb: "Run the business platforms companies depend on.",
    resp: ["Configure and extend enterprise platforms such as {a}", "Gather requirements and map business processes", "Integrate systems and migrate data", "Support users, testing and go-live"] },
  { id: "xr", name: "AR/VR and Spatial Computing", icon: "headset", blurb: "Build immersive, three-dimensional experiences.",
    resp: ["Build immersive experiences with {a} and {b}", "Optimise rendering for comfort and frame rate", "Design 3D interaction and spatial interfaces", "Test on headsets and mobile AR devices"] },
  { id: "emerging", name: "Emerging Technologies", icon: "zap", blurb: "Work at the frontier of what's next.",
    resp: ["Prototype solutions with emerging tech such as {a} and {b}", "Evaluate feasibility, risk and business value", "Translate research into working proofs of concept", "Share learning and upskill teams"] },
  { id: "management", name: "Technical Product and Project Management", icon: "clipboard", blurb: "Lead what gets built and how it ships.",
    resp: ["Define priorities and success measures using {a} and {b}", "Coordinate engineering, design and stakeholders", "Plan, track and de-risk delivery", "Communicate progress, trade-offs and outcomes"] },
  { id: "research", name: "Research and Development", icon: "flask", blurb: "Invent the techniques others will use.",
    resp: ["Design and run experiments using {a} and {b}", "Read, reproduce and extend published research", "Prototype and benchmark new methods", "Publish results and transfer them into products"] },
];
