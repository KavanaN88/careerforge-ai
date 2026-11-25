// ============================================================================
// SKILL CATALOGUE — single source of truth for the onboarding skills picker.
//
// HOW TO EXTEND
//   1. Add one line to SKILL_DEFS:  def("id", "Display name", "kind", "search keywords", ["match aliases"])
//   2. Add the id to one or more categories in SKILL_CATEGORIES.
// A skill that appears in several categories (JavaScript, Docker, Git…) is defined ONCE, so it
// has one canonical id and can never be selected twice.
//
//   kind     : language | framework | library | database | platform | tool | concept
//              (shown in search results so languages are never confused with frameworks/tools)
//   keywords : extra words that make the skill findable / "related" (e.g. Spring Boot -> "java")
//   aliases  : names used elsewhere in SkillPilot (career skill names) so evidence matching
//              keeps working, e.g. "Amazon Web Services (AWS)" also counts as "AWS".
// ============================================================================

const SKILL_DEFS = {};
function def(id, name, kind, keywords = "", aliases = []) {
  SKILL_DEFS[id] = { id, name, kind, keywords, aliases };
}

// ---- Programming languages -------------------------------------------------
def("python", "Python", "language", "py scripting data", ["Python (Pandas)"]);
def("java", "Java", "language", "jvm oop");
def("javascript", "JavaScript", "language", "js ecmascript web node");
def("typescript", "TypeScript", "language", "ts javascript typed");
def("c", "C", "language", "systems embedded");
def("cpp", "C++", "language", "cplusplus systems oop");
def("csharp", "C#", "language", "csharp dotnet .net");
def("go", "Go (Golang)", "language", "golang");
def("rust", "Rust", "language", "systems memory safety");
def("php", "PHP", "language", "web server");
def("ruby", "Ruby", "language", "rails");
def("swift", "Swift", "language", "ios apple");
def("kotlin", "Kotlin", "language", "jvm java android");
def("dart", "Dart", "language", "flutter");
def("r", "R", "language", "statistics data");
def("matlab", "MATLAB", "language", "numerical engineering");
def("scala", "Scala", "language", "jvm java spark functional");
def("perl", "Perl", "language", "scripting");
def("lua", "Lua", "language", "scripting games");
def("haskell", "Haskell", "language", "functional");
def("objc", "Objective-C", "language", "ios apple");
def("elixir", "Elixir", "language", "functional erlang beam");
def("clojure", "Clojure", "language", "jvm java lisp functional");
def("fsharp", "F#", "language", "fsharp dotnet functional");
def("julia", "Julia", "language", "scientific numerical");
def("asm", "Assembly Language", "language", "assembly low level");
def("solidity", "Solidity", "language", "blockchain ethereum smart contracts");
def("fortran", "Fortran", "language", "scientific numerical");
def("cobol", "COBOL", "language", "legacy mainframe");
def("groovy", "Groovy", "language", "jvm java gradle jenkins");
def("vb", "Visual Basic", "language", "vb dotnet");
def("bash", "Bash", "language", "shell scripting linux");
def("powershell", "PowerShell", "language", "shell scripting windows");

// ---- Frontend --------------------------------------------------------------
def("html", "HTML", "language", "markup web html5");
def("css", "CSS", "language", "styling web css3");
def("react", "React.js", "framework", "react frontend ui javascript", ["React"]);
def("angular", "Angular", "framework", "frontend typescript google");
def("vue", "Vue.js", "framework", "vue frontend javascript");
def("nextjs", "Next.js", "framework", "react ssr javascript");
def("nuxt", "Nuxt.js", "framework", "vue ssr");
def("svelte", "Svelte", "framework", "frontend javascript");
def("sveltekit", "SvelteKit", "framework", "svelte ssr");
def("tailwind", "Tailwind CSS", "framework", "css utility styling");
def("bootstrap", "Bootstrap", "framework", "css ui responsive");
def("mui", "Material UI", "library", "mui react components");
def("threejs", "Three.js", "library", "3d webgl javascript");
def("webgl", "WebGL", "library", "3d graphics browser");
def("redux", "Redux", "library", "state react javascript");
def("vite", "Vite", "tool", "bundler build javascript");
def("webpack", "Webpack", "tool", "bundler build javascript");

