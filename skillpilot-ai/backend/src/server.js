const path = require("path");
const { init } = require("./db");
const { createApp } = require("./app");

const PORT = process.env.PORT || 3000;
// In Docker the built frontend is copied to /app/public; locally it lives one level above /backend.
const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, "..", "..");

init().then(() => {
  createApp(publicDir).listen(PORT, () => console.log(`SkillPilot AI running → http://localhost:${PORT}`));
}).catch(err => { console.error("Failed to start:", err.message); process.exit(1); });
