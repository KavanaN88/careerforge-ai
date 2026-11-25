// ============================================================================
// ASSESSMENT QUESTION BANK — hand-written, answer-checked technical questions.
// Shape: QBANK[skillId] = { basic: [...], intermediate: [...], advanced: [...] }
// Every skill NOT listed here still gets Basic/Intermediate/Advanced assessments from the generated
// pools in assessmentEngine.js (derived from the skill library and role graphs).
// Question types: mcq | multi | tf | output (predict output) | debug (find the bug) | scenario.
// ============================================================================
const mc  = (topic, q, options, answer, explain, code) => ({ type: "mcq", topic, q, options, answer, explain, code });
const ms  = (topic, q, options, answer, explain, code) => ({ type: "multi", topic, q, options, answer, explain, code });
const tf  = (topic, q, truth, explain, code) => ({ type: "tf", topic, q, options: ["True", "False"], answer: truth ? 0 : 1, explain, code });
const out = (topic, q, code, options, answer, explain) => ({ type: "output", topic, q, options, answer, explain, code });
const dbg = (topic, q, code, options, answer, explain) => ({ type: "debug", topic, q, options, answer, explain, code });
const sc  = (topic, q, options, answer, explain) => ({ type: "scenario", topic, q, options, answer, explain });

const QBANK = {
  python: {
    basic: [
      mc("Syntax", "Which keyword defines a function in Python?", ["func", "def", "function", "lambda only"], 1, "Functions are defined with `def`."),
      out("Data types", "What does this print?", "print(type([1, 2]).__name__)", ["tuple", "list", "array", "set"], 1, "[1, 2] is a list literal."),
      tf("Data types", "Python tuples are mutable.", false, "Tuples are immutable; lists are mutable."),
      out("Operators", "What is the output?", "print(7 // 2, 7 % 2)", ["3.5 1", "3 1", "4 1", "3 0"], 1, "// is floor division (3) and % is remainder (1)."),
    ],
    intermediate: [
      out("Mutability", "What does this print?", "def add(x, acc=[]):\n    acc.append(x)\n    return acc\nadd(1)\nprint(add(2))", ["[2]", "[1, 2]", "[1]", "Error"], 1, "The default list is created once and shared between calls, so it keeps 1 from the first call."),
      dbg("Scoping", "Why does this raise UnboundLocalError?", "count = 0\ndef inc():\n    count += 1\ninc()", ["count is a reserved word", "Assigning inside the function makes count local, but it has no value yet", "Functions cannot read globals", "int is immutable so += is illegal"], 1, "Assignment makes `count` local to inc(); use `global count` or return a value."),
      out("Comprehensions", "What is the output?", "print([x * x for x in range(5) if x % 2 == 0])", ["[0, 4, 16]", "[0, 1, 4, 9, 16]", "[4, 16]", "[1, 9]"], 0, "Only even x (0, 2, 4) are squared."),
      ms("Data structures", "Select all that are hashable and can be dictionary keys:", ["tuple of ints", "list", "str", "set"], [0, 2], "Immutable hashable types (str, tuple of hashables) work; lists and sets do not."),
    ],
    advanced: [
      out("Generators", "What does this print?", "def g():\n    for i in range(3):\n        yield i\ng1 = g()\nprint(list(g1), list(g1))", ["[0, 1, 2] [0, 1, 2]", "[0, 1, 2] []", "[] []", "[0, 1, 2] [1, 2]"], 1, "A generator is exhausted after the first full iteration."),
      sc("Concurrency", "A CPU-bound Python task is slow with threads. What is the most effective fix in CPython?", ["Add more threads", "Use multiprocessing (separate processes)", "Use time.sleep(0)", "Switch to a list comprehension"], 1, "The GIL prevents CPU-bound threads running in parallel; processes bypass it."),
      dbg("Closures", "These lambdas are meant to return 0, 1, 2. What is the bug?", "fs = [lambda: i for i in range(3)]\nprint([f() for f in fs])", ["range is lazy", "Lambdas capture the variable i, so all return 2", "lambda cannot be in a list", "Nothing, prints [0, 1, 2]"], 1, "Closures bind late; all see the final i = 2. Use `lambda i=i: i`."),
      mc("Internals", "Which statement about `is` vs `==` is correct?", ["`is` compares values, `==` compares identity", "`==` compares values, `is` compares object identity", "They are always equivalent", "`is` only works with ints"], 1, "`is` checks identity; `==` calls __eq__."),
    ],
  },
  javascript: {
    basic: [
      mc("Syntax", "Which declares a block-scoped variable that can be reassigned?", ["var", "let", "const", "static"], 1, "`let` is block scoped and reassignable; `const` cannot be reassigned."),
      out("Operators", "What is the output?", "console.log(typeof null)", ["null", "undefined", "object", "number"], 2, "A long-standing quirk: typeof null is \"object\"."),
      tf("Equality", "`0 == '0'` is true in JavaScript.", true, "Loose equality coerces the string to a number."),
      out("Arrays", "What is logged?", "console.log([1, 2, 3].map(n => n * 2))", ["[1, 2, 3]", "[2, 4, 6]", "6", "undefined"], 1, "map returns a new array with each element doubled."),
    ],
    intermediate: [
      out("Async", "What order is logged?", "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", ["A B C D", "A D C B", "A C D B", "A D B C"], 1, "Sync code first (A, D), then microtasks (C), then timers (B)."),
      out("Scope", "What is logged?", "for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));", ["0 1 2", "3 3 3", "2 2 2", "undefined x3"], 1, "var is function scoped, so every callback sees i = 3."),
      dbg("this", "Why is `this.name` undefined?", "const o = { name: 'x', hi() { return [1].map(function () { return this.name; }); } };\nconsole.log(o.hi());", ["map cannot return strings", "A regular function callback has its own `this`", "name is private", "o is frozen"], 1, "Use an arrow function or bind to keep the outer `this`."),
      ms("Arrays", "Which methods return a NEW array without mutating the original?", ["map", "push", "filter", "splice"], [0, 2], "map and filter are non-mutating; push and splice mutate."),
    ],
    advanced: [
      out("Event loop", "What is the output order?", "async function f(){ console.log(1); await null; console.log(2); }\nf(); console.log(3);", ["1 2 3", "1 3 2", "3 1 2", "2 1 3"], 1, "await yields to the microtask queue; the caller's console.log(3) runs first."),
      dbg("Closures / memory", "What is the likely production issue?", "const cache = {};\nfunction handle(req) { cache[req.id] = req.body; }", ["Cache is read-only", "Unbounded growth leads to a memory leak", "req.id must be numeric", "Closures are not allowed"], 1, "Entries are never evicted; use an LRU/TTL or WeakMap where applicable."),
      sc("Performance", "A page janks while processing a 50 MB array on the main thread. Best approach?", ["Wrap the loop in try/catch", "Move the work to a Web Worker", "Use var instead of let", "Call it inside setTimeout(…, 0) once"], 1, "Workers run off the main thread and keep the UI responsive."),
      mc("Prototypes", "What does `Object.create(proto)` do?", ["Copies all properties of proto", "Creates a new object whose prototype is proto", "Freezes proto", "Creates a class"], 1, "The new object delegates lookups to proto via the prototype chain."),
    ],
  },
  typescript: {
    basic: [
      mc("Types", "Which type should be used when a value could be anything but you still want type checks before using it?", ["any", "unknown", "never", "void"], 1, "`unknown` forces narrowing before use; `any` disables checking."),
      tf("Compilation", "TypeScript types exist at runtime in the compiled JavaScript.", false, "Types are erased during compilation."),
      mc("Syntax", "How do you mark a property as optional in an interface?", ["name!: string", "name?: string", "name: string?", "optional name: string"], 1, "Use the `?` after the property name."),
      mc("Types", "What does `string[]` describe?", ["A tuple of one string", "An array of strings", "A string with brackets", "A generic string"], 1, "It is an array whose elements are strings."),
    ],
    intermediate: [
      dbg("Narrowing", "Why does the compiler complain?", "function len(x: string | number) { return x.length; }", ["number has no length so the union is not narrowed", "length is private", "Functions cannot take unions", "string has no length"], 0, "Narrow with typeof x === 'string' before using string members."),
      mc("Generics", "What is the purpose of `function id<T>(x: T): T`?", ["Make x optional", "Preserve the input type in the return type", "Force T to be a string", "Disable type checking"], 1, "Generics link types between parameters and results."),
      ms("Utility types", "Select the built-in utility types:", ["Partial<T>", "Pick<T, K>", "Mutable<T>", "Omit<T, K>"], [0, 1, 3], "Partial, Pick and Omit exist; Mutable<T> is not built in."),
      mc("Config", "What does `strict: true` in tsconfig enable?", ["Only semicolon checks", "A family of strict type-checking options (e.g. strictNullChecks)", "Minification", "ES5 output"], 1, "It turns on options such as noImplicitAny and strictNullChecks."),
    ],
    advanced: [
      mc("Type system", "What does this type evaluate to?\n`type R = Exclude<'a' | 'b' | 'c', 'a'>`", ["'a'", "'b' | 'c'", "'a' | 'b' | 'c'", "never"], 1, "Exclude removes union members assignable to 'a'."),
      sc("Design", "You parse JSON from an API. How do you keep type safety without trusting the payload blindly?", ["Cast with `as any`", "Validate at runtime (e.g. a schema/type guard) and then narrow", "Use @ts-ignore", "Declare the interface only"], 1, "Compile-time types do not validate runtime data; use a guard or schema validator."),
      dbg("Variance", "Why is this unsafe?", "const a: (string | number)[] = ['x'];\nconst b: string[] = a as string[];\na.push(1);\nb[1].toUpperCase();", ["Arrays are covariant and the cast hides that b now holds a number", "toUpperCase is deprecated", "push is readonly", "No problem"], 0, "The cast lets b alias a mixed array; the runtime call fails on a number."),
      mc("Type system", "What does the `satisfies` operator do?", ["Casts a value", "Checks a value matches a type while keeping its narrower inferred type", "Makes values readonly", "Imports a type"], 1, "It validates conformance without widening the inferred type."),
    ],
  },
  java: {
    basic: [
      mc("Language", "Which is the entry point signature of a Java program?", ["void main()", "public static void main(String[] args)", "static main(String args)", "public void run()"], 1, "The JVM looks for public static void main(String[])."),
      tf("Types", "`int` is an object type in Java.", false, "int is a primitive; Integer is its wrapper object."),
      out("Strings", "What is printed?", "String a = \"hi\"; String b = new String(\"hi\");\nSystem.out.println(a == b);", ["true", "false", "Compile error", "null"], 1, "== compares references; new String creates a new object."),
      mc("OOP", "Which keyword is used to inherit from a class?", ["implements", "extends", "inherits", "super"], 1, "Classes extend classes and implement interfaces."),
    ],
    intermediate: [
      out("Collections", "What is the output?", "List<Integer> l = new ArrayList<>(List.of(1,2,3));\nl.remove(1);\nSystem.out.println(l);", ["[2, 3]", "[1, 3]", "[1, 2]", "Error"], 1, "remove(int) removes by index, so index 1 (value 2) is removed."),
      dbg("Exceptions", "What is wrong with this code?", "try { risky(); }\ncatch (Exception e) {}", ["Nothing", "The exception is swallowed silently, hiding failures", "catch needs a finally", "Exception cannot be caught"], 1, "Empty catch blocks hide errors; log or rethrow."),
      mc("equals/hashCode", "If you override equals() you should also override:", ["toString()", "hashCode()", "finalize()", "clone()"], 1, "Equal objects must return equal hash codes or HashMap/HashSet break."),
      ms("OOP", "Select the valid uses of `final`:", ["A variable that cannot be reassigned", "A class that cannot be extended", "A method that cannot be overridden", "A package"], [0, 1, 2], "final applies to variables, methods and classes."),
    ],
    advanced: [
      sc("Concurrency", "Two threads increment a shared int counter and the total is wrong. Best fix?", ["Declare it volatile only", "Use AtomicInteger or synchronize the increment", "Use a larger int", "Call System.gc()"], 1, "count++ is not atomic; volatile does not make read-modify-write atomic."),
      mc("JVM", "Which memory area stores objects created with `new`?", ["Stack", "Heap", "Method local registers", "Metaspace only"], 1, "Objects live on the heap; references live on the stack."),
      dbg("Collections", "Why does this throw ConcurrentModificationException?", "for (String s : list) { if (s.isEmpty()) list.remove(s); }", ["list is final", "The list is structurally modified while iterating", "Strings are immutable", "isEmpty is deprecated"], 1, "Use Iterator.remove() or removeIf."),
      mc("Streams", "What does `stream().map(...)` do until a terminal operation is called?", ["Executes immediately", "Nothing — intermediate operations are lazy", "Throws an exception", "Sorts the stream"], 1, "Streams are lazy; work happens at the terminal operation."),
    ],
  },
  sql: {
    basic: [
      mc("Queries", "Which clause filters rows BEFORE grouping?", ["HAVING", "WHERE", "ORDER BY", "LIMIT"], 1, "WHERE filters rows; HAVING filters groups."),
      mc("Queries", "Which statement retrieves data?", ["GET", "SELECT", "FETCH TABLE", "READ"], 1, "SELECT reads rows."),
      tf("Keys", "A primary key can contain duplicate values.", false, "Primary keys uniquely identify rows."),
      mc("Aggregates", "Which function counts rows?", ["SUM()", "COUNT()", "TOTAL()", "ROWS()"], 1, "COUNT(*) returns the number of rows."),
    ],
    intermediate: [
      mc("Joins", "Which join returns all rows from the left table even with no match on the right?", ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN only"], 1, "LEFT JOIN keeps unmatched left rows with NULLs on the right."),
      dbg("NULL", "Why does this return no rows when some phones are NULL?", "SELECT * FROM users WHERE phone = NULL;", ["= NULL never matches; use IS NULL", "phone must be quoted", "NULL is a keyword you can't use", "The query is correct"], 0, "Comparisons with NULL yield unknown; use IS NULL."),
      out("Grouping", "Table t has values (a: 1, 2) and (b: 5). What does `SELECT g, SUM(v) FROM t GROUP BY g ORDER BY g` return?", "-- rows: (g='a',v=1), (g='a',v=2), (g='b',v=5)", ["a 3, b 5", "a 1, b 5", "a 3", "b 8"], 0, "Group a sums to 3; group b is 5."),
      mc("Aggregates", "What is the difference between COUNT(*) and COUNT(col)?", ["None", "COUNT(col) ignores NULLs in col", "COUNT(*) ignores NULLs", "COUNT(col) counts duplicates twice"], 1, "COUNT(col) counts only non-NULL values."),
    ],
    advanced: [
      sc("Performance", "A query filtering `WHERE lower(email) = 'a@b.com'` is slow despite an index on email. Why, and what helps?", ["Index is corrupt; rebuild", "The function prevents using the plain index; add an expression index on lower(email)", "Use SELECT *", "Add ORDER BY"], 1, "Applying a function to the column defeats a plain index; use a functional index."),
      mc("Window functions", "Which function numbers rows per group by ordering?", ["ROW_NUMBER() OVER (PARTITION BY g ORDER BY x)", "GROUP_NUMBER()", "COUNT(DISTINCT)", "RANK BY g"], 0, "Window functions partition and order without collapsing rows."),
      mc("Transactions", "Which problem occurs when a transaction reads rows another uncommitted transaction changed?", ["Dirty read", "Phantom index", "Deadlock only", "Cascade delete"], 0, "A dirty read sees uncommitted data; stronger isolation levels prevent it."),
      sc("Design", "Two users update the same account balance concurrently and one update is lost. Best fix?", ["Remove the primary key", "Use a transaction with row locking (SELECT … FOR UPDATE) or an atomic UPDATE", "Run queries slower", "Add more columns"], 1, "Serialize access to the row or use an atomic update like SET bal = bal - 10."),
    ],
  },
  html: {
    basic: [
      mc("Semantics", "Which element is the best choice for the main navigation links?", ["<div>", "<nav>", "<section>", "<span>"], 1, "<nav> conveys a navigation landmark."),
      tf("Forms", "The `alt` attribute on <img> provides text for screen readers.", true, "alt describes the image for assistive tech and failures."),
      mc("Structure", "Which tag holds the page's visible content?", ["<head>", "<body>", "<meta>", "<title>"], 1, "<body> contains rendered content."),
      mc("Forms", "Which input type provides a built-in email format check?", ["text", "email", "mail", "string"], 1, "type=\"email\" gets browser validation."),
    ],
    intermediate: [
      mc("Accessibility", "Which pairs a label with an input for assistive tech?", ["<label for=\"id\"> matching the input id", "Placing the label anywhere", "Using <b>", "title on the form"], 0, "The for attribute links the label to the input id."),
      dbg("Semantics", "What is wrong for accessibility?", "<div onclick=\"save()\">Save</div>", ["Nothing", "A div isn't keyboard-focusable or announced as a button; use <button>", "onclick is invalid HTML", "Save is a reserved word"], 1, "Use native <button> for keyboard and screen-reader support."),
      mc("Responsive", "Which meta tag is needed for correct scaling on mobile?", ["<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", "<meta charset>", "<meta name=\"mobile\">", "<link rel=\"mobile\">"], 0, "The viewport meta sets layout width on mobile."),
      ms("Elements", "Select the semantic sectioning/landmark elements:", ["<header>", "<article>", "<b>", "<footer>"], [0, 1, 3], "<b> is presentational; the others are semantic."),
    ],
    advanced: [
      sc("Performance", "A hero image delays first paint. Which change helps MOST?", ["Add more JS", "Serve a responsive, compressed image (srcset, modern format) and preload/prioritize it", "Use a larger image", "Inline it as base64 in CSS"], 1, "Smaller, correctly sized images with priority hints improve LCP."),
      mc("Accessibility", "What is the purpose of ARIA attributes?", ["Style elements", "Expose roles/states to assistive technology where native semantics are missing", "Speed up rendering", "Replace HTML"], 1, "ARIA supplements semantics; native elements come first."),
      mc("Security", "Which attribute should accompany target=\"_blank\" on external links?", ["rel=\"noopener\"", "rel=\"nofollow\" only", "download", "defer"], 0, "noopener prevents the new page from controlling window.opener."),
      mc("Loading", "What does `<script defer src=...>` do?", ["Blocks parsing until it runs", "Downloads in parallel and runs after the document is parsed, in order", "Runs never", "Runs before the HTML loads"], 1, "defer executes after parsing and preserves script order."),
    ],
  },
  css: {
    basic: [
      mc("Selectors", "Which selector targets elements with class \"card\"?", ["#card", ".card", "card", "*card"], 1, "Classes use a leading dot."),
      mc("Box model", "Which property adds space INSIDE an element's border?", ["margin", "padding", "gap", "outline"], 1, "Padding is inside the border; margin is outside."),
      tf("Units", "`rem` units are relative to the root element's font size.", true, "1rem equals the html element's font-size."),
      mc("Layout", "Which declaration enables a flex container?", ["display: flex", "flex: container", "position: flex", "layout: flex"], 0, "display: flex creates a flex container."),
    ],
    intermediate: [
      mc("Specificity", "Which selector has the highest specificity?", ["div p", ".a .b", "#id", "p.x"], 2, "An id selector outweighs classes and elements."),
      mc("Flexbox", "Which property aligns flex items along the main axis?", ["align-items", "justify-content", "align-content", "place-self"], 1, "justify-content distributes items on the main axis."),
      dbg("Box model", "A 300px-wide box with padding:20px and a 5px border is 350px wide. Which fix keeps it at 300px?", ".box{width:300px;padding:20px;border:5px solid}", ["box-sizing: border-box", "overflow: hidden", "display: inline", "width: auto"], 0, "border-box includes padding and border in the declared width."),
      ms("Layout", "Select valid ways to center an element horizontally and vertically:", ["Flexbox with justify-content and align-items: center", "Grid with place-items: center", "text-align: justify", "Absolute position with translate(-50%, -50%)"], [0, 1, 3], "text-align: justify is not centering."),
    ],
    advanced: [
      sc("Performance", "Animations stutter. Which properties are cheapest to animate?", ["width and height", "transform and opacity", "top and left", "margin"], 1, "transform/opacity can be composited without layout/paint."),
      mc("Layout", "What does `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` produce?", ["Fixed 240px columns", "As many columns as fit, each at least 240px, sharing leftover space", "One column", "Overlapping items"], 1, "It creates a responsive grid without media queries."),
      dbg("Stacking", "z-index: 999 has no effect on this element. Likely cause?", ".tip{z-index:999}  /* position is static */", ["z-index max is 100", "z-index needs a positioned element (or flex/grid item)", "tip is a reserved class", "Missing !important"], 1, "z-index only applies to positioned elements and flex/grid items."),
      mc("Cascade", "What does `@layer` control?", ["Image layers", "Cascade ordering between groups of rules", "3D transforms", "Print styles"], 1, "Cascade layers give explicit precedence control."),
    ],
  },
  react: {
    basic: [
      mc("JSX", "What does JSX compile to?", ["HTML strings", "React.createElement calls", "SQL", "CSS"], 1, "JSX is syntax sugar for createElement (or the jsx runtime)."),
      mc("State", "Which hook adds local state to a function component?", ["useEffect", "useState", "useRef", "useMemo"], 1, "useState returns [value, setter]."),
      tf("Props", "A child component should mutate the props it receives.", false, "Props are read-only; use callbacks to ask the parent to change state."),
      mc("Lists", "Why do list items need a stable `key`?", ["For CSS", "So React can match items between renders efficiently and correctly", "For accessibility", "To enable hooks"], 1, "Keys identify items across renders."),
    ],
    intermediate: [
      dbg("Hooks", "Why does this cause an infinite render loop?", "function C(){\n  const [n,setN]=useState(0);\n  useEffect(()=>{ setN(n+1); });\n  return n;\n}", ["useEffect cannot set state", "The effect has no dependency array and updates state every render", "n is const", "C must be a class"], 1, "Each state change re-renders and re-runs the effect; add a dependency array/condition."),
      mc("State", "Why use the functional update form setN(n => n + 1)?", ["It's faster", "It uses the latest state even when updates are batched", "It avoids re-rendering", "It's required for objects"], 1, "The updater receives the current pending state."),
      mc("Effects", "What does the cleanup function returned from useEffect do?", ["Runs before the next effect and on unmount", "Runs only on mount", "Deletes state", "Runs on every click"], 0, "Cleanup unsubscribes/clears timers."),
      ms("Hooks", "Select the rules of hooks:", ["Call hooks only at the top level", "Call hooks inside loops", "Call hooks only from components or custom hooks", "Call hooks in event handlers"], [0, 2], "Hooks must run in the same order each render."),
    ],
    advanced: [
      sc("Performance", "A large list re-renders on every keystroke in a sibling input. Best first fix?", ["Use var", "Memoize the list (React.memo/useMemo) or move input state down", "Add more keys", "Use dangerouslySetInnerHTML"], 1, "Colocate state or memoize to avoid unnecessary renders."),
      dbg("Stale closure", "The interval logs 0 forever. Why?", "useEffect(()=>{\n  const t=setInterval(()=>console.log(n),1000);\n  return ()=>clearInterval(t);\n},[]);", ["setInterval is broken in React", "The closure captured n from the first render because n is missing from deps", "n must be a ref", "clearInterval is wrong"], 1, "Add n to deps or read it via a ref."),
      mc("Architecture", "What problem does React context solve (and not solve)?", ["Replaces all state management and prevents re-renders", "Avoids prop drilling but re-renders consumers when the value changes", "Caches API calls", "Makes components pure"], 1, "Context passes data deeply; changing the value re-renders consumers."),
      mc("Rendering", "What does React.StrictMode double-invoking effects in development help detect?", ["Slow networks", "Missing cleanup and impure render/effect logic", "CSS bugs", "Bundle size"], 1, "It surfaces side effects that are not resilient."),
    ],
  },
  nodejs: {
    basic: [
      mc("Runtime", "What is Node.js?", ["A browser", "A JavaScript runtime built on V8 for running JS outside the browser", "A database", "A CSS framework"], 1, "Node runs JS on the server using V8."),
      mc("Modules", "Which command installs a package from npm?", ["npm get", "npm install", "node add", "npm fetch"], 1, "npm install adds dependencies."),
      tf("Async", "Node.js is single-threaded for JavaScript execution but handles I/O asynchronously.", true, "The event loop delegates I/O to the system/threadpool."),
      mc("Modules", "Which keyword imports a CommonJS module?", ["import()", "require()", "include", "using"], 1, "CommonJS uses require()."),
    ],
    intermediate: [
      dbg("Async", "Why is `data` undefined?", "let data;\nfs.readFile('a.txt', (e, d) => { data = d; });\nconsole.log(data);", ["readFile is sync", "The callback runs later; console.log runs first", "a.txt is missing", "data is const"], 1, "Asynchronous callbacks complete after the current synchronous code."),
      mc("Express", "What does `next()` do in an Express middleware?", ["Ends the request", "Passes control to the next middleware/route", "Restarts the server", "Logs the request"], 1, "Without next() or a response, the request hangs."),
      mc("Environment", "Where should secrets such as API keys be kept?", ["In source code", "In environment variables / a secrets manager", "In a public repo", "In the browser bundle"], 1, "Keep secrets out of code and version control."),
      mc("Streams", "Why use streams to serve a large file?", ["They're required", "They avoid loading the entire file into memory", "They encrypt data", "They sort data"], 1, "Streams process data in chunks."),
    ],
    advanced: [
      sc("Performance", "A CPU-heavy JSON transform blocks all requests. Best approach?", ["Use more middleware", "Offload to worker_threads or a separate service/queue", "Increase the timeout", "Use sync fs"], 1, "Blocking the event loop stalls every request; offload CPU work."),
      mc("Event loop", "In which order do these run: process.nextTick, Promise.then, setImmediate?", ["setImmediate, then, nextTick", "nextTick, then, setImmediate", "then, setImmediate, nextTick", "All at once"], 1, "nextTick runs first, then promise microtasks, then the check phase (setImmediate)."),
      dbg("Errors", "What happens when this handler's promise rejects in older Express (v4)?", "app.get('/', async (req,res)=>{ throw new Error('x'); });", ["Express returns a 500 automatically", "The rejection is unhandled and the request can hang", "Nothing, it's caught", "The server restarts cleanly"], 1, "Express 4 doesn't catch async rejections; wrap handlers or use a helper."),
      mc("Scaling", "How do you use all CPU cores with Node?", ["Nothing, it's automatic", "Run multiple processes (cluster/PM2/containers) behind a load balancer", "Use var", "Use more RAM"], 1, "One Node process uses one main thread."),
    ],
  },
  git: {
    basic: [
      mc("Basics", "Which command records staged changes as a commit?", ["git push", "git commit", "git add", "git status"], 1, "git commit creates a commit from the index."),
      mc("Basics", "Which command shows the working tree status?", ["git log", "git status", "git diff --staged", "git show"], 1, "git status lists changed/staged files."),
      tf("Remote", "`git clone` downloads a repository with its history.", true, "Clone copies the repo and full history."),
      mc("Branches", "Which command creates and switches to a new branch?", ["git branch -d x", "git switch -c x", "git merge x", "git new x"], 1, "git switch -c (or checkout -b) creates and switches."),
    ],
    intermediate: [
      mc("Merging", "What is the main difference between merge and rebase?", ["None", "Merge keeps history with a merge commit; rebase replays commits to make it linear", "Rebase deletes commits", "Merge only works on main"], 1, "Rebase rewrites commits onto a new base."),
      mc("Undo", "Which command safely undoes a pushed commit by creating a new commit?", ["git reset --hard", "git revert", "git rebase -i", "git clean"], 1, "revert adds an inverse commit without rewriting history."),
      mc("Conflicts", "After resolving a merge conflict in a file, what next?", ["git push --force", "Stage the file and complete the merge/commit", "Delete the branch", "git stash drop"], 1, "Add the resolved files, then commit."),
      ms("Ignore", "Which belong in .gitignore?", ["node_modules/", ".env files with secrets", "source code", "build output (dist/)"], [0, 1, 3], "Dependencies, secrets and build artifacts should not be committed."),
    ],
    advanced: [
      sc("Recovery", "You ran `git reset --hard` and lost commits. How can you often recover them?", ["They're gone forever", "Find them with git reflog and reset/cherry-pick", "Reinstall git", "Clone again"], 1, "Reflog keeps recent HEAD positions."),
      mc("Debugging", "Which command finds the commit that introduced a bug by binary search?", ["git blame", "git bisect", "git grep", "git fsck"], 1, "git bisect narrows down the offending commit."),
      sc("Security", "A password was committed and pushed. What must you do FIRST?", ["Delete the file in a new commit", "Rotate/revoke the credential, then purge history if needed", "Nothing", "Force push an empty repo"], 1, "Once pushed, assume it's compromised; rotate first."),
      mc("Safety", "Why prefer `git push --force-with-lease` over `--force`?", ["It's faster", "It refuses to overwrite remote commits you haven't seen", "It signs commits", "It squashes commits"], 1, "It protects teammates' work."),
    ],
  },
  docker: {
    basic: [
      mc("Concepts", "What is a container image?", ["A running process", "A read-only template used to create containers", "A VM disk only", "A network"], 1, "Containers are running instances of images."),
      mc("CLI", "Which command lists running containers?", ["docker images", "docker ps", "docker ls -a images", "docker run"], 1, "docker ps shows running containers."),
      tf("Isolation", "Containers share the host kernel.", true, "Unlike VMs, containers use the host OS kernel."),
      mc("Dockerfile", "Which instruction sets the base image?", ["RUN", "FROM", "CMD", "COPY"], 1, "FROM must start the build (after ARG)."),
    ],
    intermediate: [
      mc("Data", "How do you persist database data beyond a container's life?", ["Write inside the container filesystem", "Use a volume or bind mount", "Use ENV", "Use EXPOSE"], 1, "Volumes outlive containers."),
      mc("Networking", "What does `-p 8080:80` do?", ["Maps host port 8080 to container port 80", "Maps container 8080 to host 80", "Opens both ports to the internet only", "Sets a proxy"], 0, "Format is host:container."),
      dbg("Dockerfile", "Why does every code change trigger a slow dependency reinstall?", "COPY . .\nRUN npm install", ["npm is slow", "Copying all files first invalidates the layer cache; copy package*.json and install first", "RUN is invalid", "Missing CMD"], 1, "Order instructions from least to most frequently changing."),
      mc("Compose", "What is docker compose used for?", ["Building a kernel", "Defining and running multi-container apps from a YAML file", "Pushing to git", "Monitoring"], 1, "Compose describes services, networks and volumes."),
    ],
    advanced: [
      sc("Image size", "A production image is 1.2 GB. Which change helps most?", ["Add more layers", "Use a multi-stage build and a slim/distroless base", "Use latest tag", "Run as root"], 1, "Multi-stage builds keep build tools out of the final image."),
      sc("Security", "Which practice reduces container risk?", ["Run as root", "Run as a non-root user with minimal capabilities and scanned images", "Bake secrets into the image", "Use privileged mode"], 1, "Least privilege and scanning reduce the attack surface."),
      dbg("Healthcheck", "A container is 'running' but the app is broken. Which feature lets orchestrators detect this?", "# no health configuration", ["EXPOSE", "HEALTHCHECK", "LABEL", "VOLUME"], 1, "HEALTHCHECK reports whether the app inside is healthy."),
      mc("Runtime", "Why should the app be PID 1-safe (handle SIGTERM) in a container?", ["For colors", "So `docker stop` can shut it down gracefully instead of being killed after the timeout", "For logs", "For image size"], 1, "Docker sends SIGTERM first, then SIGKILL after the grace period."),
    ],
  },
  linux: {
    basic: [
      mc("Files", "Which command lists directory contents?", ["ls", "cd", "pwd", "cat"], 0, "ls lists files; pwd prints the working directory."),
      mc("Permissions", "What does `chmod 644 file` give the owner?", ["Read and write", "Read, write, execute", "Nothing", "Execute only"], 0, "6 = rw-, 4 = r--."),
      mc("Processes", "Which command shows running processes interactively?", ["top", "ls", "mkdir", "touch"], 0, "top (or htop) displays live process info."),
      tf("Shell", "In bash, `|` passes the output of one command as input to the next.", true, "A pipe connects stdout to stdin."),
    ],
    intermediate: [
      mc("Text", "Which command finds lines containing 'error' in a log?", ["grep error app.log", "find error", "cat -e", "ls error"], 0, "grep searches text."),
      mc("Services", "Which tool manages services on most modern distros?", ["systemctl", "mount", "df", "tar"], 0, "systemd services are managed with systemctl."),
      out("Redirection", "After `echo a > f; echo b >> f; cat f` what is in f?", "echo a > f\necho b >> f\ncat f", ["b", "a then b on separate lines", "a only", "Error"], 1, "> truncates; >> appends."),
      ms("Disk", "Which commands report disk usage?", ["df -h", "du -sh", "ps aux", "free -m"], [0, 1], "df and du cover disk; free reports memory."),
    ],
    advanced: [
      sc("Troubleshooting", "A server is slow; load average is high but CPU is idle. A likely cause?", ["Too many CSS files", "I/O wait (disk or network bottleneck)", "A missing semicolon", "Low brightness"], 1, "Processes blocked on I/O raise load without CPU use."),
      sc("Security", "Which is the best way to secure SSH access?", ["Allow password login for root", "Use key-based auth, disable root login and password auth", "Open all ports", "Share one account"], 1, "Keys plus restricted users reduce brute-force risk."),
      mc("Processes", "What does `kill -9` do differently from `kill`?", ["Nothing", "Sends SIGKILL which cannot be caught, so no cleanup runs", "Restarts the process", "Pauses it"], 1, "Default kill sends SIGTERM allowing graceful shutdown."),
      mc("Memory", "What does the OOM killer do?", ["Compresses RAM", "Terminates processes when the system runs out of memory", "Adds swap", "Reboots"], 1, "The kernel kills a process to free memory."),
    ],
  },
  kubernetes: {
    basic: [
      mc("Concepts", "What is the smallest deployable unit in Kubernetes?", ["Node", "Pod", "Deployment", "Namespace"], 1, "A pod wraps one or more containers."),
      mc("CLI", "Which tool talks to a cluster from the command line?", ["kubectl", "kubeadm only", "dockerd", "helm only"], 0, "kubectl is the standard CLI."),
      tf("Concepts", "A Deployment manages replicas of pods and rolling updates.", true, "Deployments (via ReplicaSets) keep the desired pod count."),
      mc("Services", "What does a Service provide?", ["A stable network endpoint for a set of pods", "Persistent disks", "Image builds", "Secrets rotation"], 0, "Services give pods a stable virtual IP/DNS name."),
    ],
    intermediate: [
      mc("Config", "Which object stores non-secret configuration for pods?", ["ConfigMap", "Ingress", "Node", "PersistentVolume"], 0, "Secrets store sensitive values."),
      dbg("Pods", "A pod is in CrashLoopBackOff. What is the best first step?", "kubectl get pods", ["Delete the cluster", "kubectl logs / describe pod to see why the container exits", "Scale to 0", "Add more nodes"], 1, "Logs and events reveal the crash cause."),
      mc("Probes", "What happens when a readiness probe fails?", ["Pod is restarted", "Pod is removed from Service endpoints until it passes", "Node is drained", "Nothing"], 1, "Liveness restarts; readiness gates traffic."),
      mc("Scaling", "Which object automatically scales replicas based on metrics like CPU?", ["HorizontalPodAutoscaler", "Ingress", "ConfigMap", "DaemonSet"], 0, "HPA adjusts replicas to load."),
    ],
    advanced: [
      sc("Reliability", "During node maintenance you want to keep at least 2 replicas up. Which resource helps?", ["PodDisruptionBudget", "NetworkPolicy", "ResourceQuota only", "Taint only"], 0, "PDBs limit voluntary disruptions."),
      sc("Resources", "Pods are OOMKilled. What should you review?", ["Image tag", "Memory requests/limits versus real usage", "Ingress host", "Labels"], 1, "Exceeding the memory limit terminates the container."),
      mc("Security", "Which feature restricts which pods can talk to each other?", ["NetworkPolicy", "ConfigMap", "Label", "Probe"], 0, "NetworkPolicy controls pod traffic (needs a supporting CNI)."),
      mc("Deployment", "How does a Deployment minimize downtime during an update?", ["Kills all pods then starts new ones", "Rolling update replacing pods gradually, honoring readiness", "Needs manual restarts", "Deletes the Service"], 1, "maxSurge/maxUnavailable control the rollout."),
    ],
  },
  aws: {
    basic: [
      mc("Storage", "Which service stores objects such as images and backups?", ["EC2", "S3", "VPC", "SNS"], 1, "S3 is object storage."),
      mc("Compute", "Which service provides virtual servers?", ["EC2", "S3", "Route 53", "SQS"], 0, "EC2 = Elastic Compute Cloud."),
      tf("Security", "IAM is used to control who can access which AWS resources.", true, "IAM manages identities and permissions."),
      mc("Concepts", "What is an AWS Region?", ["A geographic area with multiple Availability Zones", "A single data center", "A billing plan", "A VPC"], 0, "Regions contain several isolated AZs."),
    ],
    intermediate: [
      mc("IAM", "What is the best practice for granting permissions?", ["Admin for everyone", "Least privilege", "Share root keys", "Embed keys in code"], 1, "Grant only what is needed."),
      mc("Networking", "What does a security group act as?", ["A stateful instance-level firewall", "A DNS service", "A load balancer", "A CDN"], 0, "Security groups are stateful allow-rule firewalls."),
      mc("Serverless", "Which service runs code without managing servers, billed per invocation?", ["Lambda", "EC2", "EBS", "RDS"], 0, "Lambda is function-as-a-service."),
      mc("Databases", "Which service is a managed relational database?", ["RDS", "S3", "SQS", "CloudFront"], 0, "RDS manages engines like PostgreSQL and MySQL."),
    ],
    advanced: [
      sc("Availability", "How do you make a web app survive an AZ failure?", ["Run everything on one big instance", "Spread instances across multiple AZs behind a load balancer with auto scaling", "Use a bigger disk", "Use a static IP"], 1, "Multi-AZ designs remove single points of failure."),
      sc("Security", "An S3 bucket with private data was made public. Best prevention?", ["Hope for the best", "Block Public Access, least-privilege bucket policies and monitoring", "Rename the bucket", "Use bigger buckets"], 1, "Account-level Block Public Access plus audits prevents exposure."),
      sc("Cost", "Spiky, unpredictable traffic and a cost target. A good fit is:", ["Reserved instances for peak", "Auto scaling and/or serverless pay-per-use", "One huge instance", "Manual scaling"], 1, "Pay-per-use scales to zero when idle."),
      mc("Messaging", "Which service decouples producers and consumers with a queue?", ["SQS", "IAM", "ACM", "KMS"], 0, "SQS buffers messages between services."),
    ],
  },
  rest: {
    basic: [
      mc("HTTP", "Which HTTP method is conventionally used to retrieve a resource?", ["GET", "POST", "PATCH", "DELETE"], 0, "GET reads and should be safe."),
      mc("Status codes", "Which status code means 'Not Found'?", ["200", "404", "500", "301"], 1, "404 = resource not found."),
      tf("HTTP", "REST APIs are typically stateless between requests.", true, "Each request carries what the server needs."),
      mc("Format", "Which format do most REST APIs use for bodies?", ["JSON", "BMP", "MP3", "EXE"], 0, "JSON is the de facto format."),
    ],
    intermediate: [
      mc("Semantics", "Which method is idempotent?", ["POST", "PUT", "None", "Only GET"], 1, "PUT (like GET, DELETE) yields the same result when repeated."),
      mc("Status codes", "What should a successful resource creation return?", ["200 OK always", "201 Created with a Location", "204 only", "302"], 1, "201 signals creation."),
      mc("Errors", "A client sends invalid JSON fields. Best status?", ["500", "400/422 with an error body", "200", "404"], 1, "Client errors use 4xx."),
      ms("Design", "Select good REST resource URL designs:", ["/users/42/orders", "/getUserOrders?id=42", "/orders?status=open", "/users/42/deleteUser"], [0, 2], "Use nouns and HTTP methods, not verbs in URLs."),
    ],
    advanced: [
      sc("Scalability", "A list endpoint returns 100k rows. Best design?", ["Return all", "Paginate (cursor/limit) with filtering and sorting", "Compress only", "Use POST"], 1, "Pagination bounds response size and load."),
      sc("Reliability", "A client retries a payment POST after a timeout and double-charges. Best fix?", ["No retries", "Support idempotency keys so retries are safe", "Use GET", "Shorter timeouts"], 1, "Idempotency keys dedupe retried requests."),
      mc("Caching", "Which headers enable conditional requests?", ["ETag / If-None-Match", "Content-Length", "Host", "Accept"], 0, "304 Not Modified saves bandwidth."),
      sc("Security", "Which approach best protects an API consumed by a mobile app?", ["Obscure URLs", "HTTPS, token auth (e.g. OAuth/JWT), authorization checks and rate limiting", "Query-string passwords", "CORS only"], 1, "Defense in depth beyond hiding URLs."),
    ],
  },
  dsa: {
    basic: [
      mc("Complexity", "What is the time complexity of binary search on a sorted array?", ["O(n)", "O(log n)", "O(n²)", "O(1)"], 1, "Each step halves the search space."),
      mc("Structures", "Which structure is LIFO?", ["Queue", "Stack", "Heap", "Graph"], 1, "A stack pops the most recently pushed item."),
      tf("Structures", "Hash table lookups are O(1) on average.", true, "Average-case constant time (worst case O(n))."),
      mc("Structures", "Which data structure is FIFO?", ["Stack", "Queue", "Tree", "Set"], 1, "Queues serve the oldest element first."),
    ],
    intermediate: [
      mc("Sorting", "What is the average time complexity of merge sort?", ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], 1, "Merge sort is O(n log n) in all cases."),
      out("Complexity", "What is the time complexity of this snippet?", "for i in range(n):\n    for j in range(n):\n        work()", ["O(n)", "O(n²)", "O(log n)", "O(2n)"], 1, "Nested loops over n give n × n."),
      mc("Graphs", "Which traversal finds the shortest path in an unweighted graph?", ["DFS", "BFS", "In-order", "Binary search"], 1, "BFS explores by distance in edges."),
      mc("Trees", "What does in-order traversal of a BST yield?", ["Random order", "Sorted order", "Reverse insertion order", "Level order"], 1, "Left, node, right yields ascending keys."),
    ],
    advanced: [
      sc("Optimization", "Find two numbers summing to a target in an unsorted array of 10⁶ items. Best approach?", ["Check all pairs O(n²)", "One pass with a hash set/map O(n)", "Sort and check each pair", "Recursion"], 1, "Store seen values and look up the complement."),
      mc("DP", "Which problem property makes dynamic programming applicable?", ["Overlapping subproblems and optimal substructure", "Needs recursion only", "Uses only arrays", "Sorted input"], 0, "DP caches overlapping subproblem results."),
      mc("Heaps", "What is the cost of inserting into a binary heap?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Sift-up takes tree height."),
      sc("Design", "You need the K largest items from a stream of N items with small memory. Best structure?", ["Sort everything", "A min-heap of size K", "Linked list", "Stack"], 1, "Maintain K candidates and evict the smallest."),
    ],
  },
  "web-security": {
    basic: [
      mc("Attacks", "What is XSS?", ["Injecting malicious scripts into pages viewed by other users", "A database index", "A CSS framework", "A network protocol"], 0, "Cross-site scripting runs attacker JavaScript in victims' browsers."),
      mc("Transport", "What does HTTPS add over HTTP?", ["Encryption and server authentication via TLS", "Faster pages only", "Compression only", "Caching"], 0, "TLS protects confidentiality and integrity."),
      tf("Passwords", "Passwords should be stored as plain text for easy recovery.", false, "Store salted slow hashes (bcrypt/argon2)."),
      mc("Attacks", "What is SQL injection?", ["Malicious SQL inserted through unsanitized input", "A faster query", "A DB backup", "A join type"], 0, "User input altering the query's structure."),
    ],
    intermediate: [
      mc("Defense", "What is the primary defense against SQL injection?", ["Parameterized queries / prepared statements", "Hiding the table names", "Longer passwords", "Client-side validation only"], 0, "Parameters keep data separate from SQL code."),
      mc("CSRF", "What does a CSRF attack do?", ["Tricks a logged-in user's browser into sending an unwanted request", "Steals a database", "Overloads a DNS", "Cracks hashes"], 0, "Mitigate with SameSite cookies and CSRF tokens."),
      dbg("XSS", "What is the vulnerability?", "el.innerHTML = userComment;", ["None", "Untrusted input is rendered as HTML, enabling XSS; use textContent or sanitize", "innerHTML is slow", "el is null"], 1, "Treat user content as text."),
      ms("Cookies", "Which cookie flags improve security?", ["HttpOnly", "Secure", "Verbose", "SameSite"], [0, 1, 3], "HttpOnly hides from JS, Secure requires HTTPS, SameSite limits cross-site sending."),
    ],
    advanced: [
      sc("AuthZ", "A user changes /orders/123 to /orders/124 and sees another user's order. What is this?", ["XSS", "Broken access control (IDOR)", "DoS", "Clickjacking"], 1, "Authorize every object access on the server."),
      sc("Headers", "Which header restricts which script sources a page can load, mitigating XSS impact?", ["Content-Security-Policy", "Accept-Language", "ETag", "Server"], 0, "CSP limits executable sources."),
      sc("SSRF", "A feature fetches a URL supplied by the user. Which risk does that create?", ["SSRF — the server can be made to reach internal services/metadata endpoints", "None", "Only slower pages", "Missing alt text"], 0, "Validate/allow-list destinations and block internal ranges."),
      mc("Tokens", "Why avoid storing long-lived JWTs in localStorage?", ["Not allowed by browsers", "Any XSS can read and exfiltrate them", "It's slower", "JWT can't be stored"], 1, "Prefer HttpOnly cookies with short-lived tokens."),
    ],
  },
};
