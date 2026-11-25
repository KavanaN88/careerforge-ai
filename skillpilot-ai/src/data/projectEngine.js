// ============================================================================
// PROJECT ENGINE (isomorphic: runs in the browser and in Node).
//   ProjectCatalogueService      PROJECTS, filterProjects, projectRoles
//   ProjectGenerationService     projectWorkspace (phases, tasks, diagrams, schema, API, checklists)
//   ProjectRecommendationService recommendProjects
//   ProjectProgressService       projectProgress, projectStatus, sanitizeProjectState
//   GitHubEvidenceService        parseRepoUrl, fetchRepoEvidence
//   ProjectEvaluationService     evaluateSubmission, evaluateEvidenceOnly, verificationDecision
//   SkillVerificationService     projectEvidenceSkills
//   AI Project Mentor            projectMentorReply (rule-based, teaches rather than generates)
// ============================================================================
const PJ_LEVELS = ["basic", "intermediate", "advanced"];
const PJ_LEVEL_LABEL = { basic: "Basic", intermediate: "Intermediate", advanced: "Advanced" };
const PJ_LEVEL_CFG = {
  basic: { dur: "1–2 weeks", hours: 15, base: 2, minCommits: 5, weeks: 1.5 },
  intermediate: { dur: "3–4 weeks", hours: 40, base: 5, minCommits: 12, weeks: 3.5 },
  advanced: { dur: "6–8 weeks", hours: 90, base: 8, minCommits: 25, weeks: 7 },
};
const pjSkillName = (id) => (typeof SKILL_LIB !== "undefined" && SKILL_LIB[id]?.name) || id;
const pjSplit = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean);
const pjSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ------------------------------- families ----------------------------------
const PJ_FAMILIES = {
  app: {
    noun: "application",
    layers: [["Users", "Browser / client UI"], ["Application", "{fw} API layer", "Business logic"], ["Data", "{db}", "Cache (optional)"], ["Delivery", "CI pipeline", "Hosting"]],
    build: [["Implement the core domain logic first", "Write the pure logic (rules, calculations, validation) with no UI or database attached, so it can be tested in isolation.", "What are the 3 most important rules of this system? Can you test each without starting a server?"],
      ["Expose the logic through an interface", "Add the interface users touch (CLI, HTTP API or UI). Keep it thin: parse input, call the core, format output.", "Which layer should validate input, and which should trust it?"],
      ["Handle errors and edge cases deliberately", "List failure modes (empty input, duplicates, timeouts) and decide the behaviour and message for each.", "What happens when the dependency you call is down?"]],
    test: ["Unit tests cover the core rules", "Main user flow tested end to end", "Invalid input returns clear errors", "Tests run with one command"],
    deploy: ["App starts from a clean checkout using documented steps", "Configuration comes from environment variables", "Build/run is reproducible (lockfile, container or script)", "A running demo, screenshot set or recording exists"],
    secure: ["Validate and sanitise all external input", "Keep secrets out of the repository"],
    skeleton: ["README.md", "src/            # application code (core / interface / data separated)", "tests/          # unit + integration tests", "docs/           # architecture notes, screenshots", ".github/workflows/ci.yml"],
  },
  backend: {
    noun: "service",
    layers: [["Clients", "API consumers", "Load generator"], ["Nodes", "{fw} service instances", "Request handling"], ["Coordination", "Replication / queue", "Consensus or idempotency"], ["Storage", "{db}", "Durable log"], ["Operations", "Metrics & logs", "CI/CD"]],
    build: [["Define the contract first", "Specify the API or protocol (endpoints/messages, error codes, ordering and delivery guarantees) before writing handlers.", "What does a client see if the same request is sent twice?"],
      ["Implement the happy path across components", "Build the smallest end-to-end path through all components, then add failure handling.", "Which component is the single point of failure?"],
      ["Inject failures on purpose", "Kill nodes, delay messages and drop connections; record what the system does and fix violations of your stated guarantees.", "Which guarantee did you promise and how would you prove it?"]],
    test: ["Unit tests cover state transitions", "Integration test runs several components together", "Failure scenario (node crash / timeout) is tested", "Idempotency or ordering guarantee is asserted"],
    deploy: ["Services start together with one command (compose/script)", "Configuration is externalised", "Health endpoints exist", "Logs/metrics make failures visible"],
    secure: ["Authenticate service-to-service or client calls", "Limit payload sizes and rate"],
    skeleton: ["README.md", "cmd/ or src/    # service entry points", "internal/       # core logic", "tests/          # unit, integration, failure tests", "deploy/         # compose / manifests", "docs/           # design + guarantees"],
  },
  data: {
    noun: "data pipeline",
    layers: [["Sources", "Files / APIs / DB"], ["Ingest", "Extract & validate"], ["Transform", "{lang} / SQL transforms", "Quality checks"], ["Store", "{db}"], ["Serve", "Dashboards / reports / queries"]],
    build: [["Profile the raw data", "Inspect sizes, types, nulls, duplicates and outliers before designing anything; write down what you found.", "What would silently break your results if 5% of rows were wrong?"],
      ["Build the transformation step by step", "Implement each transform as a small, named, testable function or SQL model. Keep raw data immutable.", "Is your pipeline safe to re-run (idempotent)?"],
      ["Add data-quality checks and a result you can defend", "Add assertions (row counts, ranges, keys). Produce the final table, model or chart and explain what decision it supports.", "Which metric proves the result is trustworthy?"]],
    test: ["Transform functions unit tested with small fixtures", "Data-quality checks fail loudly on bad data", "Pipeline re-run does not duplicate data", "Results reproducible from a clean checkout"],
    deploy: ["One command or schedule runs the pipeline", "Credentials/config outside the code", "Outputs written to a documented location", "Report/dashboard screenshots or link available"],
    secure: ["Mask or exclude personal data", "Least-privilege credentials for sources"],
    skeleton: ["README.md", "data/raw/        # never edited by hand", "notebooks/       # exploration", "src/             # pipeline code", "sql/ or models/  # transformations", "tests/           # fixtures + checks", "docs/"],
  },
  ml: {
    noun: "ML system",
    layers: [["Data", "Datasets", "Validation"], ["Features", "Feature engineering"], ["Training", "{fw} experiments", "Tracking"], ["Evaluation", "Metrics & error analysis", "Baseline comparison"], ["Serving", "API / batch scoring"], ["Monitoring", "Drift & quality"]],
    build: [["Set a baseline and a metric before modelling", "Choose the evaluation metric tied to the real-world cost, and build a trivial baseline to beat.", "What does a wrong prediction cost, and which error is worse?"],
      ["Train, compare and tune with a clean split", "Use train/validation/test splits (or time-aware splits). Track every experiment and parameter.", "How do you know there is no data leakage?"],
      ["Analyse errors, then package the best model", "Inspect worst predictions, document limitations, and expose the model in a reproducible way.", "For which inputs should this model refuse to answer?"]],
    test: ["Data validation tests (schema, ranges)", "Model beats the baseline on held-out data", "Inference function unit-tested with fixed inputs", "Serving path tested with valid and invalid requests"],
    deploy: ["Environment pinned (requirements/Docker)", "Model artefact versioned", "Prediction endpoint or notebook demo runnable", "Model card documents data, metrics and limits"],
    secure: ["Check training data for personal data and bias", "Validate prediction inputs"],
    skeleton: ["README.md  # includes model card", "data/            # or download script", "notebooks/", "src/features.py  src/train.py  src/predict.py", "tests/", "Dockerfile  (for serving)", "docs/"],
  },
  infra: {
    noun: "infrastructure",
    layers: [["Developer", "Git repository", "Pull request"], ["Pipeline", "CI/CD", "Policy & security checks"], ["Definition", "Infrastructure as code", "Config management"], ["Runtime", "{db}", "Cloud / servers / containers"], ["Operations", "Monitoring & alerts", "Backups & cost"]],
    build: [["Define the target environment on paper first", "List components, network boundaries, identities and failure domains, and what each one costs.", "What is the blast radius if one component or credential is compromised?"],
      ["Build it as code, repeatably", "Provision and configure with versioned code or scripts. You should be able to destroy and recreate it.", "Could a teammate recreate this from the repo alone?"],
      ["Verify, break and recover", "Prove it works (smoke tests), then simulate a failure and document recovery steps and time.", "How long does recovery take and how do you know?"]],
    test: ["Configuration validated/linted before apply", "Smoke test proves the service responds", "Failure or rollback rehearsed and documented", "Least-privilege access verified"],
    deploy: ["Environment created from code with documented commands", "State/secrets stored securely", "Cleanup/teardown documented to avoid cost", "Monitoring or alerting visible"],
    secure: ["Apply least-privilege IAM / permissions", "Encrypt data in transit and at rest; scan config"],
    skeleton: ["README.md", "infra/ or terraform/  # modules + environments", "scripts/", ".github/workflows/  # plan/apply or deploy", "docs/runbook.md", "docs/architecture.md"],
  },
  security: {
    noun: "security tool or assessment",
    layers: [["Assets", "Systems in scope"], ["Collection", "Logs / scans / traffic"], ["Analysis", "{lang} detections & checks"], ["Findings", "Risk ranking", "Evidence"], ["Response", "Remediation & report"]],
    build: [["Define scope and rules of engagement", "Write what is in scope, what is forbidden, and how you will prove findings without harming systems. Work only in your own lab.", "Who authorised this test and what is out of bounds?"],
      ["Collect evidence systematically", "Automate collection or testing where possible and record exact steps so results can be reproduced.", "Can another analyst reproduce each finding from your notes?"],
      ["Rate risk and propose fixes", "Rank findings by likelihood and impact, and give a concrete remediation and a way to verify the fix.", "Which single fix removes the most risk?"]],
    test: ["Detections/checks tested against known-good and known-bad samples", "False positives measured", "Each finding reproducible from notes", "Fix verified by re-testing"],
    deploy: ["Lab setup reproducible (VMs/containers) and isolated", "Tool runs with documented commands", "Sensitive data excluded from the repo", "Final report with evidence included"],
    secure: ["Isolate the lab network; no real credentials", "Document legal and ethical boundaries"],
    skeleton: ["README.md  # scope, rules of engagement", "lab/            # lab setup", "tools/ or rules/", "evidence/        # sanitised screenshots/logs", "report/          # findings + remediation"],
  },
  network: {
    noun: "network design",
    layers: [["Users & sites", "Branches / VLANs"], ["Access", "Switching", "Wireless"], ["Core / WAN", "Routing", "VPN / BGP / OSPF"], ["Services", "DNS / DHCP / firewall"], ["Operations", "Monitoring", "Automation"]],
    build: [["Plan addressing and topology", "Create the address plan, VLAN map and topology diagram before any configuration.", "Will this addressing still work when the company doubles?"],
      ["Configure in layers and verify each one", "Bring up switching, then routing, then services, testing connectivity after every layer (ping, traceroute, show commands).", "What does your verification command prove at each step?"],
      ["Secure, break and restore", "Apply ACLs/firewall rules, then simulate a link or device failure and document convergence.", "What is the shortest path your traffic takes after the failure?"]],
    test: ["Connectivity matrix verified (who can reach what)", "Failover tested and timed", "Security policy blocks unwanted traffic", "Configs backed up and diffable"],
    deploy: ["Topology file / lab export included", "Configs stored in the repo", "Verification commands and outputs documented", "Diagram matches the implementation"],
    secure: ["Apply least-privilege ACLs / firewall policy", "Disable unused services; secure management access"],
    skeleton: ["README.md", "topology/       # lab file + diagram", "configs/        # per-device configuration", "tests/ or scripts/  # verification", "docs/addressing.md"],
  },
  mobile: {
    noun: "mobile app",
    layers: [["UI", "Screens & navigation"], ["State", "View-model / state"], ["Local data", "{db}"], ["Network", "API / sync"], ["Platform", "Notifications / sensors", "Release pipeline"]],
    build: [["Design the screens and navigation first", "Sketch each screen, its states (loading, empty, error) and the navigation graph.", "What does the user see with no network?"],
      ["Separate UI from state and data", "Keep business logic out of views so it can be unit tested; persist data locally.", "Where does the single source of truth for the data live?"],
      ["Handle lifecycle, permissions and failures", "Handle rotation/background, permission denial and slow networks gracefully.", "What happens if the user denies the permission?"]],
    test: ["Unit tests for view-model/logic", "UI test for the main flow", "Offline/error states verified", "Tested on at least two screen sizes or devices"],
    deploy: ["Debug and release builds documented", "Signing keys excluded from the repo", "APK/IPA or store-style build instructions", "Screenshots/demo recording included"],
    secure: ["Store tokens in secure storage", "Use HTTPS only and validate server responses"],
    skeleton: ["README.md", "app/ or lib/ or Sources/   # UI, state, data layers", "tests/ or test/", "docs/screenshots", ".github/workflows/build.yml"],
  },
  game: {
    noun: "game or interactive experience",
    layers: [["Input", "Controls / tracking"], ["Game loop", "Update & timing"], ["Systems", "Physics", "AI / networking"], ["Rendering", "Graphics / UI"], ["Persistence", "Saves / telemetry"]],
    build: [["Build a playable core loop first", "Get input → update → render working with placeholder art before adding features.", "What is the 30-second loop that should be fun?"],
      ["Add systems one at a time and tune them", "Add physics, AI or networking separately; expose tuning values so you can adjust feel without code changes.", "Which number controls how this feels?"],
      ["Profile and polish", "Measure frame time, fix the worst spike, and playtest with someone else.", "What is your frame-time budget in milliseconds?"]],
    test: ["Core rules unit-tested outside the engine where possible", "Playtest notes recorded", "Frame-rate/profiler snapshot captured", "Edge cases (pause, restart, disconnect) handled"],
    deploy: ["Playable build or WebGL/exe provided", "Controls documented in the README", "Assets are licensed or original", "Gameplay recording included"],
    secure: ["Validate client input on the server (if multiplayer)", "Avoid trusting client state"],
    skeleton: ["README.md  # controls, build steps", "Assets/ or src/", "Scripts/ or systems/", "Tests/", "docs/design.md  # core loop, tuning table"],
  },
  chain: {
    noun: "smart-contract application",
    layers: [["Wallet / UI", "Web3 client"], ["Contracts", "{lang} contracts", "Access control"], ["Chain", "Local node / testnet"], ["Off-chain", "Indexer / storage"], ["Assurance", "Tests", "Static analysis"]],
    build: [["Specify state, roles and invariants", "Write what must always be true (e.g. total supply, balances) before coding contracts.", "Which invariant would an attacker try to break?"],
      ["Implement contracts with tests beside them", "Write each function with positive and negative tests; use audited libraries rather than inventing primitives.", "What happens if this function is called twice or by the wrong account?"],
      ["Attack your own contract", "Try re-entrancy, overflow, access-control bypass and front-running in tests; fix and document.", "Which function moves value, and who can call it?"]],
    test: ["Unit tests for every function (success and revert)", "Invariant/fuzz tests where relevant", "Static analysis run and findings triaged", "Gas usage reviewed"],
    deploy: ["Deployed to a local or test network with documented steps", "Contract addresses and ABIs recorded", "No private keys in the repo", "Front-end or script demonstrates the flow"],
    secure: ["Apply checks-effects-interactions and access control", "Run a static analyser and document accepted risks"],
    skeleton: ["README.md", "contracts/", "test/", "scripts/deploy", "frontend/ (optional)", "docs/security-notes.md"],
  },
  device: {
    noun: "device system",
    layers: [["Sensors & actuators", "Hardware / simulator"], ["Firmware", "{lang} control code", "Drivers"], ["Link", "Serial / MQTT / radio"], ["Backend", "{db}", "Cloud / gateway"], ["Operator", "Dashboard / alerts"]],
    build: [["Verify the hardware (or simulator) in isolation", "Read each sensor or drive each actuator on its own and record raw values and timing before integration.", "What is the expected range and noise of each reading?"],
      ["Write modular firmware with clear timing", "Separate drivers, logic and communication; avoid blocking delays; define task timing/priorities.", "What must happen within what deadline?"],
      ["Connect, observe and handle faults", "Send data to a host/backend, display it, then simulate sensor loss and reconnection.", "What does the device do when the network is gone?"]],
    test: ["Driver/logic tested off-device (mocks or simulator)", "Timing measured (scope, logs or profiler)", "Fault handling verified (sensor unplugged, link down)", "Data on the host matches device values"],
    deploy: ["Wiring/diagram and bill of materials documented", "Build/flash instructions", "Configuration without hard-coded credentials", "Demo video or serial/log capture"],
    secure: ["Authenticate device to backend; no shared default passwords", "Sign or verify firmware updates"],
    skeleton: ["README.md  # wiring, BOM, flash steps", "firmware/ or src/", "host/ or backend/", "tests/", "docs/wiring.png"],
  },
  qa: {
    noun: "test strategy and automation",
    layers: [["Requirements", "User stories / risks"], ["Test design", "Cases, data & environments"], ["Automation", "{fw} suites"], ["Pipeline", "CI execution", "Parallel runs"], ["Reporting", "Results & defects", "Quality metrics"]],
    build: [["Analyse risk and design the test approach", "Identify what matters most, choose test levels (unit/API/UI), and write acceptance criteria.", "Which failure would hurt users most, and which test would catch it?"],
      ["Automate with stable, maintainable tests", "Use clear naming, independent tests and reusable helpers/page objects. Avoid fixed sleeps.", "How would you make this test not flaky?"],
      ["Report and act on results", "Publish reports, track flaky tests and defects, and show trend metrics.", "What decision does your report let the team make?"]],
    test: ["Tests are independent and repeatable", "Flaky tests identified and fixed or quarantined", "Negative and boundary cases included", "Failures give actionable messages"],
    deploy: ["Suite runs in CI on every pull request", "Test data/environment setup is automated", "Reports are published as artefacts", "Run instructions documented"],
    secure: ["Keep credentials out of tests", "Mask personal data in test data"],
    skeleton: ["README.md  # strategy + how to run", "tests/ (unit/ api/ e2e/)", "pages/ or helpers/", "data/ fixtures", "reports/ (gitignored)", ".github/workflows/tests.yml"],
  },
  design: {
    noun: "architecture design",
    layers: [["Requirements", "Functional & quality attributes"], ["Components", "Services / modules", "Boundaries"], ["Data & integration", "{db}", "Events / APIs"], ["Quality", "Scale, resilience, security"], ["Decisions", "ADRs & trade-offs"]],
    build: [["Capture requirements and constraints with numbers", "Write functional needs and quality targets (users, requests/sec, data size, availability, budget).", "What numbers drive the design and where did you get them?"],
      ["Propose the architecture and justify alternatives", "Draw components and data flows; for each major choice record at least one alternative and why you rejected it.", "What would make you change this decision?"],
      ["Stress the design", "Walk through failure scenarios, scale-up and cost; revise the design and record what changed.", "What breaks first at 10× load?"]],
    test: ["Every requirement traces to a component", "Failure scenarios walked through and documented", "Capacity estimates shown with working", "Peer or mentor review captured"],
    deploy: ["Diagrams exported and referenced in the README", "Decision records stored in the repo", "A thin prototype or spike validates the riskiest assumption (where applicable)", "Rollout/migration plan included"],
    secure: ["Add a threat-model section", "Define data-ownership and access boundaries"],
    skeleton: ["README.md", "docs/requirements.md", "docs/architecture.md + diagrams/", "docs/adr/0001-*.md", "prototype/ (optional)"],
  },
};
const PJ_FAMILY_OF_CAT = {};
const pjFamily = (cat) => PJ_FAMILIES[PROJECT_CATEGORIES.find(c => c.id === cat)?.family] || PJ_FAMILIES.app;