// ---- Backend ---------------------------------------------------------------
def("nodejs", "Node.js", "platform", "node javascript runtime backend", ["Node.js"]);
def("express", "Express.js", "framework", "express node javascript backend");
def("nestjs", "NestJS", "framework", "nest node typescript backend");
def("django", "Django", "framework", "python backend web");
def("flask", "Flask", "framework", "python backend web");
def("fastapi", "FastAPI", "framework", "python backend api async");
def("springboot", "Spring Boot", "framework", "java spring backend jvm");
def("spring", "Spring Framework", "framework", "java spring backend jvm");
def("aspnet", "ASP.NET Core", "framework", "csharp dotnet backend microsoft");
def("laravel", "Laravel", "framework", "php backend");
def("rails", "Ruby on Rails", "framework", "ruby backend rails");
def("gin", "Go Gin", "framework", "go golang backend");
def("fiber", "Fiber", "framework", "go golang backend");
def("graphql", "GraphQL", "concept", "api query");
def("rest", "REST API", "concept", "restful http api web services", ["REST APIs"]);
def("grpc", "gRPC", "concept", "rpc protobuf api microservices");

// ---- Databases -------------------------------------------------------------
def("mysql", "MySQL", "database", "sql relational", ["SQL"]);
def("postgres", "PostgreSQL", "database", "postgres sql relational", ["SQL"]);
def("mongodb", "MongoDB", "database", "nosql document mongo");
def("oracledb", "Oracle Database", "database", "sql relational plsql", ["SQL"]);
def("mssql", "Microsoft SQL Server", "database", "sql relational t-sql sqlserver", ["SQL"]);
def("sqlite", "SQLite", "database", "sql embedded", ["SQL"]);
def("redis", "Redis", "database", "cache nosql in-memory");
def("firestore", "Firebase Firestore", "database", "firebase nosql google");
def("cassandra", "Cassandra", "database", "nosql wide column");
def("dynamodb", "DynamoDB", "database", "nosql aws");
def("neo4j", "Neo4j", "database", "graph database");
def("mariadb", "MariaDB", "database", "sql relational mysql", ["SQL"]);
def("elasticsearch", "Elasticsearch", "database", "search elk lucene");
def("supabase", "Supabase", "platform", "postgres backend firebase alternative");
def("influxdb", "InfluxDB", "database", "time series");

// ---- Cloud -----------------------------------------------------------------
def("aws", "Amazon Web Services (AWS)", "platform", "aws amazon ec2 s3 lambda cloud", ["AWS"]);
def("azure", "Microsoft Azure", "platform", "azure microsoft cloud");
def("gcp", "Google Cloud Platform (GCP)", "platform", "gcp google cloud");
def("oci", "Oracle Cloud Infrastructure (OCI)", "platform", "oci oracle cloud");
def("ibmcloud", "IBM Cloud", "platform", "ibm cloud");
def("digitalocean", "DigitalOcean", "platform", "droplets cloud vps");
def("cloudflare", "Cloudflare", "platform", "cdn dns edge workers");
def("vercel", "Vercel", "platform", "hosting deploy nextjs");
def("netlify", "Netlify", "platform", "hosting deploy jamstack");

// ---- DevOps ----------------------------------------------------------------
def("linux", "Linux", "platform", "unix os ubuntu", ["Linux"]);
def("docker", "Docker", "tool", "containers containerization", ["Docker"]);
def("kubernetes", "Kubernetes", "tool", "k8s containers orchestration", ["Kubernetes"]);
def("jenkins", "Jenkins", "tool", "ci cd pipeline java", ["CI/CD"]);
def("git", "Git", "tool", "version control vcs", ["Git"]);
def("github", "GitHub", "platform", "git version control hosting");
def("gitlab", "GitLab", "platform", "git version control ci");
def("ghactions", "GitHub Actions", "tool", "ci cd automation workflows", ["CI/CD"]);
def("terraform", "Terraform", "tool", "iac infrastructure hashicorp", ["Terraform"]);
def("ansible", "Ansible", "tool", "automation configuration management");
def("prometheus", "Prometheus", "tool", "metrics observability", ["Monitoring"]);
def("grafana", "Grafana", "tool", "dashboards observability", ["Monitoring"]);
def("nginx", "Nginx", "tool", "web server proxy load balancer");
def("apache", "Apache", "tool", "web server httpd");
def("helm", "Helm", "tool", "kubernetes charts");
def("cicd", "CI/CD", "concept", "continuous integration delivery deployment pipeline", ["CI/CD"]);
def("iac", "Infrastructure as Code", "concept", "iac terraform provisioning", ["Terraform"]);
def("virtualization", "Virtualization", "concept", "vm vmware hypervisor virtualbox");
def("shellscripting", "Shell Scripting", "concept", "bash scripting automation linux");

