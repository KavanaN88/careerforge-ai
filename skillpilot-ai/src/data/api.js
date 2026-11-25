// ============================================================================
// API client for the optional Node/Express + PostgreSQL backend.
//  • Served by the backend (http://localhost:3000)  → API.available becomes true → real accounts + DB.
//  • Opened as a plain file (file://) or backend down → API.available stays false → the original
//    localStorage demo mode keeps working exactly as before.
// ============================================================================
const API = {
  available: false,
  token: (() => { try { return localStorage.getItem("skillpilot:token"); } catch (e) { return null; } })(),

  setToken(t) {
    API.token = t;
    try { t ? localStorage.setItem("skillpilot:token", t) : localStorage.removeItem("skillpilot:token"); } catch (e) { /* ignore */ }
  },

  async detect() {
    if (typeof location === "undefined" || !/^https?:$/.test(location.protocol)) return false;
    try {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch("/api/health", { signal: ctl.signal }); clearTimeout(timer);
      const j = await r.json();
      API.available = !!(r.ok && j && j.ok);
    } catch (e) { API.available = false; }
    return API.available;
  },

  async request(method, url, body) {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(API.token ? { Authorization: "Bearer " + API.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const err = new Error(data.error || "Request failed."); err.status = r.status; throw err; }
    return data;
  },

  login: (email, password) => API.request("POST", "/api/auth/login", { email, password }),
  signup: (name, email, password) => API.request("POST", "/api/auth/signup", { name, email, password }),
  me: () => API.request("GET", "/api/auth/me"),
  loadState: () => API.request("GET", "/api/state"),
  saveState: (state) => API.request("PUT", "/api/state", state),
};