// ------------------------------- catalogue ---------------------------------
const PROJECTS = [];
(function buildProjects() {
  const catCode = (id) => id.toUpperCase();
  PROJECT_CATEGORIES.forEach(cat => {
    PJ_LEVELS.forEach((lv, li) => {
      (PROJECT_SEEDS[cat.id]?.[lv] || []).forEach((seed, n) => {
        const [name, problem, skills, stack, ents] = seed;
        const [langs, fw, dbs, tools] = String(stack).split("|").map(pjSplit);
        const skillIds = pjSplit(skills);
        const ntools = (tools || []).length + (dbs || []).length + (fw || []).length;
        const cfg = PJ_LEVEL_CFG[lv];
        const complexity = Math.max(1, Math.min(10, Math.round(cfg.base + (skillIds.length + ntools - 6) * 0.25)));
        PROJECTS.push({
          id: `PRJ-${catCode(cat.id)}-${lv[0].toUpperCase()}${n + 1}`, slug: pjSlug(name),
          name, category: cat.id, categoryName: cat.name, family: cat.family, level: lv, levelLabel: PJ_LEVEL_LABEL[lv],
          problem, description: `${problem.replace(/;.*$/, "").replace(/\.$/, "")}.`,
          skills: skillIds, languages: langs || [], frameworks: fw || [], databases: dbs || [], tools: tools || [],
          entities: pjSplit(ents), duration: cfg.dur, hours: cfg.hours, weeks: cfg.weeks, complexity,
          real: problem, _li: li, _n: n,
        });
      });
    });
  });
  const byCat = {};
  PROJECTS.forEach(p => { (byCat[p.category] = byCat[p.category] || []).push(p); });
  PROJECTS.forEach(p => {
    const preSkills = new Set();
    p.skills.forEach(s => (typeof SKILL_LIB !== "undefined" ? SKILL_LIB[s]?.deps || [] : []).forEach(d => preSkills.add(d)));
    p.prerequisites = {
      skills: [...preSkills].filter(d => !p.skills.includes(d)).slice(0, 5),
      projects: p.level === "basic" ? [] : byCat[p.category].filter(q => q._li === p._li - 1).map(q => q.id),
    };
    p.related = [
      ...byCat[p.category].filter(q => q.id !== p.id && Math.abs(q._li - p._li) === 1 && q.skills.some(s => p.skills.includes(s))).slice(0, 2).map(q => q.id),
      ...PROJECTS.filter(q => q.category !== p.category && q.level === p.level && q.skills.filter(s => p.skills.includes(s)).length >= 2).slice(0, 2).map(q => q.id),
    ].slice(0, 4);
    p.objectives = [
      ...p.skills.slice(0, 4).map(s => `Apply ${pjSkillName(s)} to solve a real requirement, and explain why it was the right tool.`),
      `Design, build and verify a working ${pjFamily(p.category).noun} that addresses: ${p.problem.replace(/\.$/, "")}.`,
      p.level === "basic" ? "Document how to run, test and extend your solution." : p.level === "intermediate" ? "Automate quality checks and justify your key design decisions in writing." : "Measure the system against explicit targets, and document trade-offs and failure modes.",
    ];
    p.deliverables = ["Public GitHub repository with a meaningful commit history", "README: problem, setup, usage, architecture and decisions",
      "Automated tests with recorded results", p.level === "basic" ? "Screenshots or a short demo of it working" : "Deployment, container or reproducible-run evidence",
      ...(p.level === "advanced" ? ["Measured results against stated targets, and a short post-mortem or trade-off report"] : [])];
    p.evaluation = pjCriteria(p.level);
    p.applications = [`Used in practice by teams that need to ${p.problem.split(";")[0].replace(/^[A-Z]/, m => m.toLowerCase()).replace(/\.$/, "")}.`,
      `Directly transferable to ${p.categoryName.toLowerCase()} roles and portfolio reviews.`];
  });
})();
const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map(p => [p.id, p]));

function pjCriteria(level) {
  const w = { basic: [["Working functionality", 30], ["Code quality & structure", 20], ["Required-skill usage", 20], ["Testing", 15], ["Documentation", 15]],
    intermediate: [["Working functionality", 20], ["Code quality & structure", 15], ["Required-skill usage", 20], ["Architecture", 15], ["Testing", 15], ["Documentation & deployment", 15]],
    advanced: [["Working functionality", 15], ["Architecture & design decisions", 20], ["Required-skill usage", 15], ["Testing & reliability", 20], ["Deployment & operations", 15], ["Documentation & measured results", 15]] };
  return w[level].map(([label, weight]) => ({ label, weight }));
}