// ---- AI / ML ---------------------------------------------------------------
def("ml", "Machine Learning", "concept", "ml models training", ["Machine Learning"]);
def("dl", "Deep Learning", "concept", "neural networks", ["Deep Learning"]);
def("ai", "Artificial Intelligence", "concept", "ai");
def("genai", "Generative AI", "concept", "genai llm gpt diffusion");
def("nlp", "Natural Language Processing (NLP)", "concept", "nlp text language");
def("cv", "Computer Vision", "concept", "cv image vision");
def("tensorflow", "TensorFlow", "library", "tf deep learning python google");
def("pytorch", "PyTorch", "library", "torch deep learning python");
def("sklearn", "Scikit-learn", "library", "sklearn machine learning python");
def("keras", "Keras", "library", "deep learning python tensorflow");
def("opencv", "OpenCV", "library", "computer vision image python cpp");
def("huggingface", "Hugging Face", "platform", "transformers models nlp");
def("langchain", "LangChain", "framework", "llm agents python");
def("llm", "LLM Development", "concept", "large language models prompt engineering");
def("rag", "RAG", "concept", "retrieval augmented generation vector llm");
def("datascience", "Data Science", "concept", "statistics analysis python");
def("analytics", "Data Analytics", "concept", "analysis bi insights");
def("pandas", "Pandas", "library", "python dataframe data", ["Python (Pandas)"]);
def("numpy", "NumPy", "library", "python arrays numerical");
def("matplotlib", "Matplotlib", "library", "python plotting charts", ["Data Visualization"]);
def("jupyter", "Jupyter Notebook", "tool", "notebook python ipynb data");

// ---- Mobile ----------------------------------------------------------------
def("android", "Android Development", "concept", "android mobile java kotlin");
def("ios", "iOS Development", "concept", "ios mobile apple swift");
def("flutter", "Flutter", "framework", "dart mobile cross-platform");
def("reactnative", "React Native", "framework", "react mobile javascript cross-platform");
def("androidstudio", "Android Studio", "tool", "android ide java kotlin");
def("kmp", "Kotlin Multiplatform", "framework", "kotlin mobile cross-platform kmm");
def("compose", "Jetpack Compose", "framework", "android kotlin ui");
def("swiftui", "SwiftUI", "framework", "ios swift apple ui");
def("ionic", "Ionic", "framework", "hybrid mobile angular");
def("maui", "Xamarin / .NET MAUI", "framework", "xamarin maui dotnet csharp mobile");

// ---- Cybersecurity ---------------------------------------------------------
def("netsec", "Network Security", "concept", "firewall networking", ["Security Fundamentals", "Networking"]);
def("ethhack", "Ethical Hacking", "concept", "hacking red team", ["Security Fundamentals"]);
def("pentest", "Penetration Testing", "concept", "pentest security testing", ["Penetration Testing"]);
def("crypto", "Cryptography", "concept", "encryption hashing", ["Cryptography"]);
def("owasp", "OWASP", "concept", "web security top 10", ["Security Fundamentals"]);
def("burp", "Burp Suite", "tool", "web security proxy pentest");
def("wireshark", "Wireshark", "tool", "packet analysis network", ["Networking"]);
def("kali", "Kali Linux", "platform", "pentest security linux");
def("siem", "SIEM", "concept", "splunk logs soc security monitoring");
def("vulnassess", "Vulnerability Assessment", "concept", "vulnerability scanning security", ["Security Fundamentals"]);
def("secops", "Security Operations", "concept", "soc incident response", ["Incident Response"]);

// ---- CS fundamentals -------------------------------------------------------
def("dsa", "Data Structures and Algorithms", "concept", "dsa algorithms", ["Data Structures & Algorithms"]);
def("oop", "Object-Oriented Programming", "concept", "oop classes java cpp");
def("dbms", "Database Management Systems", "concept", "dbms sql databases", ["SQL"]);
def("os", "Operating Systems", "concept", "os processes memory kernel");
def("networks", "Computer Networks", "concept", "networking tcp ip http", ["Networking"]);
def("swe", "Software Engineering", "concept", "sdlc agile engineering");
def("sysdesign", "System Design", "concept", "architecture scalability", ["System Design"]);
def("patterns", "Design Patterns", "concept", "gof oop architecture");
def("distributed", "Distributed Systems", "concept", "consensus scalability");
def("microservices", "Microservices", "concept", "architecture services api");
def("testing", "Software Testing", "concept", "qa unit tests jest pytest", ["Testing"]);
def("problemsolving", "Problem Solving", "concept", "coding leetcode logic");

