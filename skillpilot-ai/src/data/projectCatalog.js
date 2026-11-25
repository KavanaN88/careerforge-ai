// ============================================================================
// PROJECT CATALOGUE — 270 distinct, hand-scoped projects (30 categories × 3 levels × 3).
// Seed format: [name, real-world problem, "skill ids", "languages|frameworks|databases|tools", "entities (optional)"]
// Everything else (objectives, phases, tasks, architecture, workflow, schema, API, checklists, evaluation
// criteria, prerequisites, related projects, duration, complexity) is generated in projectEngine.js from the
// seed + its category family + level, so the library can grow by adding one line.
// ============================================================================
const PROJECT_CATEGORIES = [
  { id: "software", name: "Software Development", family: "app", careerCats: ["software", "enterprise"] },
  { id: "frontend", name: "Frontend Development", family: "app", careerCats: ["frontend", "fullstack"] },
  { id: "backend", name: "Backend Development", family: "app", careerCats: ["backend", "fullstack"] },
  { id: "fullstack", name: "Full Stack Development", family: "app", careerCats: ["fullstack", "software"] },
  { id: "cloud", name: "Cloud Computing", family: "infra", careerCats: ["cloud", "architecture"] },
  { id: "awsazure", name: "AWS and Azure Engineering", family: "infra", careerCats: ["cloud"] },
  { id: "devops", name: "DevOps and Platform Engineering", family: "infra", careerCats: ["devops", "cloud"] },
  { id: "ai", name: "Artificial Intelligence", family: "ml", careerCats: ["ai", "ml"] },
  { id: "ml", name: "Machine Learning", family: "ml", careerCats: ["ml", "ai", "datascience"] },
  { id: "dlgenai", name: "Deep Learning and Generative AI", family: "ml", careerCats: ["ai", "ml"] },
  { id: "datascience", name: "Data Science", family: "data", careerCats: ["datascience", "ml", "research"] },
  { id: "analytics", name: "Data Analytics", family: "data", careerCats: ["analytics", "datascience"] },
  { id: "dataeng", name: "Data Engineering", family: "data", careerCats: ["dataeng", "database"] },
  { id: "security", name: "Cybersecurity", family: "security", careerCats: ["security"] },
  { id: "pentest", name: "Ethical Hacking", family: "security", careerCats: ["pentest", "security"] },
  { id: "networking", name: "Networking", family: "network", careerCats: ["networking"] },
  { id: "database", name: "Database Engineering", family: "data", careerCats: ["database", "dataeng"] },
  { id: "mobile", name: "Mobile Application Development", family: "mobile", careerCats: ["mobile"] },
  { id: "game", name: "Game Development", family: "game", careerCats: ["game"] },
  { id: "blockchain", name: "Blockchain and Web3", family: "chain", careerCats: ["blockchain"] },
  { id: "embedded", name: "Embedded Systems", family: "device", careerCats: ["embedded", "iot"] },
  { id: "iot", name: "IoT Engineering", family: "device", careerCats: ["iot", "embedded"] },
  { id: "robotics", name: "Robotics", family: "device", careerCats: ["robotics", "embedded"] },
  { id: "qa", name: "Software Testing and QA", family: "qa", careerCats: ["qa"] },
  { id: "sysadmin", name: "System Administration", family: "infra", careerCats: ["networking", "devops", "enterprise"] },
  { id: "xr", name: "AR/VR Development", family: "game", careerCats: ["xr", "game"] },
  { id: "distributed", name: "Distributed Systems", family: "backend", careerCats: ["architecture", "backend"] },
  { id: "design", name: "System Design and Architecture", family: "design", careerCats: ["architecture", "enterprise", "management"] },
  { id: "gis", name: "GIS and Geospatial Engineering", family: "data", careerCats: ["emerging", "datascience", "research"] },
  { id: "emerging", name: "Emerging Technologies", family: "ml", careerCats: ["emerging", "research", "management"] },
];