// roles for a project: careers in its category group with a shared skill, OR >= 2 shared skills;
// every career is then topped up to >= 3 projects per level (closest by overlap) so no career is left empty.
let pjRoleIndex = null;
function pjBuildRoleIndex() {
  const idx = {}; PROJECTS.forEach(p => { idx[p.id] = new Set(); });
  const careers = typeof CAREERS !== "undefined" ? CAREERS : [];
  careers.forEach(c => {
    const own = new Set();
    PROJECTS.forEach(p => {
      const cat = PROJECT_CATEGORIES.find(x => x.id === p.category); const ov = c.skills.filter(s => p.skills.includes(s.id)).length;
      if ((cat.careerCats.includes(c.category) && ov >= 1) || ov >= 2) { idx[p.id].add(c.id); own.add(p.id); }
    });
    PJ_LEVELS.forEach(lv => {
      const have = PROJECTS.filter(p => p.level === lv && own.has(p.id)).length;
      if (have >= 3) return;
      PROJECTS.filter(p => p.level === lv && !own.has(p.id)).map(p => {
        const cat = PROJECT_CATEGORIES.find(x => x.id === p.category);
        return { p, sc: c.skills.filter(s => p.skills.includes(s.id)).length * 10 + (cat.careerCats.includes(c.category) ? 6 : 0) + (["software", "design"].includes(p.category) ? 1 : 0) };
      }).sort((a, b) => b.sc - a.sc).slice(0, 3 - have).forEach(x => idx[x.p.id].add(c.id));
    });
  });
  return idx;
}
function projectRoles(p) { if (!pjRoleIndex) pjRoleIndex = pjBuildRoleIndex(); return [...pjRoleIndex[p.id]]; }
function projectRelevance(p, career) {
  if (!career) return 0;
  const cat = PROJECT_CATEGORIES.find(c => c.id === p.category);
  const overlap = career.skills.filter(s => p.skills.includes(s.id)).length;
  const catHit = cat.careerCats.includes(career.category);
  if (catHit && overlap >= 1) return 1;
  if (catHit) return 0.6;
  return Math.min(1, overlap / 3);
}
function projectsForRole(careerId) { return PROJECTS.filter(p => projectRoles(p).includes(careerId)); }
function projectCatalogueStats() {
  const byCat = {}; PROJECTS.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
  return { total: PROJECTS.length, categories: PROJECT_CATEGORIES.length, byCategory: byCat, perLevel: PJ_LEVELS.map(l => PROJECTS.filter(p => p.level === l).length) };
}

// ------------------------------- state / progress --------------------------
const PJ_STATUSES = ["viewed", "in-progress", "self-reported", "submitted", "verified"];
const pjNow = () => new Date().toISOString();
function projectStatus(state, id) { const s = state?.[id]?.status; return !s || s === "viewed" ? "not-started" : s; }
function projectProgress(p, entry) {
  const ws = projectWorkspace(p); const tasks = ws.phases.flatMap(ph => ph.tasks);
  const done = tasks.filter(t => entry?.tasks?.[t.id]).length;
  const checks = [...ws.testChecklist, ...ws.deployChecklist]; const cdone = checks.filter(c => entry?.checks?.[c.id]).length;
  return { done, total: tasks.length, pct: tasks.length ? Math.round(100 * done / tasks.length) : 0, checksDone: cdone, checksTotal: checks.length,
    phases: ws.phases.map(ph => ({ id: ph.id, done: ph.tasks.filter(t => entry?.tasks?.[t.id]).length, total: ph.tasks.length })) };
}
// Shared by the client and the server: never trust the shape of stored project state.
function sanitizeProjectState(raw) {
  const out = {}; if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
  Object.keys(raw).slice(0, 300).forEach(id => {
    const e = raw[id]; if (!/^PRJ-[A-Z]+-[BIA]\d+$/.test(id) || !e || typeof e !== "object") return;
    const bools = (o, max) => { const r = {}; if (o && typeof o === "object") Object.keys(o).slice(0, max).forEach(k => { if (o[k] === true && /^[a-z]+-\d+$|^(t|d)\d+$/.test(k)) r[k] = true; }); return r; };
    const s = e.submission && typeof e.submission === "object" ? e.submission : null;
    out[id] = {
      status: PJ_STATUSES.includes(e.status) ? e.status : "in-progress",
      tasks: bools(e.tasks, 120), checks: bools(e.checks, 40),
      startedAt: str(e.startedAt, 40), updatedAt: str(e.updatedAt, 40), lastViewed: str(e.lastViewed, 40),
      notes: str(e.notes, 4000), paused: e.paused === true,
      submission: s ? { repoUrl: str(s.repoUrl, 300), deployUrl: str(s.deployUrl, 300), videoUrl: str(s.videoUrl, 300), docsText: str(s.docsText, 6000),
        testResults: str(s.testResults, 3000), screenshots: Array.isArray(s.screenshots) ? s.screenshots.slice(0, 8).map(x => str(x, 300)) : [], notes: str(s.notes, 1000), submittedAt: str(s.submittedAt, 40) } : null,
      evaluation: e.evaluation && typeof e.evaluation === "object" && JSON.stringify(e.evaluation).length < 60000 ? e.evaluation : null,
      history: Array.isArray(e.history) ? e.history.slice(-10).filter(h => h && typeof h === "object" && JSON.stringify(h).length < 2000) : [],
      mentorLog: Array.isArray(e.mentorLog) ? e.mentorLog.slice(-30).map(m => ({ role: m?.role === "mentor" ? "mentor" : "user", text: str(m?.text, 3000), title: str(m?.title, 200) })) : [],
    };
  });
  return out;
}
// Skill evidence for the Digital Twin: ONLY skills actually detected in a verified project count as deployment evidence.
function projectEvidenceSkills(state) {
  const verified = new Set(), submitted = new Set();
  Object.keys(state || {}).forEach(id => {
    const e = state[id]; const ev = e?.evaluation; if (!ev?.skills) return;
    const det = ev.skills.filter(s => s.state === "detected").map(s => s.id);
    if (e.status === "verified") det.forEach(s => verified.add(s)); else if (e.status === "submitted") det.forEach(s => submitted.add(s));
  });
  return { verified, submitted };
}