// ---- Dev tools -------------------------------------------------------------
def("vscode", "Visual Studio Code", "tool", "vs code editor ide");
def("intellij", "IntelliJ IDEA", "tool", "jetbrains ide java");
def("eclipse", "Eclipse", "tool", "ide java");
def("pycharm", "PyCharm", "tool", "jetbrains ide python");
def("postman", "Postman", "tool", "api testing rest");
def("figma", "Figma", "tool", "design ui ux prototype");
def("jira", "Jira", "tool", "agile project atlassian tickets");
def("terminal", "Linux Terminal", "tool", "cli command line shell bash");
def("visualstudio", "Visual Studio", "tool", "ide microsoft csharp dotnet");

// ---- Categories (display order; defaultOpen controls initial accordion state) -----
const SKILL_CATEGORIES = [
  { id: "languages", name: "Programming Languages", icon: "code", defaultOpen: true,
    description: "Languages you can write real programs in",
    skills: ["python","java","javascript","typescript","c","cpp","csharp","go","rust","php","ruby","swift","kotlin","dart","r","matlab","scala","perl","lua","haskell","objc","elixir","clojure","fsharp","julia","asm","solidity","fortran","cobol","groovy","vb","bash","powershell"] },
  { id: "frontend", name: "Frontend Development", icon: "grid",
    description: "Frameworks, libraries and tooling for the browser",
    skills: ["html","css","javascript","typescript","react","angular","vue","nextjs","nuxt","svelte","sveltekit","tailwind","bootstrap","mui","threejs","webgl","redux","vite","webpack"] },
  { id: "backend", name: "Backend Development", icon: "layers",
    description: "Server-side frameworks and API styles",
    skills: ["nodejs","express","nestjs","django","flask","fastapi","springboot","spring","aspnet","laravel","rails","gin","fiber","graphql","rest","grpc"] },
  { id: "databases", name: "Database Technologies", icon: "bar-chart-3",
    description: "Relational, NoSQL, cache and search stores",
    skills: ["mysql","postgres","mongodb","oracledb","mssql","sqlite","redis","firestore","cassandra","dynamodb","neo4j","mariadb","elasticsearch","supabase","influxdb"] },
  { id: "cloud", name: "Cloud Computing", icon: "cloud",
    description: "Cloud providers and hosting platforms",
    skills: ["aws","azure","gcp","oci","ibmcloud","digitalocean","cloudflare","vercel","netlify"] },
  { id: "devops", name: "DevOps & Infrastructure", icon: "settings",
    description: "Containers, CI/CD, automation and observability",
    skills: ["linux","docker","kubernetes","jenkins","git","github","gitlab","ghactions","terraform","ansible","prometheus","grafana","nginx","apache","helm","cicd","iac","virtualization","shellscripting"] },
  { id: "ai", name: "AI & Machine Learning", icon: "brain-circuit",
    description: "Concepts, libraries and data tooling",
    skills: ["ml","dl","ai","genai","nlp","cv","tensorflow","pytorch","sklearn","keras","opencv","huggingface","langchain","llm","rag","datascience","analytics","pandas","numpy","matplotlib","jupyter"] },
  { id: "mobile", name: "Mobile App Development", icon: "zap",
    description: "Native and cross-platform mobile",
    skills: ["android","ios","flutter","reactnative","androidstudio","kmp","compose","swiftui","ionic","maui"] },
  { id: "security", name: "Cybersecurity", icon: "shield",
    description: "Defensive and offensive security skills",
    skills: ["netsec","ethhack","pentest","crypto","owasp","burp","wireshark","kali","siem","vulnassess","secops"] },
  { id: "cs", name: "Software Engineering & CS Fundamentals", icon: "git-branch",
    description: "Core computer-science and engineering knowledge",
    skills: ["dsa","oop","dbms","os","networks","swe","sysdesign","patterns","distributed","microservices","testing","problemsolving"] },
  { id: "tools", name: "Development Tools", icon: "briefcase",
    description: "Editors, IDEs and collaboration tools",
    skills: ["vscode","intellij","eclipse","pycharm","github","gitlab","postman","figma","jira","terminal","jupyter","androidstudio","visualstudio"] },
];

const SKILL_KIND_LABEL = { language: "Language", framework: "Framework", library: "Library", database: "Database",
  platform: "Platform", tool: "Tool", concept: "Concept" };