const PROJECT_SEEDS = {
  software: {
    basic: [
      ["Expense Tracker CLI", "Students lose track of spending; build a command-line tool that records, categorises and summarises expenses.", "python,oop,unit-testing,git", "Python|||Git,pytest", "expenses,categories"],
      ["Library Management System", "Small libraries track loans on paper; model books, members and loans with clean object-oriented design.", "java,oop,sql,db-design", "Java||MySQL|Maven,JUnit", "books,members,loans"],
      ["Reusable Unit-Conversion Library", "Teams re-implement unit conversions; publish a tested, documented package others can install.", "python,unit-testing,technical-writing,git", "Python|||pytest,GitHub Actions"],
    ],
    intermediate: [
      ["Job Scheduler with Priorities and Retries", "Cron lacks priorities and retry policies; build a scheduler that runs jobs reliably and reports failures.", "python,dsa,design-patterns,unit-testing", "Python||SQLite|pytest,Docker", "jobs,runs"],
      ["Static Site Generator with Plugins", "Documentation sites need fast builds; build a Markdown site generator with an extensible plugin API.", "typescript,nodejs,design-patterns,build-tools", "TypeScript|Node.js||npm,Jest"],
      ["Rule-Based Code Quality Analyser", "Reviewers waste time on style nits; parse source files and report rule violations with locations.", "python,dsa,oop,testing", "Python|||pytest,Git"],
    ],
    advanced: [
      ["Expression Interpreter and REPL", "Build a small language interpreter (lexer, parser, evaluator) to understand how languages execute code.", "dsa,design-patterns,oop,unit-testing", "Rust|||Cargo,GitHub Actions"],
      ["Package Manager with Dependency Resolver", "Dependency conflicts break builds; implement semantic-version resolution over a dependency graph.", "dsa,build-tools,cicd,unit-testing", "Go|||GitHub Actions,Docker"],
      ["Terminal Text Editor with Undo/Redo", "Implement a modal terminal editor with efficient text buffers, undo history and syntax highlighting.", "dsa,design-patterns,os,unit-testing", "C|||Make,Valgrind"],
    ],
  },
  frontend: {
    basic: [
      ["Responsive Portfolio Landing Page", "Job seekers need a fast, accessible personal site; build it mobile-first with semantic HTML and CSS.", "html,css,responsive-design,accessibility", "HTML,CSS,JavaScript|||Git,Lighthouse"],
      ["Interactive Quiz Application", "Learners need instant feedback; build a quiz with scoring, timers and result review in plain JavaScript.", "javascript,html,css,web-performance", "JavaScript|||Git"],
      ["Weather Dashboard with Public API", "Show live forecasts for searched cities, handling loading, errors and unit switching.", "javascript,rest,html,css", "JavaScript|||Git,Postman"],
    ],
    intermediate: [
      ["Kanban Board with Drag-and-Drop", "Teams need to visualise work; build a keyboard-accessible board with persistent state.", "react,typescript,state-management,accessibility", "TypeScript|React||Vite,Jest", "boards,columns,cards"],
      ["Design System Component Library", "Inconsistent UI slows teams; ship a documented, tested, themeable component library.", "react,design-systems,tailwind,unit-testing", "TypeScript|React,Tailwind||Storybook,Jest"],
      ["E-commerce Storefront with Cart and Checkout UX", "Cart abandonment hurts revenue; build a storefront with search, cart state and a validated checkout flow.", "nextjs,react,state-management,responsive-design", "TypeScript|Next.js||Vercel,Cypress", "products,carts,orders"],
    ],
    advanced: [
      ["Real-Time Collaborative Whiteboard", "Remote teams sketch together; implement low-latency shared canvas state with conflict resolution.", "react,typescript,state-management,web-performance", "TypeScript|React||WebSockets,Redis"],
      ["Core Web Vitals Content Platform", "Slow pages lose users; build a content site with an enforced performance budget and CI audits.", "nextjs,web-performance,accessibility,cicd", "TypeScript|Next.js||Lighthouse CI,GitHub Actions"],
      ["Micro-Frontend Shell and Remotes", "Large teams block each other; compose independently deployed micro-frontends with shared design tokens.", "react,typescript,design-systems,cicd", "TypeScript|React||Module Federation,Docker"],
    ],
  },
  backend: {
    basic: [
      ["Student Records CRUD API", "Schools need a simple records service; build a REST API with validation and persistent storage.", "python,fastapi,rest,sql", "Python|FastAPI|SQLite|Postman,pytest", "students,courses"],
      ["Weather Cache Proxy API", "Third-party APIs are slow and rate limited; build a proxy that caches responses with expiry.", "rest,caching,python,unit-testing", "Python|Flask|Redis|Docker"],
      ["URL Shortener Service", "Long links are hard to share; build a service that creates, resolves and counts short links.", "nodejs,express,rest,db-design", "JavaScript|Express|MongoDB|Postman", "links,clicks"],
    ],
    intermediate: [
      ["Library API with JWT Auth and Roles", "Different staff need different permissions; build an API with token authentication and RBAC.", "java,spring,auth,rest", "Java|Spring Boot|PostgreSQL|Docker,JUnit", "users,books,loans"],
      ["Order Service with Transactions", "Partial orders corrupt data; implement atomic order placement, stock reservation and idempotent retries.", "nestjs,db-design,unit-testing,rest", "TypeScript|NestJS|PostgreSQL|Docker,Jest", "customers,orders,items"],
      ["Rate-Limited API Gateway", "Public APIs get abused; build a gateway with API keys, quotas and caching.", "nodejs,api-design,caching,auth", "JavaScript|Express|Redis|Docker,k6", "clients,keys"],
    ],
    advanced: [
      ["Event-Driven Order Processing", "Synchronous order flows fail under load; decouple services with Kafka and guarantee exactly-once effects.", "event-driven,microservices,kafka,db-design", "Java|Spring Boot|PostgreSQL|Kafka,Docker", "orders,payments,shipments"],
      ["Multi-Tenant SaaS Backend", "SaaS vendors must isolate customers; implement tenant-aware auth, data isolation and usage metering.", "api-design,auth,scalability,db-design", "TypeScript|NestJS|PostgreSQL|Docker,Terraform", "tenants,users,plans"],
      ["High-Throughput Ingestion API with Backpressure", "Bursty producers overwhelm services; build an ingestion path with queues, batching and load shedding.", "scalability,message-queues,observability,performance-testing", "Go||PostgreSQL|Kafka,Prometheus,k6"],
    ],
  },
  fullstack: {
    basic: [
      ["Personal Blog Platform", "Writers need a simple publishing site; build posts, comments and an admin login end to end.", "html,css,javascript,nodejs,express", "JavaScript|Express||Git", "posts,comments,users"],
      ["Task Manager with Login", "Build a to-do web app with user accounts so each person sees only their own tasks.", "javascript,nodejs,auth,sql", "JavaScript|Express|SQLite|Git", "users,tasks"],
      ["Event RSVP Web App", "Organisers lose track of attendees; build event pages with RSVP limits and confirmation emails.", "javascript,rest,db-design,html", "JavaScript|Express|MySQL|Git", "events,rsvps"],
    ],
    intermediate: [
      ["Job Board with Search and Applications", "Candidates and recruiters need to find each other; build listings, filters and an application pipeline.", "react,nodejs,db-design,auth", "TypeScript|React,Express|PostgreSQL|Docker", "users,jobs,applications"],
      ["Recipe Sharing Platform with Uploads", "Cooks want to share and discover recipes; support image uploads, tagging, ratings and full-text search.", "nextjs,rest,auth,db-design", "TypeScript|Next.js|MongoDB|Cloudinary,Vercel", "users,recipes,ratings"],
      ["Expense Splitting App", "Roommates struggle with shared costs; compute balances and settlement suggestions across groups.", "react,express,db-design,unit-testing", "JavaScript|React,Express|PostgreSQL|Docker", "users,groups,expenses"],
    ],
    advanced: [
      ["Collaborative Document Editor", "Teams co-edit documents; implement operational transforms or CRDTs with presence and history.", "react,typescript,scalability,distributed", "TypeScript|React,Node.js|PostgreSQL|Redis,WebSockets", "documents,revisions"],
      ["Multi-Vendor Marketplace with Payments", "Marketplaces split payments between sellers; build catalogues, escrow-style payouts and fraud checks.", "nextjs,microservices,auth,appsec", "TypeScript|Next.js,NestJS|PostgreSQL|Stripe,Docker", "vendors,orders,payouts"],
      ["Learning Platform with Video and Analytics", "Educators need engagement insight; stream video, track progress and expose analytics dashboards.", "react,nodejs,scalability,product-analytics", "TypeScript|React,Express|PostgreSQL|S3,CloudFront", "courses,lessons,progress"],
    ],
  },
  cloud: {
    basic: [
      ["Static Website on Object Storage with CDN", "Marketing sites need cheap global hosting; deploy a static site behind a CDN with HTTPS.", "aws,cloud-arch,networking,git", "HTML|||AWS S3,CloudFront"],
      ["Deploy a Web App on a Virtual Machine", "Move an app from a laptop to the cloud; provision a VM, secure SSH and serve it with a reverse proxy.", "aws,linux,networking,security-fundamentals", "Python|Flask||AWS EC2,Nginx"],
      ["Cloud Cost Alert Script", "Surprise bills hurt budgets; write automation that reports spend by tag and alerts on anomalies.", "python,aws,finops,bash", "Python|||AWS Cost Explorer,Lambda"],
    ],
    intermediate: [
      ["Three-Tier App in a Custom VPC", "Production apps need network isolation; build public/private subnets, a load balancer and a private database.", "aws,cloud-networking,iam,load-balancing", "Python|Flask|PostgreSQL|AWS VPC,ALB,RDS"],
      ["Serverless Image Processing Pipeline", "Image resizing should scale to zero; trigger functions from uploads and store results with metadata.", "serverless,aws,python,event-driven", "Python||DynamoDB|AWS Lambda,S3,SQS"],
      ["Infrastructure as Code Baseline", "Click-ops is not repeatable; define a reviewed, versioned cloud environment with Terraform and a CI plan/apply flow.", "terraform,aws,cicd,iam", "HCL|||Terraform,GitHub Actions"],
    ],
    advanced: [
      ["Multi-Region Active-Active Architecture", "Regional outages must not stop users; design global routing, data replication and failover with tested RTO/RPO.", "cloud-arch,scalability,cloud-networking,monitoring", "Python||DynamoDB|AWS Route 53,Terraform"],
      ["Cloud Landing Zone with Guardrails", "Dozens of teams need safe accounts; implement account vending, SCP guardrails and central logging.", "cloud-security,iam,terraform,grc", "HCL|||AWS Organizations,Terraform,Config"],
      ["FinOps Cost Optimisation Platform", "Cloud waste is invisible; ingest billing data, detect idle resources and propose right-sizing with savings estimates.", "finops,python,aws,visualization", "Python|Pandas|PostgreSQL|AWS CUR,Grafana"],
    ],
  },
  awsazure: {
    basic: [
      ["S3 Backup and Lifecycle Automation", "Backups are inconsistent; automate encrypted uploads with versioning and lifecycle rules.", "aws,bash,security-fundamentals,git", "Bash,Python|||AWS S3,CLI"],
      ["Azure Blob Photo Gallery", "Host and serve user photos cheaply; upload, list and share images with expiring SAS links.", "azure,rest,html,security-fundamentals", "JavaScript|Express||Azure Blob Storage"],
      ["Website on Azure App Service", "Deploy a web app with settings, custom domain and deployment slots.", "azure,cicd,git,networking", "Node.js||| Azure App Service,GitHub Actions"],
    ],
    intermediate: [
      ["REST API on Lambda, API Gateway and DynamoDB", "Teams want a no-server API; build CRUD endpoints with auth, throttling and per-route IAM.", "aws,serverless,rest,iam", "Python||DynamoDB|AWS Lambda,API Gateway,SAM", "items"],
      ["CI/CD to ECS Fargate", "Manual deploys cause outages; build a pipeline that builds, tests, scans and deploys a container with rollback.", "aws,docker,cicd,load-balancing", "Python|FastAPI||AWS ECS,CodePipeline,ECR"],
      ["Azure Functions Event Processor", "Process uploads and messages serverlessly; trigger functions from queues and persist results in Cosmos DB.", "azure,serverless,event-driven,db-design", "C#||Cosmos DB|Azure Functions,Service Bus"],
    ],
    advanced: [
      ["EKS Cluster with Autoscaling and IRSA", "Run production Kubernetes securely; provision EKS with pod-level IAM, HPA/cluster autoscaling and observability.", "aws,kubernetes,iam,terraform", "HCL,Go|||EKS,Terraform,Helm,Prometheus"],
      ["Azure Landing Zone with Policy and Sentinel", "Enterprises need governed subscriptions; implement management groups, Azure Policy and Sentinel detections.", "azure,cloud-security,grc,terraform", "HCL|||Azure Policy,Sentinel,Terraform"],
      ["Hybrid Connectivity with VPN and Transit Gateway", "On-prem systems must reach cloud workloads privately; build site-to-site VPN, routing and DNS across accounts.", "aws,cloud-networking,routing-switching,network-security", "HCL|||AWS Transit Gateway,Terraform,Wireshark"],
    ],
  },
  devops: {
    basic: [
      ["Dockerise a Web Application", "\"Works on my machine\" breaks teams; containerise an app with a small image and compose for its database.", "docker,linux,git,bash", "Python|Flask|PostgreSQL|Docker,Docker Compose"],
      ["GitHub Actions CI for a Test Suite", "Broken commits reach main; build CI that lints, tests and reports coverage on every pull request.", "cicd,git,unit-testing,build-tools", "JavaScript|||GitHub Actions,Jest"],
      ["Server Health-Check Automation", "Admins find outages late; write scripts that check services and alert via chat.", "bash,linux,monitoring,git", "Bash,Python|||cron,Slack webhooks"],
    ],
    intermediate: [
      ["Blue-Green Deployment Pipeline", "Deploys cause downtime; automate blue-green releases with smoke tests and instant rollback.", "cicd,docker,load-balancing,monitoring", "Python|Flask||GitHub Actions,Docker,Nginx"],
      ["Ansible-Provisioned Application Stack", "Hand-built servers drift; codify a full web stack with idempotent Ansible roles and tests.", "ansible,linux,security-fundamentals,git", "YAML|||Ansible,Molecule,Vagrant"],
      ["Prometheus and Grafana Monitoring Stack", "Teams lack visibility; instrument an app, define alerts and build dashboards for the golden signals.", "monitoring,observability,docker,linux", "Python|Flask||Prometheus,Grafana,Alertmanager"],
    ],
    advanced: [
      ["GitOps Platform with Argo CD and Helm", "Cluster state drifts from Git; implement declarative multi-environment delivery with policy checks.", "gitops,kubernetes,helm,cicd", "YAML|||Argo CD,Helm,Kubernetes,Kyverno"],
      ["Internal Developer Platform", "Developers wait days for environments; build self-service, templated environments with guardrails and cost tags.", "platform-eng,kubernetes,terraform,cicd", "Go,TypeScript|Backstage||Terraform,Kubernetes"],
      ["Chaos Engineering and SLO Dashboard", "Reliability claims are untested; define SLOs, inject failures and verify error-budget policies.", "sre-practices,observability,kubernetes,incident-mgmt", "Python|||Chaos Mesh,Prometheus,Grafana"],
    ],
  },
  ai: {
    basic: [
      ["Rule-Based FAQ Chatbot", "Support teams answer the same questions; build an intent-matching chatbot and measure its coverage.", "python,nlp,unit-testing,git", "Python|NLTK||Flask"],
      ["Review Sentiment Analyser", "Businesses need to triage feedback; classify reviews and visualise sentiment trends.", "python,nlp,pandas,visualization", "Python|scikit-learn,Pandas||Jupyter"],
      ["Image Classifier Web Demo", "Show how computer vision works; wrap a pretrained model in a simple upload-and-predict web page.", "python,cv,pytorch,rest", "Python|PyTorch,Flask||Docker"],
    ],
    intermediate: [
      ["Resume Screening Assistant with Embeddings", "Recruiters drown in resumes; rank candidates against job descriptions with transparent, auditable scoring.", "nlp,python,ai-ethics,rest", "Python|FastAPI,scikit-learn|PostgreSQL|Docker", "candidates,jobs,scores"],
      ["Course Recommendation Engine", "Learners do not know what to study next; recommend courses using collaborative and content-based filtering.", "recsys,python,statistics,pandas", "Python|Pandas,scikit-learn|PostgreSQL|Jupyter"],
      ["Voice Command Pipeline", "Hands-free control needs reliable intent handling; transcribe speech, classify intents and execute actions.", "speech,nlp,python,rest", "Python|FastAPI||Whisper,Docker"],
    ],
    advanced: [
      ["Multi-Agent Support Orchestrator", "Customer issues span systems; coordinate specialised AI agents with tools, memory and human hand-off.", "ai-agents,llm,prompt-eng,rest", "Python|LangChain,FastAPI|PostgreSQL|Redis,Docker"],
      ["Real-Time Fraud Decision Engine", "Fraud must be blocked in milliseconds; combine rules and models with latency budgets and feedback loops.", "ml,model-deploy,scalability,statistics", "Python|scikit-learn,FastAPI|Redis|Kafka,Docker"],
      ["Bias Audit and Fairness Dashboard", "Automated decisions can discriminate; measure group fairness metrics and document mitigations.", "ai-ethics,statistics,visualization,ml", "Python|Fairlearn,Pandas||Streamlit"],
    ],
  },
  ml: {
    basic: [
      ["House Price Predictor", "Buyers want fair estimates; train and evaluate regression models and explain the key drivers.", "python,ml,pandas,statistics", "Python|scikit-learn,Pandas||Jupyter"],
      ["Titanic Survival Classification Pipeline", "Learn the end-to-end workflow; clean data, engineer features, cross-validate and compare classifiers.", "python,ml,feature-eng,sklearn", "Python|scikit-learn||Jupyter"],
      ["Customer Segmentation with K-Means", "Marketing needs groups, not averages; cluster customers and describe each segment actionably.", "python,ml,visualization,statistics", "Python|scikit-learn,Matplotlib||Jupyter"],
    ],
    intermediate: [
      ["Churn Prediction with Feature Engineering", "Retention is cheaper than acquisition; predict churn, tune models and translate results into actions.", "ml,feature-eng,statistics,python", "Python|scikit-learn,XGBoost|PostgreSQL|MLflow"],
      ["Time-Series Demand Forecasting", "Stock-outs and overstock cost money; forecast demand with seasonal models and backtesting.", "time-series,python,statistics,ml", "Python|Prophet,statsmodels||Jupyter"],
      ["Model Serving API", "A notebook model helps nobody; wrap it in a validated, containerised, load-tested prediction API.", "model-deploy,python,rest,docker", "Python|FastAPI|| Docker,pytest,k6"],
    ],
    advanced: [
      ["End-to-End MLOps Pipeline", "Models rot without process; automate training, tracking, registry, deployment and monitoring.", "mlops,cicd,docker,model-deploy", "Python|MLflow,FastAPI||GitHub Actions,Kubernetes"],
      ["Feature Store and Online Inference", "Training/serving skew breaks models; build consistent offline and online features with low-latency lookup.", "mlops,feature-eng,scalability,dataeng", "Python|Feast|Redis|Kafka,Docker"],
      ["Hyperparameter Search Service", "Teams waste GPU time; build a service that schedules, tracks and compares experiments reproducibly.", "mlops,ml,distributed,python", "Python|Optuna,Ray|PostgreSQL|Docker,MLflow"],
    ],
  },
  dlgenai: {
    basic: [
      ["Neural Network from Scratch", "Frameworks hide the maths; implement forward and backward passes with NumPy and train on a small dataset.", "python,dl,mathematics,unit-testing", "Python|NumPy||Jupyter"],
      ["Handwritten Digit Recogniser", "Learn convolutional networks; train a CNN on MNIST and analyse its mistakes.", "dl,python,tensorflow,visualization", "Python|TensorFlow||Colab"],
      ["Prompt Engineering Playground", "Prompt quality varies; build a tool to compare prompts, record outputs and score them against criteria.", "prompt-eng,genai,llm,python", "Python|Streamlit||SQLite"],
    ],
    intermediate: [
      ["Fine-Tune a Transformer Classifier", "Generic models miss domain language; fine-tune a pretrained transformer and evaluate versus a baseline.", "nlp,dl,pytorch,ml", "Python|PyTorch,Hugging Face||Colab,MLflow"],
      ["RAG Question Answering over PDFs", "Staff cannot search long manuals; build retrieval-augmented answers with citations and evaluation.", "rag,llm,nlp,python", "Python|LangChain,FastAPI|PostgreSQL|Docker"],
      ["Safety Helmet Object Detection", "Sites need PPE compliance checks; train and evaluate a detector and report precision/recall.", "cv,dl,pytorch,model-deploy", "Python|PyTorch,OpenCV||Docker"],
    ],
    advanced: [
      ["LLM Gateway with Guardrails and Evals", "LLM apps leak data and drift; route requests, enforce guardrails and run regression evaluations.", "llm,genai,appsec,mlops", "Python|FastAPI|PostgreSQL|Redis,Prometheus"],
      ["Domain LLM Fine-Tuning with LoRA and Serving", "A general LLM is too costly and generic; fine-tune with LoRA, quantise and serve with measured latency.", "llm,dl,model-deploy,cuda", "Python|PyTorch,vLLM||Docker,GPU"],
      ["Image Generation Service with Job Queue", "GPU inference is expensive; queue, batch and meter diffusion jobs with fair scheduling.", "genai,model-deploy,message-queues,scalability", "Python|FastAPI|Redis|Celery,Docker"],
    ],
  },
  datascience: {
    basic: [
      ["Exploratory Analysis of a Public Dataset", "Raw data hides insight; clean, explore and communicate findings with reproducible notebooks.", "python,pandas,statistics,visualization", "Python|Pandas,Seaborn||Jupyter"],
      ["A/B Test Analysis Notebook", "Teams ship on hunches; analyse an experiment with confidence intervals and a decision memo.", "statistics,ab-testing,python,visualization", "Python|SciPy||Jupyter"],
      ["Hypothesis Testing Toolkit", "Choosing tests is confusing; build a toolkit that checks assumptions and recommends a valid test.", "statistics,python,unit-testing,technical-writing", "Python|SciPy||pytest"],
    ],
    intermediate: [
      ["Customer Lifetime Value Modelling", "Marketing budgets need targets; model purchase behaviour and value tiers with validation.", "statistics,ml,python,time-series", "Python|lifetimes,scikit-learn||Jupyter"],
      ["Predictive Maintenance from Sensor Data", "Unplanned downtime is costly; predict failures from multivariate sensor streams.", "ml,time-series,feature-eng,python", "Python|scikit-learn,Pandas||MLflow"],
      ["News Topic Modelling", "Editors cannot read everything; discover and track topics with NLP and interactive visuals.", "nlp,python,visualization,statistics", "Python|gensim,Plotly||Jupyter"],
    ],
    advanced: [
      ["Causal Inference for Marketing Uplift", "Correlation misleads spend; estimate treatment effects and uplift with proper identification.", "statistics,ab-testing,ml,research-methods", "Python|EconML||Jupyter"],
      ["Streaming Anomaly Detection", "Anomalies must be flagged live; implement detectors with drift handling and alert tuning.", "time-series,ml,scalability,statistics", "Python|River,Kafka||Docker,Grafana"],
      ["Bayesian Forecasting with Uncertainty", "Point forecasts hide risk; build probabilistic models and communicate intervals to decision makers.", "statistics,time-series,ml,storytelling", "Python|PyMC||Jupyter"],
    ],
  },
  analytics: {
    basic: [
      ["Sales Dashboard in Power BI or Excel", "Managers want one view of sales; model data, build KPIs and design a clear dashboard.", "excel,bi-tools,visualization,storytelling", "DAX,SQL||SQLite|Power BI,Excel"],
      ["SQL Analysis of an E-commerce Database", "Answer business questions with SQL; write and document queries for revenue, retention and top products.", "sql,query-opt,data-modeling,storytelling", "SQL||PostgreSQL|pgAdmin"],
      ["Survey Cleaning and Visual Report", "Messy survey data hides results; clean, recode and visualise it into an executive summary.", "excel,visualization,statistics,storytelling", "Python|Pandas||Jupyter"],
    ],
    intermediate: [
      ["Marketing Funnel and Cohort Analytics", "Growth teams need to see where users drop; build funnel and retention cohort analyses.", "product-analytics,sql,visualization,statistics", "SQL,Python||PostgreSQL|Metabase"],
      ["Executive KPI Dashboard with Automated Refresh", "Manual reports go stale; automate extracts and refresh with data-quality checks.", "bi-tools,etl,sql,data-governance", "SQL,Python||PostgreSQL|Power BI,Airflow"],
      ["Retail Market-Basket Analysis", "Merchandisers want bundles; mine association rules and quantify uplift.", "python,statistics,visualization,product-analytics", "Python|mlxtend,Pandas||Jupyter"],
    ],
    advanced: [
      ["Self-Service Analytics with a Semantic Layer", "Metrics differ by team; define governed metrics in dbt and expose them via BI with tests.", "analytics-eng,dwh,data-governance,sql", "SQL|dbt|Snowflake|Git,GitHub Actions"],
      ["Product Event Tracking Pipeline", "Analytics needs trustworthy events; design a tracking plan, collection, validation and modelling.", "product-analytics,dataeng,etl,data-governance", "Python,SQL||PostgreSQL|Kafka,dbt"],
      ["Forecast-Driven Inventory Dashboard", "Stock decisions need forecasts; combine demand models with interactive what-if planning.", "time-series,bi-tools,visualization,sql", "Python|Prophet,Streamlit|PostgreSQL|Docker"],
    ],
  },
  dataeng: {
    basic: [
      ["CSV-to-Database ETL Script", "Spreadsheets pile up; extract, validate and load CSV files into a relational database idempotently.", "python,sql,etl,unit-testing", "Python|Pandas|PostgreSQL|Git"],
      ["Daily Weather Data Collector", "Historic data is not stored; schedule API pulls and append to a clean dataset.", "python,etl,rest,bash", "Python||SQLite|cron"],
      ["Data Quality Checker", "Bad data breaks reports; build checks for nulls, ranges and duplicates with a readable report.", "python,data-governance,unit-testing,sql", "Python|Great Expectations||pytest"],
    ],
    intermediate: [
      ["Airflow-Orchestrated ETL Pipeline", "Manual jobs fail silently; orchestrate dependent tasks with retries, alerts and backfills.", "airflow,etl,python,sql", "Python|Airflow|PostgreSQL|Docker"],
      ["Retail Data Warehouse with Star Schema", "Operational tables are slow for analysis; model facts and dimensions and load them incrementally.", "dwh,data-modeling,sql,etl", "SQL||PostgreSQL|dbt"],
      ["Change Data Capture Sync", "Batch copies lag; stream database changes to a downstream store with ordering guarantees.", "dataeng,kafka,db-admin,event-driven", "Java,SQL||PostgreSQL|Debezium,Kafka"],
    ],
    advanced: [
      ["Streaming Pipeline with Kafka and Spark", "Dashboards must be near real time; process event streams with windowing and exactly-once output.", "kafka,spark,big-data,scalability", "Scala,Python|Spark||Kafka,Docker"],
      ["Lakehouse with Governance", "Data lakes become swamps; implement table formats, schema evolution, lineage and access control.", "big-data,data-governance,dwh,spark", "Python,SQL|Spark||Delta Lake,Airflow"],
      ["Data Contracts Platform", "Producers break consumers; enforce versioned data contracts with CI validation and alerts.", "data-governance,dataeng,cicd,api-design", "Python|||Schema Registry,GitHub Actions"],
    ],
  },
  security: {
    basic: [
      ["Password Strength and Breach Checker", "Weak passwords cause breaches; check entropy and k-anonymous breach exposure without storing passwords.", "python,security-fundamentals,cryptography,unit-testing", "Python|||pytest"],
      ["Suspicious Login Log Monitor", "Brute force goes unnoticed; parse auth logs and flag anomalies with thresholds.", "security-fundamentals,python,bash,soc-ops", "Python,Bash|||Linux"],
      ["Encrypted Notes App", "Sensitive notes need protection; implement client-side encryption with sound key handling.", "cryptography,web-security,javascript,auth", "JavaScript|Express|SQLite|Web Crypto"],
    ],
    intermediate: [
      ["SIEM Lab with Detection Rules", "Logs are useless without detections; collect logs centrally and write and test alert rules.", "siem,soc-ops,threat-intel,incident-response", "YAML|||Wazuh,Elastic,Sigma"],
      ["Web Vulnerability Scanner", "Teams ship OWASP Top 10 flaws; build a scanner for common issues and report remediation guidance.", "web-security,appsec,python,security-testing", "Python|Requests||OWASP ZAP,Docker"],
      ["Secrets Scanning and Management in CI", "Leaked keys are common; block secrets in commits and move them to a managed vault.", "devsecops,appsec,cicd,git", "YAML,Python|||GitHub Actions,Vault,gitleaks"],
    ],
    advanced: [
      ["Zero-Trust Access Architecture", "Perimeters fail; design identity-aware access with device posture, least privilege and continuous verification.", "network-security,iam,cloud-security,grc", "Python|||OpenZiti,Keycloak,Terraform"],
      ["Threat Hunting Platform with ATT&CK Mapping", "Alerts miss stealthy attackers; build hunts mapped to ATT&CK with measurable coverage.", "threat-intel,soc-ops,siem,python", "Python,SQL||Elasticsearch|Sigma,Jupyter"],
      ["Cloud Security Posture Tool", "Misconfigurations cause breaches; scan cloud accounts, score risk and open remediation tickets.", "cloud-security,python,iam,vuln-mgmt", "Python||PostgreSQL|AWS APIs,Docker"],
    ],
  },
  pentest: {
    basic: [
      ["Lab Network Reconnaissance Report", "Learn authorised recon; enumerate a lab network and document findings professionally.", "pentesting,networking,security-fundamentals,technical-writing", "Bash|||Nmap,Wireshark"],
      ["OWASP Juice Shop Walkthrough", "Practise web attacks legally; solve selected challenges and write remediation advice.", "web-security,pentesting,appsec,technical-writing", "JavaScript|||Burp Suite,Docker"],
      ["Password Auditing Lab", "Understand why weak hashes fail; audit sample hashes in a lab and recommend policies.", "cryptography,pentesting,security-fundamentals,linux", "Bash|||Hashcat,John the Ripper"],
    ],
    intermediate: [
      ["Active Directory Attack and Defence Lab", "AD is the enterprise crown jewel; build a lab, perform controlled attacks and write detections.", "pentesting,red-team,windows-server,soc-ops", "PowerShell|||BloodHound,Windows Server"],
      ["Web Application Pentest Report", "Findings must drive fixes; test a deliberately vulnerable app and deliver prioritised remediation.", "web-security,pentesting,appsec,technical-writing", "Python|||Burp Suite,sqlmap"],
      ["Wireless Security Assessment Lab", "Wi-Fi is often misconfigured; assess an isolated test network and propose hardening.", "wireless-security,pentesting,network-security,linux", "Bash|||Aircrack-ng,Kali"],
    ],
    advanced: [
      ["Red Team Engagement Simulation", "Organisations test detection end to end; plan and execute a lab engagement with rules of engagement and a debrief.", "red-team,pentesting,threat-intel,incident-response", "Python,PowerShell|||Cobalt Strike alternatives,Mythic"],
      ["Exploit Development Lab", "Understand memory corruption defensively; analyse and exploit a deliberately vulnerable lab binary and write mitigations.", "exploit-dev,reverse-engineering,c,os", "C,Python|||GDB,pwntools"],
      ["Malware Analysis Sandbox Pipeline", "Analysts need safe triage; automate static and dynamic analysis of samples in isolation.", "malware-analysis,reverse-engineering,python,forensics", "Python|||Cuckoo,Ghidra,Docker"],
    ],
  },
  networking: {
    basic: [
      ["Home Lab Design in Packet Tracer", "Small offices need reliable LANs; design addressing, switching and basic routing.", "networking,routing-switching,network-design,technical-writing", "||| Cisco Packet Tracer"],
      ["Subnetting and VLAN Plan", "Poor addressing blocks growth; plan VLSM subnets and VLANs with documentation.", "networking,network-design,routing-switching,technical-writing", "|||Packet Tracer,draw.io"],
      ["Python Network Scanner", "Admins need an inventory; scan hosts and ports and export results responsibly.", "networking,python,security-fundamentals,unit-testing", "Python|Scapy||Wireshark"],
    ],
    intermediate: [
      ["Campus Network with OSPF and VLANs", "Growing campuses need scalable routing; configure inter-VLAN routing, OSPF and redundancy.", "routing-switching,network-design,networking,network-security", "|||GNS3,Cisco IOS"],
      ["Site-to-Site VPN with Firewall Rules", "Branches need secure links; configure IPsec VPN and least-privilege firewall policy.", "network-security,networking,routing-switching,security-fundamentals", "|||pfSense,StrongSwan"],
      ["Network Monitoring with SNMP and Grafana", "Outages surprise operators; collect interface metrics and alert on thresholds.", "networking,monitoring,network-automation,linux", "Python|||SNMP,Prometheus,Grafana"],
    ],
    advanced: [
      ["Network Automation with Ansible and APIs", "Manual config drifts; automate config, validation and rollback across devices with CI.", "network-automation,python,cicd,routing-switching", "Python,YAML|Netmiko||Ansible,GitHub Actions"],
      ["Multi-Site BGP and SD-WAN Design", "Multi-site resilience needs policy routing; design BGP, failover and measurable SLAs.", "routing-switching,network-design,networking,cloud-networking", "|||FRRouting,GNS3"],
      ["Spine-Leaf Data Centre Fabric", "Modern data centres need predictable latency; build a spine-leaf fabric with EVPN-VXLAN overlays.", "network-design,routing-switching,network-automation,virtualization", "Python|||FRRouting,Containerlab"],
    ],
  },
  database: {
    basic: [
      ["Normalised Schema for a Clinic", "Patient data needs integrity; design a 3NF schema with constraints and sample queries.", "db-design,sql,data-modeling,technical-writing", "SQL||PostgreSQL|pgAdmin,dbdiagram", "patients,doctors,appointments"],
      ["SQL Query Practice Portfolio", "Prove SQL fluency; write and explain queries across joins, windows and subqueries.", "sql,query-opt,db-design,git", "SQL||PostgreSQL|pgAdmin"],
      ["Backup and Restore Automation", "Untested backups fail; automate dumps, rotation and restore verification.", "backup-recovery,bash,db-admin,linux", "Bash|| PostgreSQL|cron,pg_dump"],
    ],
    intermediate: [
      ["Query Performance Tuning Case Study", "Slow queries hurt users; diagnose with execution plans and fix with indexes and rewrites, measuring gains.", "query-opt,sql,db-admin,db-design", "SQL||PostgreSQL|EXPLAIN,pgbench"],
      ["PostgreSQL Replication and Failover", "Single servers are single failures; configure streaming replication and rehearse failover.", "db-admin,backup-recovery,linux,monitoring", "SQL||PostgreSQL|Patroni,Docker"],
      ["MongoDB Schema Design for a Social Feed", "Document models can be misused; model feeds, embed vs reference and measure query patterns.", "db-design,data-modeling,query-opt,nodejs", "JavaScript|Express|MongoDB|Compass", "users,posts,follows"],
    ],
    advanced: [
      ["Sharded Database with Zero-Downtime Migration", "Growth exceeds one node; shard data and migrate live traffic with verification and rollback.", "db-admin,scalability,distributed,backup-recovery", "SQL,Go||PostgreSQL,Citus|Docker"],
      ["Time-Series Storage Pipeline", "Metrics explode in volume; design ingestion, downsampling, retention and queries.", "db-design,dataeng,query-opt,observability", "SQL,Python||TimescaleDB|Grafana,Docker"],
      ["Graph Database Fraud Detector", "Fraud rings hide in relationships; model transactions as a graph and detect suspicious patterns.", "data-modeling,query-opt,python,ml", "Python|| Neo4j|Cypher,Docker"],
    ],
  },
  mobile: {
    basic: [
      ["Unit Converter Android App", "Users need quick conversions offline; build a clean Android app with input validation.", "android,kotlin,mobile-ui,git", "Kotlin|Jetpack Compose||Android Studio"],
      ["Flutter To-Do App", "Build a cross-platform task app with local persistence and simple state management.", "flutter,dart,mobile-ui,git", "Dart|Flutter|SQLite|Android Studio"],
      ["iOS Habit Tracker", "Habit apps need streak logic; build streak tracking and reminders with SwiftUI.", "ios,swift,swiftui,mobile-ui", "Swift|SwiftUI||Xcode", "habits,checkins"],
    ],
    intermediate: [
      ["Offline-First Notes App with Sync", "Connectivity is unreliable; keep a local store and sync with conflict handling.", "android,kotlin,db-design,rest", "Kotlin|Jetpack Compose|Room|Retrofit", "notes,syncs"],
      ["Fitness Tracker with Sensors and Charts", "Users want activity insights; read device sensors, store sessions and visualise progress.", "flutter,dart,mobile-ui,visualization", "Dart|Flutter|SQLite|Firebase", "workouts,sessions"],
      ["Cross-Platform Chat App", "Teams need messaging; implement real-time chat, push notifications and auth.", "react-native,javascript,auth,firebase", "JavaScript|React Native|Firestore|Firebase", "users,rooms,messages"],
    ],
    advanced: [
      ["Mobile Banking Client with Biometrics", "Financial apps are prime targets; implement secure storage, biometrics, certificate pinning and threat modelling.", "ios,appsec,cryptography,swiftui", "Swift|SwiftUI||Keychain,Xcode"],
      ["Real-Time Ride Tracking App", "Riders need live locations; stream GPS efficiently with battery and privacy constraints.", "android,kotlin,scalability,geospatial", "Kotlin|Jetpack Compose|Firestore|WebSockets,Maps SDK"],
      ["Mobile CI/CD and Release Pipeline", "Manual releases are risky; automate builds, tests, signing, staged rollout and crash analytics.", "cicd,android,ios,monitoring", "Kotlin,Swift|||Fastlane,GitHub Actions,Crashlytics"],
    ],
  },
  game: {
    basic: [
      ["2D Platformer Prototype", "Learn game loops and physics; build a playable level with collision, scoring and a menu.", "game-design,game-math,csharp,unity", "C#|Unity||Git"],
      ["Snake or Tetris in Python", "Understand the game loop; implement rules, input handling and a high-score file.", "python,game-design,oop,git", "Python|Pygame||Git"],
      ["Trivia Game with Persistent Scores", "Make a polished quiz game with progression and local persistence.", "game-design,csharp,unity,oop", "C#|Unity|SQLite|Git"],
    ],
    intermediate: [
      ["Top-Down Shooter with Enemy AI", "Enemies must feel intelligent; implement state-machine and pathfinding AI with tuning.", "game-ai,game-math,csharp,unity", "C#|Unity||Git"],
      ["Procedural Dungeon Generator", "Replayability needs variety; generate playable, validated levels with seeds.", "game-math,dsa,csharp,game-design", "C#|Unity||Git"],
      ["Multiplayer Card Game", "Players want matches online; implement lobby, turns and server-validated rules.", "multiplayer,game-design,nodejs,rest", "TypeScript|Node.js|Redis|WebSockets", "players,matches"],
    ],
    advanced: [
      ["Authoritative Multiplayer Server", "Cheating and lag ruin games; build a server with client prediction, reconciliation and lag compensation.", "multiplayer,game-math,scalability,cpp", "C++|||ENet,Docker"],
      ["Real-Time Rendering and Shader Demo", "Visual quality depends on the pipeline; implement lighting, shadow and post-processing shaders.", "graphics,shaders,cpp,game-math", "C++,GLSL|OpenGL||RenderDoc"],
      ["Behaviour-Tree AI for a Tactical Game", "Complex NPCs need maintainable AI; implement behaviour trees with utility scoring and debugging tools.", "game-ai,design-patterns,csharp,unity", "C#|Unity||Git"],
    ],
  },
  blockchain: {
    basic: [
      ["Simple Blockchain in Python", "Understand chains first-hand; implement blocks, hashing, proof of work and validation.", "blockchain-fundamentals,python,cryptography,unit-testing", "Python|||pytest"],
      ["ERC-20 Token on a Testnet", "Tokens power ecosystems; write, test and deploy a standard token and document its risks.", "smart-contracts,solidity,blockchain-fundamentals,git", "Solidity|Hardhat||Sepolia"],
      ["Wallet Balance Tracker", "Users want multi-address balances; read chain data and display holdings safely.", "web3,javascript,blockchain-fundamentals,rest", "JavaScript|ethers.js||Infura"],
    ],
    intermediate: [
      ["NFT Marketplace dApp", "Creators need to mint and sell; build contracts, metadata storage and a wallet-connected UI.", "smart-contracts,web3,solidity,react", "Solidity,TypeScript|Hardhat,React||IPFS"],
      ["DAO Voting dApp", "Communities need transparent decisions; implement proposals, snapshots and vote tallying.", "smart-contracts,solidity,web3,contract-security", "Solidity|Hardhat||OpenZeppelin"],
      ["Decentralised Crowdfunding Contract", "Backers fear fraud; implement milestone-based release and refunds with tests.", "smart-contracts,solidity,contract-security,unit-testing", "Solidity|Hardhat||Slither"],
    ],
    advanced: [
      ["AMM DEX with Security Review", "Liquidity needs automated pricing; implement a constant-product AMM and attack it with tests and fuzzing.", "defi,contract-security,solidity,smart-contracts", "Solidity|Foundry||Slither,Echidna"],
      ["Cross-Chain Bridge Simulation", "Bridges are frequent hack targets; simulate lock/mint flows and model failure and threat scenarios.", "contract-security,distributed,smart-contracts,cryptography", "Solidity,TypeScript|||Hardhat,Docker"],
      ["Zero-Knowledge Age Verification dApp", "Prove a fact without revealing data; build a ZK circuit and verifier integrated into a dApp.", "zk,cryptography,smart-contracts,web3", "Circom,Solidity|||snarkjs"],
    ],
  },
  embedded: {
    basic: [
      ["LED and Button Firmware", "Learn GPIO and debouncing; implement responsive input handling without blocking delays.", "embedded-fundamentals,c,electronics,microcontrollers", "C|||Arduino,PlatformIO"],
      ["Temperature Display with LCD", "Make data visible; read a sensor, filter noise and render to an LCD.", "embedded-fundamentals,electronics,sensors,c", "C|||Arduino,I2C"],
      ["UART Serial Data Logger", "Debugging needs observability; stream structured logs over UART and parse them on a PC.", "comm-protocols,c,python,microcontrollers", "C,Python|||PlatformIO,PySerial"],
    ],
    intermediate: [
      ["RTOS Multi-Task Sensor Hub", "Blocking loops miss deadlines; use tasks, queues and mutexes to meet timing requirements.", "rtos,c,comm-protocols,sensors", "C|FreeRTOS||STM32,Logic Analyser"],
      ["I2C/SPI Sensor Driver Library", "Reusable drivers speed projects; write a tested driver with a hardware abstraction layer.", "comm-protocols,c,unit-testing,microcontrollers", "C|||Unity test,PlatformIO"],
      ["Bootloader with Firmware Update", "Devices need safe updates; implement image verification and rollback.", "embedded-fundamentals,cryptography,c,microcontrollers", "C|||STM32,OpenOCD"],
    ],
    advanced: [
      ["Real-Time Motor Control with PID", "Precise motion needs control theory; implement and tune a PID loop with real-time guarantees.", "control-systems,rtos,c,dsp", "C|||STM32,MATLAB"],
      ["Embedded Linux Image with Yocto", "Products need minimal, reproducible OS images; build a custom image, drivers and OTA updates.", "embedded-linux,linux,build-tools,c", "C,Python|||Yocto,QEMU"],
      ["Low-Power Battery Node Optimisation", "Battery life decides product success; profile current and optimise sleep, radios and sampling.", "embedded-fundamentals,electronics,wireless-protocols,c", "C|||Nordic,Power Profiler"],
    ],
  },
  iot: {
    basic: [
      ["Smart Plant Watering System", "Plants die when forgotten; sense moisture, control a pump and log history.", "iot-fundamentals,sensors,electronics,microcontrollers", "C,Python|||ESP32,MQTT"],
      ["MQTT Temperature Publisher", "Learn pub/sub messaging; publish sensor readings and subscribe from a dashboard.", "mqtt,iot-fundamentals,python,sensors", "Python,C|||Mosquitto,ESP32"],
      ["Home Motion Alert", "Detect motion and notify reliably; handle debouncing and false positives.", "iot-fundamentals,sensors,wireless-protocols,python", "Python|||Raspberry Pi,PIR"],
    ],
    intermediate: [
      ["IoT Dashboard with MQTT and Time-Series DB", "Operators need live and historical views; ingest telemetry and build dashboards and alerts.", "mqtt,iot-fundamentals,monitoring,db-design", "Python|FastAPI|InfluxDB|Grafana,Docker"],
      ["Smart Energy Monitor", "Households want to cut bills; measure consumption, compute costs and detect anomalies.", "sensors,iot-fundamentals,visualization,python", "Python,C||InfluxDB|ESP32,Grafana"],
      ["OTA Firmware Update Service", "Field devices need patches; deliver signed updates with staged rollout.", "iot-security,mqtt,cryptography,rest", "Python,C|FastAPI||ESP32,S3"],
    ],
    advanced: [
      ["Device Fleet Platform with Digital Twins", "Thousands of devices need management; model device state, desired config and shadows at scale.", "digital-twins,iot-cloud,scalability,mqtt", "Python,TypeScript|||AWS IoT Core,DynamoDB"],
      ["Edge TinyML Anomaly Detection", "Sending raw data is costly; run anomaly detection on-device and report only events.", "tinyml,edge-computing,ml,embedded-fundamentals", "C,Python|TensorFlow Lite||Arduino Nano 33"],
      ["Secure Zero-Touch Device Provisioning", "Insecure onboarding compromises fleets; implement per-device identity, certificates and revocation.", "iot-security,cryptography,iot-cloud,network-security", "Python,C|||X.509,AWS IoT"],
    ],
  },
  robotics: {
    basic: [
      ["Line-Following Robot", "Learn closed-loop control; follow a track with sensors and tuned motor responses.", "sensors,control-systems,electronics,microcontrollers", "C|||Arduino"],
      ["Robot Arm Kinematics Simulator", "Understand reach and joint limits; implement forward and inverse kinematics with visualisation.", "kinematics,python,mathematics,visualization", "Python|NumPy,Matplotlib||Jupyter"],
      ["Ultrasonic Obstacle Avoidance", "Robots must not crash; implement filtering and avoidance behaviours.", "sensors,control-systems,c,electronics", "C|||Arduino,HC-SR04"],
    ],
    intermediate: [
      ["ROS 2 Navigation in Simulation", "Navigation needs mapping and planning; configure a robot model, costmaps and goals in simulation.", "ros,motion-planning,python,linux", "Python,C++|ROS 2||Gazebo,Nav2"],
      ["Vision-Guided Pick and Place", "Robots must find objects; detect, localise and grasp items using vision.", "cv,kinematics,python,ros", "Python|OpenCV,ROS 2||Gazebo"],
      ["SLAM Mapping Project", "Unknown spaces need maps; run SLAM and evaluate map quality and drift.", "slam,ros,sensors,python", "C++,Python|ROS 2||RViz,Gazebo"],
    ],
    advanced: [
      ["Autonomous Planning with Dynamic Obstacles", "Static plans fail around people; implement replanning with prediction and safety margins.", "motion-planning,autonomous,python,control-systems", "C++,Python|ROS 2||Gazebo"],
      ["Multi-Robot Fleet Coordination", "Fleets collide and idle; allocate tasks and deconflict paths across robots.", "autonomous,distributed,motion-planning,ros", "Python|ROS 2||Docker,Gazebo"],
      ["RL Control Policy with Sim-to-Real Analysis", "Learned controllers fail on hardware; train in simulation with domain randomisation and measure the gap.", "rl,control-systems,python,simulation", "Python|PyTorch,Gymnasium||MuJoCo"],
    ],
  },
  qa: {
    basic: [
      ["Manual Test Plan and Bug Report Suite", "Unclear testing misses defects; write test cases, execute them and file reproducible bug reports.", "qa-process,testing,technical-writing,git", "|||Jira,Excel"],
      ["Selenium Smoke Tests for a Web App", "Regressions hit core flows; automate smoke tests with stable locators and reporting.", "test-automation,testing,javascript,git", "JavaScript|Selenium||GitHub Actions"],
      ["Postman API Test Collection", "APIs break silently; build collections with assertions, environments and a Newman run.", "api-testing,rest,testing,git", "JavaScript|||Postman,Newman"],
    ],
    intermediate: [
      ["Playwright Automation Framework with CI", "Flaky tests destroy trust; design a page-object framework with parallel runs and reports.", "test-automation,cicd,typescript,testing", "TypeScript|Playwright||GitHub Actions,Allure"],
      ["API Contract Testing with Pact", "Services break each other; enforce consumer-driven contracts in CI.", "api-testing,microservices,testing,cicd", "JavaScript|Pact||GitHub Actions"],
      ["BDD Suite with Cucumber", "Requirements and tests diverge; express behaviour in Gherkin and automate it.", "bdd,test-automation,qa-process,testing", "Java|Cucumber||Maven,Selenium"],
    ],
    advanced: [
      ["Performance Testing Platform", "Capacity is guessed; script load, stress and soak tests with SLO-based pass/fail and reports.", "performance-testing,monitoring,scalability,cicd", "JavaScript|k6||Grafana,InfluxDB,Docker"],
      ["Mutation and Property-Based Testing Initiative", "High coverage can hide weak tests; measure test strength and find edge cases automatically.", "unit-testing,testing,qa-process,python", "Python|Hypothesis,mutmut||GitHub Actions"],
      ["Test Environment and Data Management", "Tests fail on bad data; provision ephemeral environments and seeded, masked data.", "testing,docker,security-testing,cicd", "Python|||Docker Compose,Terraform"],
    ],
  },
  sysadmin: {
    basic: [
      ["Linux Server Setup and Hardening", "Default servers are insecure; build and harden a server with users, SSH keys, firewall and updates.", "linux,sysadmin,security-fundamentals,bash", "Bash|||Ubuntu,UFW"],
      ["Automated Backup with Cron and Rsync", "Data loss is unforgivable; implement scheduled backups, rotation and restore tests.", "backup-recovery,bash,linux,sysadmin", "Bash|||cron,rsync"],
      ["User and Permission Management Scripts", "Manual accounts cause errors; automate onboarding/offboarding with audits.", "sysadmin,bash,linux,security-fundamentals", "Bash|||Linux"],
    ],
    intermediate: [
      ["Active Directory and Windows Server Lab", "Enterprises run on AD; build a domain with GPOs, DNS/DHCP and role-based delegation.", "windows-server,sysadmin,networking,security-fundamentals", "PowerShell|||Windows Server,Hyper-V"],
      ["Centralised Logging with ELK", "Logs scattered across hosts hide problems; ship, parse and alert centrally.", "monitoring,linux,sysadmin,observability", "|Elasticsearch,Kibana||Filebeat,Docker"],
      ["Configuration Management with Ansible", "Snowflake servers drift; define idempotent roles for a fleet and verify compliance.", "ansible,sysadmin,linux,git", "YAML|||Ansible"],
    ],
    advanced: [
      ["High-Availability Web Cluster", "Single servers fail; build a load-balanced cluster with health checks, failover and tested recovery.", "load-balancing,linux,sysadmin,monitoring", "Bash|Nginx||HAProxy,Keepalived"],
      ["Disaster Recovery Runbook and Drill", "Plans untested are plans failed; document RTO/RPO, automate recovery and run a measured drill.", "backup-recovery,incident-mgmt,sysadmin,itil", "Bash,Python|||Ansible,Terraform"],
      ["Patch and Compliance Automation", "Unpatched fleets get breached; automate patching windows, reporting and CIS benchmark checks.", "sysadmin,vuln-mgmt,ansible,grc", "Python,YAML|||Ansible,OpenSCAP"],
    ],
  },
  xr: {
    basic: [
      ["VR Room Walkthrough", "Learn spatial scale; build a navigable VR scene with comfort-friendly locomotion.", "xr-dev,unity,csharp,spatial-ux", "C#|Unity||Quest"],
      ["Marker-Based AR Info Overlay", "Posters should come alive; recognise markers and overlay information.", "xr-dev,arcore,spatial-ux,csharp", "C#|Unity,ARCore||Android"],
      ["WebXR Product Viewer", "Shoppers want to see products in space; render a 3D model in browser AR/VR.", "webxr,javascript,3d-modeling,html", "JavaScript|Three.js||Blender"],
    ],
    intermediate: [
      ["VR Training Simulator", "Training should be safe and measurable; implement interactions, scoring and session reports.", "xr-dev,spatial-ux,unity,csharp", "C#|Unity XR||Quest"],
      ["AR Indoor Navigation", "GPS fails indoors; anchor wayfinding with spatial mapping.", "arcore,spatial-computing,xr-dev,csharp", "C#|Unity,ARCore||Android"],
      ["Hand-Tracking Gesture Controls", "Controllers limit accessibility; build natural gesture interactions with feedback and fallback.", "xr-dev,spatial-ux,cv,csharp", "C#|Unity||Quest,MediaPipe"],
    ],
    advanced: [
      ["Multi-User Shared Spatial Experience", "Users need to collaborate in space; sync avatars and anchors with low latency.", "xr-dev,multiplayer,spatial-computing,scalability", "C#|Unity,Photon||Docker"],
      ["Photogrammetry to AR Pipeline", "Real objects need digital twins; reconstruct, optimise and deploy assets to AR.", "3d-modeling,graphics,xr-dev,python", "Python|||Meshroom,Blender"],
      ["XR Performance Optimisation Study", "Dropped frames cause nausea; profile and optimise rendering to hit frame budgets.", "graphics,shaders,xr-dev,game-math", "C#|Unity||RenderDoc,Profiler"],
    ],
  },
  distributed: {
    basic: [
      ["Socket Chat Server and Client", "Understand networked programs; implement concurrent connections and a simple protocol.", "networking,os,python,unit-testing", "Python|||sockets"],
      ["Replicated Counter Simulation", "Replicas diverge; simulate replication strategies and observe consistency anomalies.", "distributed,python,dsa,unit-testing", "Python|||pytest"],
      ["Consistent Hashing Visualiser", "Adding nodes reshuffles data; implement a hash ring and visualise key movement.", "distributed,dsa,python,visualization", "Python|Matplotlib||pytest"],
    ],
    intermediate: [
      ["Raft Leader Election Simulation", "Clusters need one leader; implement election, terms and failure scenarios.", "distributed,systemdesign,go,unit-testing", "Go|||Docker"],
      ["Message Queue from Scratch", "Understand brokers; implement topics, persistence, acknowledgements and retries.", "message-queues,distributed,go,unit-testing", "Go|||Docker"],
      ["Sharded Distributed Cache", "A single cache is a bottleneck; shard keys, handle node failure and measure hit rates.", "caching,distributed,scalability,go", "Go||Redis|Docker,k6"],
    ],
    advanced: [
      ["Replicated Key-Value Store with Raft", "Reliable storage tolerates failures; implement log replication, snapshots and linearisable reads.", "distributed,systemdesign,scalability,go", "Go|||Docker,Jepsen-style tests"],
      ["MapReduce-Style Batch Framework", "Large jobs need parallelism; schedule tasks, handle stragglers and recover from worker failure.", "distributed,big-data,go,scalability", "Go|||Docker"],
      ["Saga Orchestrator with Distributed Tracing", "Cross-service transactions fail midway; implement compensating actions and trace every step.", "microservices,event-driven,observability,distributed", "Java|Spring Boot|PostgreSQL|Kafka,Jaeger"],
    ],
  },
  design: {
    basic: [
      ["Architecture Decision Records for a Library App", "Decisions are forgotten; document context, options and consequences for key architecture choices.", "systemdesign,technical-writing,oop,git", "|||Markdown,draw.io"],
      ["UML and Component Design for a Hospital System", "Systems fail from unclear boundaries; produce use cases, class and component diagrams.", "oop,design-patterns,requirements,technical-writing", "|||PlantUML"],
      ["Monolith vs Microservices Comparison Study", "Teams cargo-cult microservices; compare approaches against concrete requirements.", "systemdesign,microservices,technical-writing,api-design", "|||draw.io"],
    ],
    intermediate: [
      ["URL Shortener Design with Prototype", "Design for scale before coding; estimate capacity, choose storage and prototype the critical path.", "systemdesign,scalability,db-design,api-design", "Python|FastAPI|Redis,PostgreSQL|Docker,k6"],
      ["Domain-Driven Design Model for Retail", "Models rot when language differs; run event storming and define bounded contexts and aggregates.", "ddd,systemdesign,event-driven,technical-writing", "|||Miro,PlantUML"],
      ["API-First Design with OpenAPI", "Contracts prevent integration pain; design an OpenAPI spec, mock it and generate clients.", "api-design,rest,technical-writing,unit-testing", "YAML,TypeScript|||OpenAPI,Prism"],
    ],
    advanced: [
      ["Global Video Streaming Architecture", "Streaming needs global scale; design ingest, encode, CDN, caching and failure handling with cost estimates.", "systemdesign,scalability,cloud-arch,distributed", "|||AWS,draw.io"],
      ["Enterprise Integration Blueprint", "Legacy systems resist change; design integration patterns, events and data ownership with migration steps.", "ent-arch,integration-patterns,event-driven,api-design", "|||ArchiMate,Kafka"],
      ["Resilience Review and Failure-Mode Analysis", "Systems fail in unexpected ways; analyse an architecture for failure modes and define mitigations and SLOs.", "systemdesign,sre-practices,scalability,risk-mgmt", "|||draw.io,Chaos tooling"],
    ],
  },
  gis: {
    basic: [
      ["Interactive Web Map", "Locations are easier on a map; build a web map with layers, popups and filtering.", "geospatial,javascript,html,visualization", "JavaScript|Leaflet||GeoJSON"],
      ["Geocoding and Distance Calculator", "Convert addresses to coordinates and compute distances correctly.", "geospatial,python,rest,unit-testing", "Python|||Nominatim"],
      ["Shapefile and GeoJSON Explorer", "Spatial files are opaque; write a tool to inspect, validate and reproject datasets.", "geospatial,python,data-modeling,visualization", "Python|GeoPandas||QGIS"],
    ],
    intermediate: [
      ["Spatial Analysis with PostGIS", "Answer 'what is near what'; model spatial data and write indexed spatial queries.", "geospatial,sql,query-opt,db-design", "SQL||PostgreSQL,PostGIS|QGIS"],
      ["Satellite NDVI Vegetation Analysis", "Monitor crops from space; compute vegetation indices and change over time.", "geospatial,python,visualization,statistics", "Python|rasterio||Sentinel Hub"],
      ["Delivery Route Optimisation", "Fuel and time are wasted; compute efficient multi-stop routes with constraints.", "geospatial,optimization,python,dsa", "Python|OR-Tools||OSRM"],
    ],
    advanced: [
      ["Real-Time Vehicle Tracking Pipeline", "Fleets need live positions; ingest GPS streams, geofence and compute ETAs at scale.", "geospatial,dataeng,scalability,event-driven", "Python,SQL||PostGIS|Kafka,Docker"],
      ["Flood Risk Prediction with Raster ML", "Floods need early warning; combine elevation, rainfall and imagery in a predictive model.", "geospatial,ml,python,simulation", "Python|PyTorch,rasterio||QGIS"],
      ["Vector Tile Server and Style Platform", "Slow maps lose users; generate, cache and serve vector tiles with styling.", "geospatial,scalability,caching,web-performance", "TypeScript,SQL||PostGIS|Docker,Mapbox GL"],
    ],
  },
  emerging: {
    basic: [
      ["Quantum Circuits with Qiskit", "Quantum computing is abstract; build and simulate basic circuits and explain results.", "quantum,python,mathematics,visualization", "Python|Qiskit||Jupyter"],
      ["Bioinformatics Sequence Toolkit", "Biologists need quick sequence insight; parse FASTA files and compute composition and alignments.", "bioinformatics,python,statistics,unit-testing", "Python|Biopython||Jupyter"],
      ["Digital Twin of a Simple System", "Models help prediction; simulate a physical system and compare with data.", "digital-twins,simulation,python,visualization", "Python|SimPy||Jupyter"],
    ],
    intermediate: [
      ["Grover Search Demonstration", "Show quantum speed-up conceptually; implement Grover on simulators and analyse scaling.", "quantum-algorithms,quantum,python,mathematics", "Python|Qiskit||Jupyter"],
      ["Genomic Variant Pipeline", "Variants must be called reproducibly; build a pipeline from reads to annotated variants.", "bioinformatics,python,bash,etl", "Python,Bash|||Nextflow,Docker"],
      ["Edge TinyML Gesture Classifier", "Gestures should work offline; train a tiny model and deploy it to a microcontroller.", "tinyml,ml,embedded-fundamentals,python", "Python,C|TensorFlow Lite||Arduino"],
    ],
    advanced: [
      ["Hybrid Quantum-Classical Optimiser", "Optimisation is costly; implement QAOA/VQE with a classical optimiser and benchmark against classical methods.", "quantum-algorithms,optimization,python,research-methods", "Python|Qiskit||Jupyter"],
      ["Autonomous Drone Mission Planner", "Missions need safe autonomy; plan routes with constraints, geofences and failsafes in simulation.", "autonomous,motion-planning,simulation,python", "Python|||PX4,Gazebo"],
      ["5G Network Slicing Simulator", "Different services need different guarantees; simulate slices, admission control and QoS.", "5g,networking,simulation,python", "Python|||ns-3"],
    ],
  },
};