// ------------------------------- workspace generator -----------------------
const pjWsCache = {};
function projectWorkspace(p) {
  if (pjWsCache[p.id]) return pjWsCache[p.id];
  const fam = PJ_FAMILIES[p.family] || PJ_FAMILIES.app;
  const fill = (s) => String(s).replace("{fw}", p.frameworks[0] || p.languages[0] || "Application").replace("{lang}", p.languages[0] || "Code").replace("{db}", p.databases[0] || "Local storage").replace("{name}", p.name);
  const lv = p.level; const hasData = p.databases.length > 0 || p.entities.length > 0;
  const skillNames = p.skills.filter(s => SKILL_LIB[s] && !["lang"].includes(SKILL_LIB[s].kind)).slice(0, 3).map(pjSkillName);
  const T = (phase, list) => list.map((t, i) => ({ id: `${phase}-${i + 1}`, phase, title: t[0], detail: t[1], hint: t[2] || null }));
  const phases = [];
  phases.push({ id: "plan", title: "Plan & scope", goal: "Understand the problem and decide how you will prove it is solved.", tasks: T("plan", [
    ["Restate the problem in your own words", `Write 3–4 sentences: who has the problem ("${p.problem.split(";")[0]}"), what a good solution does, and how you will know it works.`],
    ["Write testable requirements", "List 5–8 acceptance criteria. Each must be something a test, a command or a screenshot can prove.", "Could a stranger check this requirement without asking you?"],
    ["Sketch the architecture before coding", "Compare your sketch with the generated architecture diagram. Note every difference and the reason for it.", "Which part is riskiest? Prototype that first."],
    ["Create the repository and baseline", "Initialise Git, add a README skeleton, .gitignore and licence, and make a first commit. Commit small and often from here on.", "Does your .gitignore exclude secrets and build output?"]]) });
  phases.push({ id: "build", title: "Build the core", goal: `Implement the heart of the ${fam.noun}.`, tasks: [
    ...T("build", fam.build.map(b => b.map(fill))),
    ...skillNames.map((n, i) => ({ id: `build-${fam.build.length + i + 1}`, phase: "build", title: `Use ${n} for a real requirement`, detail: `Decide exactly where ${n} belongs in this project, implement it, and record why in your docs. A listed technology that is only imported does not count as evidence.`, hint: `Ask the mentor: “explain ${n}”` }))] });
  if (hasData) phases.push({ id: "data", title: "Data & persistence", goal: "Model and store the data deliberately.", tasks: T("data", [
    ["Design the data model", p.entities.length ? `Model: ${p.entities.join(", ")}. Decide keys, relationships and constraints; compare with the generated schema.` : "Decide what must persist, its shape and its constraints; write the schema or format down.", "Which fields must be unique, and which are optional?"],
    ["Implement persistence and migrations", "Create the schema through versioned migrations or scripts so a fresh clone can rebuild the database.", "Can you recreate the database from scratch with one command?"],
    ["Seed realistic sample data", "Add a seed script with enough varied data (including edge cases) to demonstrate and test the system."]]) });
  if (lv !== "basic") phases.push({ id: "secure", title: "Secure & harden", goal: "Remove the obvious ways it can fail or be abused.", tasks: T("secure", [
    ["Threat-model the main flow", "List inputs, secrets, trust boundaries and the top 3 abuse cases. Add a short section to the docs.", "What could a malicious or careless user do here?"],
    ...fam.secure.map(s => [s, "Implement it and add a test or check that proves it."])]) });
  phases.push({ id: "quality", title: "Test & document", goal: "Prove it works and explain it.", tasks: T("quality", [
    ["Write unit tests for the core logic", "Cover normal cases, boundaries and failures. Tests should run with a single documented command.", "What is the bug you are most afraid of? Write that test first."],
    ["Test the main flow end to end", "Add an integration, API or UI-level test (or a scripted manual test with recorded output) for the primary user journey."],
    ["Record the test results", "Save the test output (pass counts, coverage) in the repo or README so reviewers can see it."],
    ["Write the README", "Include: problem, features, setup, usage, architecture, testing, decisions and known limits.", "Could a new teammate run it in 10 minutes using only your README?"]]) });
  if (lv !== "basic") phases.push({ id: "integrate", title: "Automate & integrate", goal: "Make checks and setup repeatable.", tasks: T("integrate", [
    ["Run checks automatically in CI", "Add a pipeline that installs, lints and runs tests on every push or pull request.", "Does the pipeline fail when a test fails?"],
    ["Make setup reproducible", p.tools.some(t => /docker|compose|terraform|ansible/i.test(t)) || ["infra"].includes(p.family) ? "Use the container or infrastructure code so a fresh machine can reproduce the environment." : "Pin dependencies and provide a single bootstrap script or documented commands."]]) });
  if (lv === "advanced") {
    phases.push({ id: "scale", title: "Scale & measure", goal: "Replace opinions with measurements.", tasks: T("scale", [
      ["Define measurable targets", "Write explicit targets (e.g. p95 latency, throughput, recovery time, accuracy, frame time) and why they matter.", "What number would make this unacceptable?"],
      ["Measure and record results", "Run a load, stress, benchmark or evaluation and save the raw numbers and the method."],
      ["Fix the top bottleneck and re-measure", "Change one thing, measure again, and document before/after."]]) });
    phases.push({ id: "observe", title: "Operate & reliability", goal: "Show you can run it, not just build it.", tasks: T("observe", [
      ["Add logs, metrics or traces", "Make the system explain what it is doing so a failure can be diagnosed without a debugger."],
      ["Write a runbook and rehearse one failure", "Document how to detect, mitigate and recover from the most likely failure, and actually test it."]]) });
  }
  phases.push({ id: "ship", title: "Ship & submit", goal: "Produce evidence a reviewer can check.", tasks: T("ship", [
    ["Run or deploy it", lv === "basic" ? "Make it runnable from a clean checkout, or deploy it. Capture screenshots." : "Deploy it (or provide a reproducible local run) and capture the URL or logs."],
    ["Record a short demo", "Screenshots or a 2–3 minute video showing the main flow and one failure case."],
    ["Write the final report", p.level === "advanced" ? "Decisions, measurements, trade-offs and what you would change at 10× scale." : "What you built, key decisions, what went wrong, what you would improve.", "What is the most important thing you learned that is not in the README?"],
    ["Submit your evidence for verification", "Submit the repository URL (and optional deployment URL, demo and test results) in the Submission tab."]]) });

  const mkChecks = (kind, arr) => arr.map((c, i) => ({ id: `${kind}${i + 1}`, text: fill(c) }));
  const testChecklist = mkChecks("t", fam.test), deployChecklist = mkChecks("d", fam.deploy);

  // data model + API only where it applies
  let schema = null, api = null;
  if (p.entities.length) {
    const ents = p.entities.map(e => e.replace(/s$/, ""));
    schema = p.entities.map((tn, i) => `CREATE TABLE ${tn} (\n  id SERIAL PRIMARY KEY,\n  ${i > 0 ? `${ents[0]}_id INTEGER REFERENCES ${p.entities[0]}(id),\n  ` : ""}name TEXT NOT NULL,\n  status TEXT DEFAULT 'active',\n  created_at TIMESTAMPTZ DEFAULT now()\n);`).join("\n\n") + "\n-- Starting point only: add the columns your requirements need.";
    api = p.entities.flatMap(tn => [["GET", `/api/${tn}`, `List ${tn} (filter, paginate)`], ["POST", `/api/${tn}`, `Create ${tn.replace(/s$/, "")} (validate input)`], ["GET", `/api/${tn}/:id`, "Fetch one"], ["PUT", `/api/${tn}/:id`, "Update"], ["DELETE", `/api/${tn}/:id`, "Remove (soft delete?)"]]);
  }
  const layers = fam.layers.map(l => l.map(fill));
  const ws = { phases, testChecklist, deployChecklist, schema, api,
    architecture: layers, workflow: phases.map(ph => ph.title),
    repoStructure: fam.skeleton, architectureSvg: pjArchSvg(layers), workflowSvg: pjFlowSvg(phases.map(ph => ph.title)),
    codeGuidance: [
      `Start from the smallest slice that works end to end for “${p.name}”, then widen it. Commit each slice.`,
      `Use ${p.languages.concat(p.frameworks).slice(0, 3).join(", ") || "your chosen stack"} idiomatically; read the official docs for each feature before copying snippets.`,
      "Write the test for a behaviour before or immediately after the code. Stuck? Describe the error to the mentor — it will ask questions and point to docs, not paste a solution.",
    ] };
  return (pjWsCache[p.id] = ws);
}
function pjEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function pjArchSvg(layers) {
  const colW = 170, gap = 34, rowH = 40, padX = 12, top = 34;
  const maxRows = Math.max(...layers.map(l => l.length - 1));
  const W = padX * 2 + layers.length * colW + (layers.length - 1) * gap, H = top + maxRows * (rowH + 8) + 24;
  const cols = ["#6366F1", "#06B6D4", "#22C55E", "#F59E0B", "#A78BFA", "#EC4899"];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Architecture diagram" style="font-family:Inter,system-ui,sans-serif"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94A3B8"/></marker></defs>`;
  layers.forEach((l, i) => {
    const x = padX + i * (colW + gap), c = cols[i % cols.length];
    s += `<text x="${x + colW / 2}" y="18" text-anchor="middle" font-size="11" fill="${c}" font-weight="600">${pjEsc(l[0])}</text>`;
    l.slice(1).forEach((it, j) => {
      const y = top + j * (rowH + 8);
      s += `<rect x="${x}" y="${y}" width="${colW}" height="${rowH}" rx="8" fill="${c}22" stroke="${c}" stroke-opacity=".6"/><text x="${x + colW / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" fill="#E2E8F0">${pjEsc(it.length > 26 ? it.slice(0, 25) + "…" : it)}</text>`;
    });
    if (i < layers.length - 1) { const my = top + rowH / 2; s += `<line x1="${x + colW + 2}" y1="${my}" x2="${x + colW + gap - 4}" y2="${my}" stroke="#94A3B8" stroke-width="1.5" marker-end="url(#ah)"/>`; }
  });
  return s + "</svg>";
}
function pjFlowSvg(steps) {
  const w = 128, h = 44, gap = 26, W = steps.length * (w + gap) - gap + 24, H = h + 28;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Workflow diagram" style="font-family:Inter,system-ui,sans-serif"><defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94A3B8"/></marker></defs>`;
  steps.forEach((t, i) => {
    const x = 12 + i * (w + gap);
    s += `<rect x="${x}" y="14" width="${w}" height="${h}" rx="10" fill="#6366F122" stroke="#6366F1" stroke-opacity=".7"/><text x="${x + 10}" y="32" font-size="9" fill="#06B6D4">STEP ${i + 1}</text><text x="${x + 10}" y="48" font-size="11" fill="#E2E8F0">${pjEsc(t.length > 19 ? t.slice(0, 18) + "…" : t)}</text>`;
    if (i < steps.length - 1) s += `<line x1="${x + w + 2}" y1="${14 + h / 2}" x2="${x + w + gap - 4}" y2="${14 + h / 2}" stroke="#94A3B8" stroke-width="1.5" marker-end="url(#ah2)"/>`;
  });
  return s + "</svg>";
}

// ------------------------------- filtering / search ------------------------
function filterProjects(list, f = {}, state = {}, career = null) {
  const q = String(f.q || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  return list.filter(p => {
    if (f.level && p.level !== f.level) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.role && !projectRoles(p).includes(f.role)) return false;
    if (f.lang && !p.languages.some(l => l.toLowerCase() === f.lang.toLowerCase())) return false;
    if (f.stack && !p.frameworks.concat(p.databases, p.tools).some(l => l.toLowerCase() === f.stack.toLowerCase())) return false;
    if (f.duration && p.duration !== f.duration) return false;
    if (f.skill && !p.skills.includes(f.skill)) return false;
    if (f.status && f.status !== "all") { const st = projectStatus(state, p.id); if (f.status === "not-started" ? st !== "not-started" : st !== f.status) return false; }
    if (q.length) {
      const roleNames = projectRoles(p).slice(0, 40).map(id => CAREER_BY_ID?.[id]?.name || "").join(" ");
      const hay = [p.name, p.problem, p.categoryName, p.levelLabel, p.skills.map(pjSkillName).join(" "), p.languages.join(" "), p.frameworks.join(" "), p.databases.join(" "), p.tools.join(" "), roleNames].join(" ").toLowerCase();
      if (!q.every(t => hay.includes(t))) return false;
    }
    return true;
  });
}

// ------------------------------- recommendations ---------------------------
function estimateLevel(ctx) {
  const state = ctx.projectState || {}; const v = Object.values(state).filter(e => e.status === "verified").length;
  const sk = ctx.career?.skills || []; const avg = sk.length ? sk.reduce((s, x) => s + (ctx.skillState?.[x.id]?.score ?? 0), 0) / sk.length : 0;
  return v >= 3 || avg >= 70 ? "advanced" : v >= 1 || avg >= 40 ? "intermediate" : "basic";
}
function recommendProjects(ctx, opts = {}) {
  const { limit = 12, difficulty = "auto" } = opts; const career = ctx.career; if (!career) return [];
  const sec = (ctx.secondaryCareers || []).filter(Boolean); const st = ctx.skillState || {}; const pstate = ctx.projectState || {};
  const target = difficulty === "auto" || !difficulty ? estimateLevel(ctx) : difficulty; const tIdx = PJ_LEVELS.indexOf(target);
  const gh = new Set(ctx.githubData?.evidencedSkills || []); const rs = new Set((ctx.resumeData?.matched || []).map(m => m.id));
  const done = new Set(Object.keys(pstate).filter(id => pstate[id].status === "verified")); (ctx.legacyDone || []).forEach(x => done.add(x));
  const cw = Object.fromEntries(career.skills.map(s => [s.id, s]));
  const scored = [];
  PROJECTS.forEach(p => {
    if (done.has(p.id)) return;
    const primary = projectRelevance(p, career); const secondary = Math.max(0, ...sec.map(c => projectRelevance(p, c))) * 0.6;
    const rel = Math.max(primary, secondary); if (rel < 0.34) return;
    const inCareer = p.skills.filter(s => cw[s]);
    const gaps = inCareer.map(s => ({ id: s, name: pjSkillName(s), conf: st[s]?.score ?? 0, w: cw[s].weight || 1 })).filter(g => g.conf < 60).sort((a, b) => b.w * (1 - b.conf / 100) - a.w * (1 - a.conf / 100));
    const gapScore = inCareer.length ? gaps.reduce((s, g) => s + g.w * (1 - g.conf / 100), 0) / (inCareer.reduce((s, x) => s + cw[x].weight, 0) || 1) : 0;
    const known = p.skills.filter(s => (st[s]?.score ?? 0) >= 45);
    const li = PJ_LEVELS.indexOf(p.level); const levelFit = li === tIdx ? 1 : Math.abs(li - tIdx) === 1 ? 0.4 : 0;
    const align = p.skills.length ? known.length / p.skills.length : 0;
    const ghGap = p.skills.filter(s => cw[s] && !gh.has(s)).length / Math.max(1, p.skills.length);
    const resumeGap = p.skills.filter(s => rs.has(s) && !gh.has(s));
    let score = 100 * (0.33 * rel + 0.28 * Math.min(1, gapScore * 1.6) + 0.2 * levelFit + 0.1 * align + 0.05 * ghGap + 0.04 * Math.min(1, inCareer.length / 3));
    if (pstate[p.id]?.status === "in-progress") score += 4;
    const reasons = [];
    if (primary >= secondary) reasons.push(primary >= 1 ? `Core project for ${career.name}` : `Relevant to ${career.name}`);
    else reasons.push(`Supports your secondary career: ${sec.find(c => projectRelevance(p, c) * 0.6 === secondary)?.name}`);
    if (gaps.length) reasons.push(`Closes skill gaps: ${gaps.slice(0, 3).map(g => `${g.name} (${Math.round(g.conf)}%)`).join(", ")}`);
    if (known.length) reasons.push(`Builds on what you already know: ${known.slice(0, 3).map(pjSkillName).join(", ")}`);
    reasons.push(`${p.levelFor === 1 ? "" : ""}${li === tIdx ? `Matches your ${difficulty === "auto" ? "estimated" : "selected"} level (${PJ_LEVEL_LABEL[target]})` : `One step ${li > tIdx ? "above" : "below"} your ${PJ_LEVEL_LABEL[target]} level`}`);
    if (ctx.githubData && p.skills.some(s => cw[s] && !gh.has(s))) reasons.push(`GitHub analysis shows no evidence yet for ${p.skills.filter(s => cw[s] && !gh.has(s)).slice(0, 2).map(pjSkillName).join(", ")}`);
    if (resumeGap.length) reasons.push(`Your resume lists ${resumeGap.slice(0, 2).map(pjSkillName).join(", ")} but there is no project proof`);
    scored.push({ project: p, score: Math.round(score), reasons, gaps: gaps.map(g => g.name), known: known.map(pjSkillName), primary: primary >= secondary });
  });
  scored.sort((a, b) => b.score - a.score);
  const out = [], perCat = {};
  for (const s of scored) { // diversity: spread across categories
    const c = perCat[s.project.category] || 0; if (c >= 2 && out.length < limit - 2) continue;
    perCat[s.project.category] = c + 1; out.push(s); if (out.length >= limit) break;
  }
  return out;
}