// ---- Derived lookups ---------------------------------------------------------
const SKILL_CATS_BY_ID = {};      // skill id -> [category, ...]
SKILL_CATEGORIES.forEach(c => c.skills.forEach(id => {
  if (!SKILL_DEFS[id]) { console.warn("skillCatalog: unknown skill id", id, "in", c.id); return; }
  (SKILL_CATS_BY_ID[id] = SKILL_CATS_BY_ID[id] || []).push(c);
}));

function normSkill(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }

const SKILL_ID_BY_NAME = {};      // normalized name / alias -> canonical id (names win over aliases)
Object.values(SKILL_DEFS).forEach(d => { SKILL_ID_BY_NAME[normSkill(d.name)] = d.id; });
const _aliasOwners = {};
Object.values(SKILL_DEFS).forEach(d => d.aliases.forEach(a => { (_aliasOwners[normSkill(a)] = _aliasOwners[normSkill(a)] || []).push(d.id); }));
Object.keys(_aliasOwners).forEach(k => {   // only unambiguous aliases may resolve a name to an id (e.g. "SQL" stays a custom skill)
  if (_aliasOwners[k].length === 1 && !(k in SKILL_ID_BY_NAME)) SKILL_ID_BY_NAME[k] = _aliasOwners[k][0];
});
// Friendly shorthands for legacy saved profiles ("React", "Java"…) and typed text.
Object.assign(SKILL_ID_BY_NAME, { "react": "react", "aws": "aws", "golang": "go", "c++": "cpp", "node": "nodejs",
  "k8s": "kubernetes", "js": "javascript", "ts": "typescript" });

// Primary category = first category that lists the skill (used for the stored selection record).
function skillPrimaryCategory(id) { const c = SKILL_CATS_BY_ID[id]; return c ? c[0] : null; }

// name -> selection record {id,name,category}; unknown names become custom skills (kept, never dropped).
function selectionFromName(name) {
  const id = SKILL_ID_BY_NAME[normSkill(name)];
  if (id) { const d = SKILL_DEFS[id]; const c = skillPrimaryCategory(id);
    return { id, name: d.name, category: c ? c.id : "other" }; }
  return { id: "custom:" + normSkill(name), name: String(name).trim(), category: "other" };
}
function selectionFromId(id) { return selectionFromName(SKILL_DEFS[id] ? SKILL_DEFS[id].name : id); }

// Dedupe a list of names/records into unique selection records, preserving order.
function dedupeSelections(list) {
  const seen = {}; const out = [];
  (list || []).forEach(x => {
    const r = typeof x === "string" ? selectionFromName(x) : selectionFromName(x.name);
    if (!r.name || seen[r.id]) return; seen[r.id] = 1; out.push(r);
  });
  return out;
}

// Every name a selected skill should count as for evidence matching (display name + aliases), lowercased.
function claimedNameSet(names) {
  const set = {};
  (names || []).forEach(n => {
    set[normSkill(n)] = 1;
    const id = SKILL_ID_BY_NAME[normSkill(n)];
    if (id) { set[normSkill(SKILL_DEFS[id].name)] = 1; SKILL_DEFS[id].aliases.forEach(a => { set[normSkill(a)] = 1; }); }
  });
  return set;
}

// Search: returns { direct: [ids], related: [ids] }. direct = name matches; related = keyword matches only.
function searchSkills(query) {
  const q = normSkill(query);
  if (!q) return { direct: [], related: [] };
  const direct = [], related = [];
  Object.values(SKILL_DEFS).forEach(d => {
    const n = normSkill(d.name);
    let score = 0;
    if (n === q) score = 100;
    else if (n.startsWith(q)) score = 80;
    else if (n.split(/[\s\/\-\(\)\.]+/).some(w => w.startsWith(q))) score = 60;
    else if (n.includes(q)) score = 40;
    if (score) { direct.push({ id: d.id, score }); return; }
    const kw = (" " + d.keywords + " ").toLowerCase();
    const cats = (SKILL_CATS_BY_ID[d.id] || []).map(c => normSkill(c.name)).join(" ");
    if (kw.includes(" " + q) || cats.includes(q)) related.push({ id: d.id, score: kw.includes(" " + q + " ") ? 2 : 1 });
  });
  const byScore = (a, b) => b.score - a.score || SKILL_DEFS[a.id].name.localeCompare(SKILL_DEFS[b.id].name);
  return { direct: direct.sort(byScore).map(x => x.id), related: related.sort(byScore).map(x => x.id) };
}