// ------------------------------- GitHub evidence ---------------------------
function parseRepoUrl(url) {
  const m = String(url || "").trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:[\/?#].*)?$/);
  if (!m || m[2] === "" ) return null; return { owner: m[1], repo: m[2] };
}
function pjB64(s) {
  try { s = String(s || "").replace(/\s/g, ""); if (typeof atob === "function") { const b = atob(s); try { return decodeURIComponent(escape(b)); } catch (e) { return b; } } return Buffer.from(s, "base64").toString("utf8"); } catch (e) { return ""; }
}
const PJ_MANIFESTS = /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|pipfile|pom\.xml|build\.gradle(\.kts)?|go\.mod|cargo\.toml|gemfile|composer\.json|pubspec\.yaml|platformio\.ini|dockerfile|docker-compose\.ya?ml|[^/]+\.csproj|hardhat\.config\.[jt]s|foundry\.toml|dbt_project\.yml)$/i;
// fetchJson(path) must resolve parsed JSON for an api.github.com path (e.g. "/repos/o/r") or throw an Error with .status
async function fetchRepoEvidence(owner, repo, fetchJson) {
  const base = `/repos/${owner}/${repo}`;
  const meta = await fetchJson(base);
  const branch = meta.default_branch || "main";
  const [langs, tree, commits, readme] = await Promise.all([
    fetchJson(`${base}/languages`).catch(() => ({})),
    fetchJson(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`).catch(() => ({ tree: [] })),
    fetchJson(`${base}/commits?per_page=100`).catch(() => []),
    fetchJson(`${base}/readme`).catch(() => null),
  ]);
  const files = (tree.tree || []).filter(t => t.type === "blob").map(t => t.path).slice(0, 3000);
  const manifestPaths = files.filter(f => PJ_MANIFESTS.test(f) && f.split("/").length <= 3).slice(0, 8);
  const manifests = {};
  await Promise.all(manifestPaths.map(async path => {
    try { const c = await fetchJson(`${base}/contents/${path.split("/").map(encodeURIComponent).join("/")}`); manifests[path] = pjB64(c.content).slice(0, 20000); } catch (e) { /* skip */ }
  }));
  const cl = Array.isArray(commits) ? commits : [];
  const dates = cl.map(c => c.commit?.author?.date || c.commit?.committer?.date).filter(Boolean).sort();
  const days = new Set(dates.map(d => d.slice(0, 10)));
  return {
    source: "github", fetchedAt: pjNow(),
    meta: { fullName: meta.full_name, description: meta.description || "", fork: !!meta.fork, createdAt: meta.created_at, pushedAt: meta.pushed_at, stars: meta.stargazers_count || 0, defaultBranch: branch, ownerLogin: meta.owner?.login || owner, size: meta.size || 0, archived: !!meta.archived },
    languages: langs || {}, files, truncated: !!tree.truncated,
    commits: { count: cl.length, authors: [...new Set(cl.map(c => (c.author?.login || c.commit?.author?.name || "").toLowerCase()).filter(Boolean))].slice(0, 20), activeDays: days.size,
      firstDate: dates[0] || null, lastDate: dates[dates.length - 1] || null, messages: cl.slice(0, 60).map(c => String(c.commit?.message || "").split("\n")[0].slice(0, 120)), maxed: cl.length >= 100 },
    readme: readme ? pjB64(readme.content).slice(0, 30000) : "", manifests,
  };
}

// ------------------------------- evaluation --------------------------------
// [skillId, dependency regex, file regex, language names]
const PJ_SIGNALS = [
  ["python", null, /\.py$/, ["Python"]], ["java", null, /\.java$/, ["Java"]], ["javascript", null, /\.(js|jsx|mjs)$/, ["JavaScript"]], ["typescript", null, /\.(ts|tsx)$/, ["TypeScript"]],
  ["c", null, /\.(c|h)$/, ["C"]], ["cpp", null, /\.(cpp|cc|hpp)$/, ["C++"]], ["csharp", null, /\.cs$/, ["C#"]], ["go", /^module /m, /\.go$/, ["Go"]], ["rust", null, /\.rs$/, ["Rust"]],
  ["php", null, /\.php$/, ["PHP"]], ["ruby", null, /\.rb$/, ["Ruby"]], ["swift", null, /\.swift$/, ["Swift"]], ["kotlin", null, /\.kt$/, ["Kotlin"]], ["dart", null, /\.dart$/, ["Dart"]], ["r", null, /\.r$/i, ["R"]],
  ["sql", null, /\.sql$/, ["PLpgSQL", "TSQL"]], ["bash", null, /\.sh$/, ["Shell"]], ["solidity", null, /\.sol$/, ["Solidity"]], ["html", null, /\.html?$/, ["HTML"]], ["css", null, /\.(css|scss)$/, ["CSS", "SCSS"]],
  ["react", /"react"\s*:/, /\.(jsx|tsx)$/], ["angular", /"@angular\/core"/, /angular\.json$/], ["vue", /"vue"\s*:/, /\.vue$/], ["nextjs", /"next"\s*:/, /next\.config/], ["svelte", /"svelte"/, /\.svelte$/], ["tailwind", /tailwindcss/, /tailwind\.config/],
  ["state-management", /redux|zustand|pinia|mobx|recoil|ngrx|riverpod|bloc|provider/i], ["nodejs", /./, /(^|\/)package\.json$/], ["express", /"express"\s*:/], ["nestjs", /@nestjs\/core/],
  ["django", /django/i, /manage\.py$/], ["fastapi", /fastapi/i], ["spring", /spring-boot|org\.springframework/i], ["aspnet", /Microsoft\.AspNetCore/i, /Startup\.cs$|Program\.cs$/], ["laravel", /laravel\/framework/], ["rails", /^\s*gem ['"]rails/m],
  ["pytorch", /(^|\n)\s*torch\b|"torch"/i], ["tensorflow", /tensorflow|keras/i], ["sklearn", /scikit-learn|sklearn/i], ["pandas", /pandas/i], ["langchain", /langchain|llama-index|llama_index/i], ["spark", /pyspark|spark-core|org\.apache\.spark/i],
  ["flutter", /^flutter:|sdk: flutter/m, /pubspec\.yaml$/], ["react-native", /react-native|expo/], ["jetpack-compose", /compose/i, /\.kt$/], ["swiftui", null, /\.swift$/], ["web3", /ethers|web3|wagmi|viem/i], ["ros", /rclpy|rclcpp|ament/i, /package\.xml$/],
  ["unity", null, /ProjectSettings\/|\.unity$|Assets\/.*\.cs$/], ["unreal", null, /\.uproject$/], ["microcontrollers", /./, /platformio\.ini$|\.ino$/],
  ["docker", null, /(^|\/)dockerfile$|docker-compose\.ya?ml$/i], ["kubernetes", /apiVersion:|kind:\s*(Deployment|Service)/, /(k8s|kubernetes|manifests)\/.*\.ya?ml$|deployment\.ya?ml$/], ["helm", null, /Chart\.yaml$/], ["terraform", null, /\.tf$/], ["ansible", /ansible/i, /playbook|roles\/.+\/tasks|ansible\.cfg/],
  ["cicd", null, /\.github\/workflows\/|\.gitlab-ci\.yml|Jenkinsfile|azure-pipelines|buildspec|\.circleci/], ["gitops", /argoproj|fluxcd/i, /argocd|flux/i], ["git", null, null], ["kafka", /kafka/i], ["message-queues", /rabbitmq|amqp|kafka|sqs|bullmq|celery|nats/i], ["mqtt", /mqtt/i], ["caching", /redis|memcache|lru/i],
  ["redis", /redis/i], ["postgres", /psycopg|pg\b|postgres|asyncpg|sequelize|typeorm|prisma/i], ["mysql", /mysql|mariadb/i], ["mongodb", /mongo/i], ["elasticsearch", /elasticsearch|opensearch/i], ["neo4j", /neo4j/i], ["cassandra", /cassandra/i],
  ["aws", /boto3|aws-sdk|@aws-sdk|provider\s+"aws"|aws_/i], ["azure", /azure/i], ["gcp", /google-cloud|gcloud|provider\s+"google"/i], ["serverless", /serverless|aws-lambda|azure-functions|@vercel/i, /serverless\.ya?ml|template\.ya?ml|lambda/i],
  ["unit-testing", /pytest|jest|vitest|mocha|junit|unittest|xunit|nunit|rspec|testing/i, /(^|\/)(tests?|__tests__|spec)\/|test_.*\.py$|.*_test\.go$|\.(test|spec)\.[jt]sx?$|Test\.java$/], ["testing", null, /(^|\/)(tests?|__tests__|spec)\/|test_.*\.py$|.*_test\.go$|\.(test|spec)\.[jt]sx?$|Test\.java$/],
  ["test-automation", /selenium|playwright|cypress|webdriver|puppeteer|appium/i], ["api-testing", /supertest|newman|pact|rest-assured|requests-mock|postman/i, /\.postman_collection/], ["performance-testing", /k6|jmeter|locust|gatling|artillery/i, /\.k6\.|jmeter|locustfile/], ["bdd", /cucumber|behave|pytest-bdd/i, /\.feature$/],
  ["monitoring", /prometheus|grafana|alertmanager|datadog|statsd/i, /prometheus|grafana|alert/i], ["observability", /opentelemetry|jaeger|zipkin|prometheus|structlog|winston|pino/i], ["rest", /express|fastapi|flask|spring-boot|nestjs|django-rest|gin-gonic|axum|actix|koa/i], ["graphql", /graphql|apollo/i], ["grpc", /grpc|protobuf/i, /\.proto$/],
  ["auth", /jsonwebtoken|passport|bcrypt|argon2|oauth|authlib|pyjwt|spring-security|keycloak|next-auth/i], ["cryptography", /cryptography|crypto-js|bcrypt|pycryptodome|libsodium|openssl|ethers/i, /crypto/i], ["db-design", null, /(schema|migrations?|models?)(\/|\.sql|\.py|\.ts|\.js)|\.prisma$|\.sql$/],
  ["nlp", /nltk|spacy|transformers|gensim|sentence-transformers/i], ["cv", /opencv|torchvision|ultralytics|mediapipe|pillow/i], ["ml", /scikit-learn|xgboost|lightgbm|statsmodels|tensorflow|torch/i], ["dl", /torch|tensorflow|keras|jax/i], ["genai", /openai|anthropic|transformers|diffusers|llama|vllm|langchain/i], ["llm", /openai|anthropic|transformers|llama|vllm|langchain|ollama/i],
  ["rag", /faiss|chroma|pinecone|weaviate|pgvector|qdrant|langchain|llama-index/i], ["mlops", /mlflow|dvc|kubeflow|bentoml|wandb|sagemaker|feast/i], ["model-deploy", /fastapi|flask|bentoml|torchserve|onnx|triton|vllm/i], ["recsys", /surprise|implicit|lightfm|recommend/i], ["time-series", /prophet|statsmodels|sktime|darts|arima/i], ["feature-eng", /feature|featuretools|category_encoders|feast/i],
  ["visualization", /matplotlib|plotly|seaborn|d3|chart\.js|altair|bokeh|streamlit|dash/i], ["statistics", /scipy|statsmodels|pymc|statistics/i], ["etl", /airflow|dbt|prefect|dagster|luigi|pandas|sqlalchemy|nifi/i], ["airflow", /airflow/i, /dags\//], ["analytics-eng", /dbt/i, /dbt_project\.yml$/], ["dwh", /snowflake|bigquery|redshift|dbt/i], ["big-data", /spark|hadoop|flink|beam|delta/i],
  ["bi-tools", null, /\.pbix$|\.twbx?$|\.msbi/], ["excel", null, /\.xlsx?$/], ["data-governance", /great[-_]expectations|soda|pandera|deequ|schema-registry|avro/i],
  ["web-security", /helmet|csurf|owasp|zap|burp|sqlmap|bandit/i], ["appsec", /bandit|semgrep|snyk|helmet|gitleaks|trivy|sonar/i], ["devsecops", /trivy|snyk|semgrep|gitleaks|bandit|dependabot/i, /dependabot|codeql/i], ["siem", /wazuh|sigma|elastic|splunk/i, /sigma|\.yar$|rules\//], ["pentesting", /nmap|metasploit|burp|sqlmap|hydra/i], ["malware-analysis", /yara|pefile|ghidra|capstone/i, /\.yar$/],
  ["network-automation", /netmiko|napalm|nornir|paramiko|ansible/i], ["networking", /scapy|socket|netmiko|ipaddress/i, /\.pkt$|\.gns3|topology/i], ["routing-switching", null, /ospf|bgp|vlan|router|switch/i], ["network-security", /iptables|nftables|pfsense|firewall/i, /firewall|iptables|acl/i],
  ["smart-contracts", /hardhat|foundry|truffle|openzeppelin/i, /\.sol$/], ["contract-security", /slither|echidna|mythril|openzeppelin/i], ["defi", /uniswap|amm|liquidity/i], ["zk", /circom|snarkjs|halo2|noir/i, /\.circom$/],
  ["rtos", /freertos|zephyr|rtos/i], ["comm-protocols", /i2c|spi|uart|modbus|can\b/i], ["sensors", /dht|bme280|mpu6050|sensor/i], ["tinyml", /tflite|tensorflow lite|edge impulse/i], ["embedded-linux", /yocto|buildroot/i, /\.bb$|\.bbappend$/],
  ["geospatial", /geopandas|shapely|rasterio|leaflet|mapbox|postgis|gdal|folium|openlayers/i, /\.geojson$|\.shp$|\.tif$/], ["game-ai", /behaviou?r.?tree|navmesh|pathfind|astar/i], ["multiplayer", /socket\.io|photon|mirror|netcode|enet|colyseus|ws\b/i], ["graphics", /opengl|vulkan|three|glfw|webgl/i], ["shaders", null, /\.(glsl|hlsl|shader|frag|vert)$/],
  ["xr-dev", /xr|openxr|webxr|arfoundation/i], ["webxr", /webxr|three|aframe/i], ["arcore", /arcore|arfoundation/i], ["quantum", /qiskit|cirq|pennylane/i], ["bioinformatics", /biopython|pysam|nextflow|snakemake/i], ["simulation", /simpy|gazebo|mujoco|gymnasium|ns3/i],
  ["ddd", null, /domain\/|aggregates?\//i], ["api-design", /openapi|swagger/i, /openapi|swagger/i], ["event-driven", /kafka|rabbitmq|nats|eventbridge|sns|pubsub|eventemitter/i], ["microservices", null, /services\/[^/]+\/(Dockerfile|package\.json)|docker-compose/i], ["distributed", /raft|etcd|zookeeper|consul|grpc/i], ["scalability", /k6|locust|autoscal|hpa|kafka|redis/i], ["load-balancing", /nginx|haproxy|traefik|envoy|elb/i, /nginx|haproxy/i],
  ["cloud-networking", null, /vpc|subnet|route53/i], ["iam", /iam|rbac|policy/i], ["cloud-security", /iam|guardduty|securityhub|policy|kms/i], ["finops", /cost.?explorer|cur\b|budget/i], ["sre-practices", null, /runbook|slo|postmortem|incident/i],
  ["technical-writing", null, /(^|\/)docs?\//i], ["requirements", null, /requirements?\.md|user-stories/i], ["systemdesign", null, /architecture\.md|docs\/adr|design\.md/i],
];
const PJ_SIG = Object.fromEntries(PJ_SIGNALS.map(s => [s[0], s]));

function pjFacts(ev, sub) {
  const files = (ev.files || []).map(f => f.toLowerCase()); const man = Object.entries(ev.manifests || {}).map(([k, v]) => k + "\n" + v).join("\n");
  const readme = ev.readme || "";
  const has = (re) => files.some(f => re.test(f)); const count = (re) => files.filter(f => re.test(f)).length;
  const srcFiles = files.filter(f => /\.(py|js|jsx|ts|tsx|java|go|rs|c|cpp|h|cs|kt|swift|dart|rb|php|sol|ino|sql|tf|yml|yaml)$/.test(f) && !/(node_modules|vendor|dist|build)\//.test(f));
  const testFiles = files.filter(f => /(^|\/)(tests?|__tests__|spec|e2e)\/|test_.*\.py$|_test\.(go|py)$|\.(test|spec)\.[jt]sx?$|tests?\.java$|test\.[a-z]+$/.test(f));
  const text = (man + "\n" + readme + "\n" + (sub?.docsText || "")).toLowerCase();
  return { files, man, readme, has, count, srcFiles, testFiles, text, topDirs: new Set(files.filter(f => f.includes("/")).map(f => f.split("/")[0])), sub: sub || {} };
}
function pjSkillStates(p, ev, F) {
  return p.skills.map(id => {
    const sig = PJ_SIG[id]; const signals = [];
    if (sig) {
      const [, dep, file, langs] = sig;
      if (langs && langs.some(l => (ev.languages?.[l] || 0) > 0)) signals.push("language in repository");
      if (file && F.has(file) && id !== "nodejs") signals.push("matching files");
      if (file && id === "nodejs" && F.has(file)) signals.push("package.json present");
      if (dep && id !== "nodejs" && F.man && dep.test(F.man)) signals.push("dependency/manifest reference");
      if (id === "git" && (ev.commits?.count || 0) >= 3) signals.push(`${ev.commits.count}+ commits`);
    }
    const nameRe = new RegExp(pjSkillName(id).replace(/\s*\(.*\)/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase());
    const mentioned = !signals.length && nameRe.test(F.text);
    const assessable = !!sig;
    return { id, name: pjSkillName(id), state: signals.length ? "detected" : mentioned ? "mentioned" : assessable ? "missing" : "unassessed", signals };
  });
}
const pjClamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
function evaluateSubmission(p, ev, ctx = {}) {
  const F = pjFacts(ev, ctx.submission); const lvIdx = PJ_LEVELS.indexOf(p.level); const cfg = PJ_LEVEL_CFG[p.level];
  const skills = pjSkillStates(p, ev, F);
  const assess = skills.filter(s => s.state !== "unassessed");
  const coverage = assess.length ? pjClamp(100 * assess.reduce((s, x) => s + (x.state === "detected" ? 1 : x.state === "mentioned" ? 0.35 : 0), 0) / assess.length) : 0;
  // structure
  const dirs = F.topDirs.size; const hasSrc = F.has(/(^|\/)(src|lib|app|cmd|internal|pkg|contracts|firmware|notebooks|infra|terraform)\//);
  const structure = pjClamp((F.files.length >= 4 ? 25 : F.files.length * 6) + (dirs >= 2 ? 25 : dirs * 12) + (hasSrc ? 20 : 0) + (F.has(/(^|\/)\.gitignore$/) ? 15 : 0) + (F.srcFiles.length >= 3 ? 15 : 0));
  // tests
  const tf = F.testFiles.length, ratio = F.srcFiles.length ? tf / F.srcFiles.length : 0;
  const ci = F.has(/\.github\/workflows\/|\.gitlab-ci\.yml|jenkinsfile|azure-pipelines|\.circleci/);
  const ciTests = ci && /test|pytest|jest|mvn|gradle|go test|cargo test|npm run|dotnet test/.test(F.text + (ev.workflowText || ""));
  const tests = pjClamp((tf ? 35 : 0) + Math.min(30, ratio * 150) + (tf >= 3 ? 10 : 0) + (ciTests ? 15 : ci ? 8 : 0) + (/\b(\d+)\s+(passed|passing)|coverage|✓|ok\b/.test(F.text) ? 10 : 0));
  // docs
  const rl = F.readme.length; const heads = (F.readme.match(/^#{1,3}\s/gm) || []).length;
  const docs = pjClamp(Math.min(30, rl / 40) + Math.min(20, heads * 5) + (/install|setup|getting started|run/.test(F.readme.toLowerCase()) ? 15 : 0) + (/architecture|design|decision/.test(F.text) ? 15 : 0) + (F.has(/(^|\/)docs?\//) ? 10 : 0) + (/!\[|<img/.test(F.readme) ? 10 : 0));
  // deployment
  const hasDocker = F.has(/(^|\/)dockerfile$|docker-compose/i), hasIac = F.has(/\.tf$|chart\.yaml|playbook|k8s|kubernetes|serverless\.ya?ml|template\.ya?ml/i);
  const depUrl = /^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(ctx.submission?.deployUrl || "");
  const deployment = pjClamp((hasDocker ? 35 : 0) + (hasIac ? 30 : 0) + (ci ? 20 : 0) + (depUrl ? 25 : 0) + (/deploy|hosted|live demo|docker run|docker compose/.test(F.text) ? 10 : 0));
  // architecture
  const layerDirs = ["controllers", "services", "models", "routes", "components", "handlers", "domain", "repositories", "views", "utils", "core", "api", "data", "features", "modules", "pages", "hooks", "store"].filter(d => F.has(new RegExp(`(^|/)${d}/`)));
  const diagram = F.has(/\.(png|svg|puml|mmd|drawio)$/) && F.has(/(docs?|diagrams?|architecture)/i);
  const architecture = pjClamp(Math.min(40, layerDirs.length * 14) + (diagram ? 20 : 0) + (/architecture/.test(F.text) ? 20 : 0) + (F.has(/adr\/|decision/) ? 10 : 0) + (dirs >= 3 ? 10 : 0));
  // code quality
  const lint = F.has(/eslint|\.prettierrc|ruff|pylintrc|flake8|\.editorconfig|tsconfig|mypy|pre-commit|checkstyle|golangci|clippy|rustfmt/);
  const msgs = ev.commits?.messages || []; const goodMsgs = msgs.filter(m => m.length >= 12 && !/^(update|fix|commit|changes?|wip|asdf|test)\.?$/i.test(m)).length;
  const quality = pjClamp((lint ? 25 : 0) + (tf ? 20 : 0) + (msgs.length ? 25 * goodMsgs / msgs.length : 0) + (structure >= 60 ? 15 : 5) + (hasSrc ? 10 : 0) + (F.has(/license/i) ? 5 : 0));

  // originality indicators
  const flags = []; const username = String(ctx.githubUsername || "").toLowerCase().replace(/^@/, ""); const owner = String(ev.meta?.ownerLogin || "").toLowerCase();
  const authors = ev.commits?.authors || [];
  const ownership = !username ? "unknown" : owner === username || authors.includes(username) ? "confirmed" : "mismatch";
  if (ev.meta?.fork) flags.push({ level: "red", text: "Repository is a fork — forks cannot be verified as original work." });
  if ((ev.commits?.count || 0) <= 1 && F.files.length >= 8) flags.push({ level: "red", text: "Entire project arrives in a single commit — no development history to verify." });
  if (ownership === "mismatch") flags.push({ level: "red", text: `Repository owner (${ev.meta.ownerLogin}) and commit authors do not match your GitHub username (${username}).` });
  if (ownership === "unknown") flags.push({ level: "warn", text: "Add your GitHub username in Settings so repository ownership can be confirmed." });
  if ((ev.commits?.count || 0) < cfg.minCommits && (ev.commits?.count || 0) > 1) flags.push({ level: "warn", text: `Only ${ev.commits.count} commits; ${p.levelLabel} projects normally show ${cfg.minCommits}+ incremental commits.` });
  if (ev.commits?.count >= 5 && ev.commits.activeDays <= 1) flags.push({ level: "warn", text: "All commits happened on one day — a real project usually evolves over several days." });
  if (ctx.startedAt && ev.meta?.createdAt && new Date(ev.meta.createdAt) < new Date(ctx.startedAt).getTime() - 86400000) flags.push({ level: "info", text: "Repository was created before you started this project in SkillPilot." });
  if (F.has(/(^|\/)\.env$/)) flags.push({ level: "warn", text: "A .env file is committed — remove it and rotate any keys." });
  if (F.has(/(^|\/)(node_modules|venv|\.venv|__pycache__)\//)) flags.push({ level: "warn", text: "Dependencies/build output are committed — add them to .gitignore." });
  if (ev.meta?.archived) flags.push({ level: "info", text: "Repository is archived (read-only)." });
  if (ev.truncated) flags.push({ level: "info", text: "Very large repository: file tree was truncated, so some signals may be missing." });
  const red = flags.filter(f => f.level === "red").length, warn = flags.filter(f => f.level === "warn" && !/username/.test(f.text)).length;
  const originality = pjClamp(100 - 35 * red - 8 * warn);

  // requirements
  const reqs = [];
  skills.filter(s => s.state !== "unassessed").slice(0, 7).forEach(s => reqs.push({ id: "skill-" + s.id, label: `Demonstrates ${s.name}`, met: s.state === "detected", why: s.state === "detected" ? `Found: ${s.signals.join(", ")}` : s.state === "mentioned" ? "Only mentioned in text — no code/config evidence found" : "No evidence found in the repository" }));
  reqs.push({ id: "readme", label: "README explains setup and usage", met: docs >= 45, why: `Documentation score ${docs}` });
  reqs.push({ id: "tests", label: "Automated tests present", met: tf > 0 && tests >= 40, why: tf ? `${tf} test file(s)` : "No test files found" });
  reqs.push({ id: "structure", label: "Organised project structure", met: structure >= 50, why: `Structure score ${structure}` });
  if (lvIdx >= 1) { reqs.push({ id: "ci", label: "CI pipeline configured", met: ci, why: ci ? "Workflow/pipeline file found" : "No CI configuration found" });
    reqs.push({ id: "repro", label: "Reproducible environment (container / IaC / pinned deps)", met: hasDocker || hasIac || /lock|requirements|go\.sum|cargo\.lock/.test(F.files.join(" ")), why: hasDocker || hasIac ? "Container or IaC found" : "No container, IaC or lockfile found" }); }
  if (lvIdx === 2) { reqs.push({ id: "arch", label: "Architecture documented", met: architecture >= 45, why: `Architecture score ${architecture}` });
    reqs.push({ id: "measure", label: "Measured results (benchmarks, load or evaluation)", met: /benchmark|load test|latency|throughput|p95|p99|accuracy|f1|k6|locust|jmeter/.test(F.text), why: "Looked for benchmark/evaluation evidence in README, docs and manifests" }); }
  if (p.entities.length) reqs.push({ id: "data", label: "Data model implemented", met: F.has(/schema|migration|models?\b|\.prisma|\.sql$/) || p.entities.some(e => F.text.includes(e.replace(/s$/, ""))), why: "Looked for schema/migrations/models" });
  const completion = reqs.length ? pjClamp(100 * reqs.filter(r => r.met).length / reqs.length) : 0;
  const technical = pjClamp(0.3 * coverage + 0.2 * tests + 0.15 * architecture + 0.15 * structure + 0.1 * deployment + 0.1 * quality);
  const overall = pjClamp(0.3 * completion + 0.3 * technical + 0.15 * docs + 0.1 * quality + 0.15 * originality);

  const suggestions = [];
  skills.filter(s => s.state === "missing").slice(0, 3).forEach(s => suggestions.push(`Show ${s.name} in code or configuration, not only in the README.`));
  skills.filter(s => s.state === "mentioned").slice(0, 2).forEach(s => suggestions.push(`${s.name} is mentioned but not evidenced — commit the files or dependencies that use it.`));
  if (tests < 50) suggestions.push("Add automated tests (unit + one end-to-end path) and show how to run them.");
  if (docs < 55) suggestions.push("Expand the README: setup, usage, architecture, decisions and screenshots.");
  if (lvIdx >= 1 && !ci) suggestions.push("Add a CI workflow that runs tests on every push.");
  if (architecture < 45 && lvIdx >= 1) suggestions.push("Separate concerns into modules/layers and add an architecture diagram to docs.");
  if (!lint) suggestions.push("Add a linter/formatter configuration to show code-quality discipline.");
  if (deployment < 35 && lvIdx >= 1) suggestions.push("Provide a Dockerfile, IaC or deployment URL so others can run it.");
  red && suggestions.unshift("Resolve the red originality flags above, then resubmit.");
  const evaluation = { projectId: p.id, at: pjNow(), mode: "repository", repo: ev.meta?.fullName, completion, technical, codeQuality: quality, architecture, docs, testing: tests, deployment, structure, originality, coverage, overall,
    skills, requirements: reqs, missing: reqs.filter(r => !r.met).map(r => r.label), suggestions: suggestions.slice(0, 8), flags,
    summary: { files: ev.files?.length || 0, commits: ev.commits?.count || 0, activeDays: ev.commits?.activeDays || 0, languages: Object.keys(ev.languages || {}).slice(0, 6), testFiles: tf, stars: ev.meta?.stars || 0, pushedAt: ev.meta?.pushedAt } };
  evaluation.verification = verificationDecision(evaluation, { ownership, source: ev.source, verifiedBy: ctx.verifiedBy || "browser" });
  return evaluation;
}
// Evidence without a repository (docs, screenshots, test output, video, URL) is scored but can never be "verified".
function evaluateEvidenceOnly(p, sub = {}, ctx = {}) {
  const urlOk = (u) => /^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(u || "");
  const docs = (sub.docsText || "").length; const shots = (sub.screenshots || []).filter(urlOk).length;
  const tr = sub.testResults || ""; const pass = parseInt((tr.match(/(\d+)\s*(passed|passing|ok)/i) || [])[1] || "0", 10); const fail = parseInt((tr.match(/(\d+)\s*(failed|failing|errors?)/i) || [])[1] || "0", 10);
  const docsScore = pjClamp(Math.min(70, docs / 20) + (/architecture|design|decision/i.test(sub.docsText || "") ? 15 : 0) + (/install|setup|run/i.test(sub.docsText || "") ? 15 : 0));
  const testing = pass ? pjClamp(50 + Math.min(40, pass * 2) - fail * 15) : tr.length > 40 ? 25 : 0;
  const deployment = pjClamp((urlOk(sub.deployUrl) ? 60 : 0) + (urlOk(sub.videoUrl) ? 20 : 0) + Math.min(20, shots * 7));
  const overall = Math.min(60, pjClamp(0.4 * docsScore + 0.3 * testing + 0.3 * deployment));
  const missing = []; if (!sub.repoUrl) missing.push("Source repository URL (required for verification)"); if (!pass) missing.push("Test results showing passing tests"); if (!urlOk(sub.deployUrl)) missing.push("Deployment URL"); if (shots < 2) missing.push("At least two screenshot links"); if (docs < 400) missing.push("Documentation text (≥400 characters)");
  return { projectId: p.id, at: pjNow(), mode: "evidence-only", completion: overall, technical: 0, codeQuality: 0, architecture: 0, docs: docsScore, testing, deployment, structure: 0, originality: 0, coverage: 0, overall,
    skills: p.skills.map(s => ({ id: s, name: pjSkillName(s), state: "unassessed", signals: [] })), requirements: [], missing, flags: [{ level: "info", text: "Evidence-only submissions are self-provided and cannot be independently verified. Submit a GitHub repository to be eligible for verification." }],
    suggestions: missing.map(m => `Add: ${m}`), summary: {}, verification: { status: "submitted", reasons: ["No repository was analysed, so claims could not be independently checked."], ownership: "unknown", verifiedBy: null } };
}
// Self-reported ≠ submitted ≠ verified. Only a successful live repository analysis can produce "verified".
function verificationDecision(ev, info = {}) {
  const reasons = []; const t = { overall: 65, coverage: 55, completion: 60 };
  if (info.source !== "github") reasons.push("The repository could not be analysed live.");
  if (ev.overall < t.overall) reasons.push(`Overall score ${ev.overall} is below ${t.overall}.`);
  if (ev.coverage < t.coverage) reasons.push(`Required-skill coverage ${ev.coverage}% is below ${t.coverage}%.`);
  if (ev.completion < t.completion) reasons.push(`Only ${ev.completion}% of requirements are met (need ${t.completion}%).`);
  if (ev.flags.some(f => f.level === "red")) reasons.push("Red originality/ownership flags must be resolved.");
  if (info.ownership === "unknown") reasons.push("Add your GitHub username in Settings to confirm ownership.");
  if (info.ownership === "mismatch") reasons.push("Repository ownership could not be matched to your GitHub username.");
  const ok = reasons.length === 0;
  return { status: ok ? "verified" : "submitted", reasons: ok ? ["Repository analysed live: ownership confirmed, requirements and skills evidenced, no originality red flags."] : reasons, ownership: info.ownership || "unknown", verifiedBy: ok ? info.verifiedBy || "browser" : null,
    note: "Automated verification of public repository evidence — it is not a human code review." };
}

// ------------------------------- AI Project Mentor -------------------------
const PJ_DEBUG = [
  [/cannot find module|modulenotfounderror|no module named|importerror/i, "Missing module / import error", ["Dependency not installed in the active environment", "Wrong import path or name", "Virtual environment not activated"], ["Run the install command again (npm install / pip install -r requirements.txt)", "Check the exact spelling and relative path", "Confirm which interpreter/environment is running (which python, node -v)"]],
  [/cors|access-control-allow-origin/i, "CORS error", ["Server does not send Access-Control-Allow-Origin for your front-end origin", "Preflight (OPTIONS) request is rejected"], ["Open the network tab: is the OPTIONS request failing?", "Enable the CORS middleware for the exact origin only", "Never use '*' with credentials"]],
  [/401|unauthori[sz]ed|403|forbidden|invalid token|jwt/i, "Authentication / authorisation failure", ["Token missing, expired or sent in the wrong header", "Secret or audience mismatch", "Role check failing"], ["Print the decoded token claims (not the secret)", "Confirm the Authorization: Bearer header is sent", "Compare server clock/expiry settings"]],
  [/econnrefused|connection refused|timeout|timed out|enotfound/i, "Connection refused / timeout", ["Service not running or wrong host/port", "Inside Docker, localhost refers to the container itself", "Firewall or security group blocks the port"], ["Check the service is listening (ss -ltnp / docker ps)", "Use the service name (not localhost) between containers", "Test with curl from the same place the app runs"]],
  [/permission denied|eacces|access denied/i, "Permission denied", ["File or port needs different permissions", "Running as the wrong user", "IAM/role lacks the action"], ["Check ls -l and the running user", "For cloud: read the exact denied action in the error and grant only that", "Avoid chmod 777 / admin shortcuts"]],
  [/undefined is not|cannot read propert|nullpointer|nonetype|attributeerror|typeerror/i, "Null / undefined value", ["A value you assumed exists is missing", "Async data used before it arrives", "Wrong variable shape"], ["Log the value just before the failing line", "Check where it should have been set", "Add an explicit guard and a test for the empty case"]],
  [/syntaxerror|unexpected token|parse error|indentationerror/i, "Syntax error", ["Missing bracket/quote/comma or bad indentation", "Wrong language version or file type (JSON vs JS)"], ["Look at the line before the reported line", "Run a formatter or linter", "Bisect: comment out half the file"]],
  [/port.*already in use|eaddrinuse/i, "Port already in use", ["Another process or an old instance is running"], ["Find the process using the port (lsof -i :PORT)", "Stop it or choose another port via config"]],
  [/sql|relation .* does not exist|no such table|duplicate key|constraint/i, "Database error", ["Migration not applied or wrong database", "Constraint violated by your data", "Wrong connection settings"], ["Print the connection string (without password) and confirm database name", "Run migrations on a clean database", "Read which constraint failed and why"]],
  [/cuda|out of memory|oom|killed/i, "Out-of-memory", ["Batch size/data too large", "Memory leak or unbounded cache"], ["Reduce batch size or stream the data", "Profile memory over time", "Set resource limits and check the logs for what grew"]],
  [/merge conflict|rejected.*non-fast-forward|detached head/i, "Git problem", ["Local and remote history diverged"], ["git status and git log --oneline --graph", "Pull with rebase or merge deliberately", "Resolve conflicts file by file, then run the tests"]],
  [/terraform|state lock|already exists|invalidparameter|accessdenied/i, "Infrastructure/provisioning error", ["Existing resource or stale state", "Missing permission or invalid parameter"], ["Read the first error, not the last", "terraform plan to compare desired and actual", "Check naming collisions and region/account"]],
  [/docker|image|container exited|exec format/i, "Container problem", ["Wrong base image/architecture", "Command exits immediately", "Missing files in the build context"], ["docker logs <container>", "Run the image interactively with a shell", "Check .dockerignore and the working directory"]],
  [/cors|mixed content|ssl|certificate|tls/i, "TLS / certificate error", ["Self-signed or expired certificate", "HTTP/HTTPS mismatch"], ["Check the certificate chain and expiry", "Do not disable verification in production"]],
  [/test.*fail|assertionerror|expected .* received|flaky/i, "Failing test", ["Test and code disagree about expected behaviour", "Shared state between tests", "Timing assumptions"], ["Run the single test alone", "Print actual vs expected", "Decide whether the test or the code is wrong before editing either"]],
  [/overfit|accuracy|loss.*nan|nan loss|not converg|leak/i, "Model training problem", ["Data leakage or bad split", "Learning rate too high", "Unscaled features or NaNs"], ["Check the split and for target leakage", "Plot training vs validation curves", "Try a simple baseline for comparison"]],
  [/revert|out of gas|reentran|vm exception/i, "Smart-contract revert", ["Require condition failed", "Insufficient gas or balance", "Access-control restriction"], ["Read the revert reason in the test output", "Trace the call with the framework's debugger", "Write a failing test reproducing it first"]],
];
function pjFindSkill(msg, p) {
  const m = msg.toLowerCase();
  const pool = [...p.skills, ...Object.keys(SKILL_LIB)];
  return pool.find(id => { const n = pjSkillName(id).toLowerCase().replace(/\s*\(.*\)/, ""); return n.length > 1 && new RegExp("(^|[^a-z0-9])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)").test(m); });
}
function pjExplainCode(code) {
  const lines = code.split("\n"); const lang = /def |import |print\(|:\s*$/m.test(code) && !/;\s*$/m.test(code) ? "Python" : /function|const |let |=>|console\./.test(code) ? "JavaScript/TypeScript" : /public |class |void |System\./.test(code) ? "Java/C#" : /SELECT |INSERT |CREATE TABLE/i.test(code) ? "SQL" : "this language";
  const fns = (code.match(/\b(def|function|func|fn)\s+\w+|=>\s*[{(]/g) || []).length; const out = [`Looks like ${lang}: ${lines.length} lines, about ${fns} function(s).`];
  const notes = [];
  if (/password\s*=\s*["'][^"']+["']|api[_-]?key\s*=\s*["'][^"']+["']|secret\s*=\s*["']/i.test(code)) notes.push("A secret appears to be hard-coded. Move it to an environment variable and rotate it if it was ever committed.");
  if (/eval\(|exec\(|innerHTML\s*=/.test(code)) notes.push("eval/exec/innerHTML can execute untrusted input. What input reaches this line?");
  if (/(SELECT|INSERT|UPDATE|DELETE)[^;\n]*["'`]\s*\+|f["'](SELECT|INSERT)|\$\{[^}]+\}[^;\n]*(WHERE|VALUES)/i.test(code)) notes.push("SQL is built from strings. Use parameterised queries to prevent SQL injection.");
  if (/catch\s*\([^)]*\)\s*\{\s*\}|except\s*:\s*pass|except Exception:\s*pass/.test(code)) notes.push("An error is swallowed silently. At minimum log it or handle it intentionally.");
  if (/console\.log|print\(/.test(code)) notes.push("Debug output is present — replace it with proper logging before submission.");
  if (/TODO|FIXME/.test(code)) notes.push("There are TODO/FIXME markers; decide which are required before you submit.");
  if (lines.some(l => l.length > 140)) notes.push("Some lines are very long; consider splitting for readability.");
  if (/==[^=]/.test(code) && /javascript|typescript/i.test(lang)) notes.push("Prefer === over == in JavaScript to avoid type coercion surprises.");
  return { summary: out, notes, questions: ["Walk through the first function: what are its inputs, outputs and side effects?", "Which line would you change first if requirements changed, and what test would protect that change?"] };
}
function projectMentorReply(p, message, ctx = {}) {
  const msg = String(message || "").trim(); const m = msg.toLowerCase(); const ws = projectWorkspace(p);
  const reply = (intent, title, body = {}) => ({ intent, title, paragraphs: body.paragraphs || [], bullets: body.bullets || [], questions: body.questions || [], resources: body.resources || [] });
  if (!msg) return reply("empty", "Ask me anything about this project", { bullets: ["“Explain the requirements”", "“Explain the architecture”", "“What should I do next?”", "“I get an error: …” (paste it)", "“Explain Docker” (any skill or technology)", "“Review my decision: …”", "“Help me with the README / final report”"] });
  if (/(write|generate|build|create|give|code).{0,25}(entire|whole|full|complete|all (of )?the)\b.{0,20}(project|app|application|code|solution|repo)|do (it|the project) for me|just give me the (code|solution)/i.test(m))
    return reply("decline-generate", "I'll help you build it — not build it for you", { paragraphs: ["This project exists to prove YOUR skills, and verification checks your own repository, so generating the whole thing would defeat its purpose (and wouldn't teach you anything).", "Here is what I can do instead:"],
      bullets: ["Break the next task into smaller steps and explain the concept behind each", "Review a snippet you wrote and point out issues", "Explain an error and how to investigate it", "Show you the repository structure to fill in (see the Workspace tab)"], questions: ["Which task from the workspace are you on, and what have you tried so far?"] });
  const dbg = PJ_DEBUG.find(d => d[0].test(msg));
  if (/error|exception|traceback|stack ?trace|not working|doesn'?t work|fails?|failed|bug|crash|cannot|can't|unable/.test(m) && (dbg || msg.length > 20)) {
    if (dbg) return reply("debug", `Debugging: ${dbg[1]}`, { paragraphs: ["Let's investigate rather than guess. Likely causes:"], bullets: [...dbg[2].map(c => "Cause: " + c), ...dbg[3].map(c => "Check: " + c)], questions: ["What exactly changed just before this started?", "What do the first and the last lines of the error say? (the first is usually the real cause)"] });
    return reply("debug", "Let's debug methodically", { paragraphs: ["I can't see your machine, so let's narrow it down together:"], bullets: ["Reproduce it reliably — what are the exact steps?", "Read the first error message, not the last one", "Find the smallest input or code that still fails", "Check what changed since it last worked (git diff)", "Add a log or print just before the failing line to test your assumption"], questions: ["Can you paste the full error text and the few lines of code around it?"] });
  }
  if (/```/.test(msg) || (/explain|what does|how does|review/.test(m) && msg.split("\n").length >= 4)) {
    const r = pjExplainCode(msg.replace(/```\w*/g, ""));
    return reply("explain-code", "Reading your code", { paragraphs: r.summary, bullets: r.notes.length ? r.notes : ["Nothing obviously risky in what you pasted; the next question is how you'd test it."], questions: r.questions });
  }
  if (/architect|diagram|components?|how.*(fit|connect)|design of/.test(m)) return reply("architecture", `Architecture of ${p.name}`, { paragraphs: [`Think of it as layers, left to right: ${ws.architecture.map(l => l[0]).join(" → ")}.`],
    bullets: ws.architecture.map(l => `${l[0]}: ${l.slice(1).join(" · ")}`), questions: ["Which layer would you build first to prove the riskiest assumption?", "Where does validation live, and why there?", "What is the single point of failure in your sketch?"] });
  if (/requirement|what (do|should) i (need|have)|expect|what is this project|brief|scope/.test(m)) return reply("requirements", `Requirements: ${p.name}`, { paragraphs: [`The real-world problem: ${p.problem}`, `Level: ${p.levelLabel} · about ${p.duration}.`],
    bullets: [...p.objectives.slice(0, 4), ...p.deliverables.map(d => "Deliverable: " + d)], questions: ["Can you restate the problem in your own words in two sentences?"] });
  if (/readme|document/.test(m)) return reply("docs", "README outline that verifies well", { paragraphs: ["A reviewer should be able to understand and run your project in 10 minutes."], bullets: ["# Name + one-line problem statement", "Features and what is out of scope", "Architecture (diagram + 5-sentence explanation)", "Setup and run (exact commands)", "Testing (how to run, what is covered, latest results)", "Decisions and trade-offs (what you rejected and why)", "Known limitations and next steps", "Screenshots / demo link"], questions: ["Which decision in your project would you most like a reviewer to understand?"] });
  if (/report|write.?up|post.?mortem|retrospective|reflection/.test(m)) return reply("report", "Final report structure", { paragraphs: ["Evidence of thinking matters as much as working code."], bullets: ["Problem and success criteria", "Design and the alternatives you considered", "Implementation highlights (not a code dump)", "Testing and results (numbers, not adjectives)", "What went wrong and how you diagnosed it", "What you'd change at 10× scale or with more time", "What you learned"], questions: ["What was the hardest bug and what did it teach you?"] });
  if (/next|stuck|where (do|should) i (start|begin)|what now|start/.test(m)) {
    const nextT = ws.phases.flatMap(ph => ph.tasks).find(t => !ctx.entry?.tasks?.[t.id]);
    return nextT ? reply("next-step", `Next: ${nextT.title}`, { paragraphs: [nextT.detail], questions: [nextT.hint || "What is the smallest version of this you can finish in 30 minutes?"], bullets: ["Make a small commit when this works"] }) : reply("next-step", "All tasks are ticked", { paragraphs: ["Review the testing and deployment checklists, then submit your evidence for verification."] });
  }
  if (/should i|which (is )?better|is it ok|is it fine|trade.?off|versus| vs |decision|review my/.test(m)) return reply("decision", "Reviewing a decision", { paragraphs: ["I won't just pick for you — a defensible decision is what reviewers look for. Test it against these questions:"],
    bullets: ["What requirement does this choice serve? (cite it)", "What are two alternatives and what does each cost?", "What happens when it fails or when load doubles?", "How hard is it to reverse later?", "Does it match the skills this project must demonstrate?"], questions: ["Write your choice, the alternative, and the deciding reason in three lines — I'll challenge it."] });
  if (/improve|better|feedback|polish|weak/.test(m)) {
    const ev = ctx.entry?.evaluation;
    return reply("improve", "How to improve it", ev ? { paragraphs: [`Based on your latest evaluation (overall ${ev.overall}):`], bullets: ev.suggestions.length ? ev.suggestions : ["Evaluation found no major gaps — document your trade-offs."], questions: ["Which single suggestion gives the biggest credibility gain for the least work?"] }
      : { paragraphs: ["Submit your repository for evaluation to get specific, evidence-based suggestions. Meanwhile:"], bullets: ["Add tests for failure paths", "Add CI", "Record measurements, not claims", "Explain one design trade-off in the README"] });
  }
  const sk = pjFindSkill(msg, p);
  if (sk && /explain|what is|what's|how|why|learn|teach|use|work/.test(m)) {
    const s = SKILL_LIB[sk];
    return reply("technology", `Understanding ${s.name}`, { paragraphs: [`${s.purpose || s.name + " is used in this project."}`, p.skills.includes(sk) ? `Why it is in ${p.name}: it is one of the required skills, so verification looks for real use of it in your code or configuration.` : "It is not required by this project, but it may still help."],
      bullets: [s.deps?.length ? `Build on first: ${s.deps.map(pjSkillName).join(", ")}` : "No hard prerequisites", `Micro-exercise: create a tiny, separate example that uses only ${s.name}, then integrate it into the project.`], resources: skillResources(sk, s.name), questions: [`Where exactly in ${p.name} will ${s.name} be used, and what would break without it?`] });
  }
  return reply("help", "How I can help", { paragraphs: ["I'm a rule-based mentor: I explain, ask questions and point to docs — I don't write your project."], bullets: ["Requirements and scope", "Architecture and components", "A technology you're unsure about (e.g. “explain " + pjSkillName(p.skills[0]) + "”)", "Debugging (paste the error)", "Explaining or reviewing code you paste", "README and final-report structure", "“What should I do next?”"] });
}
