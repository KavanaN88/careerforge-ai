#!/bin/bash
set -e
cd /home/claude/skillpilot-ai
OUT="index.html"

cat > "$OUT" << 'HTMLHEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SkillPilot AI — Prove Your Skills. Build Your Career.</title>
<meta name="description" content="SkillPilot AI analyzes your skills, resume, GitHub projects and technical performance to build an evidence-based Career Digital Twin." />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="vendor/tailwind.css">

<script src="vendor/react.production.min.js"></script>
<script src="vendor/react-dom.production.min.js"></script>
<script src="vendor/babel.min.js"></script>

<style>
HTMLHEAD

cat src/styles.css >> "$OUT"

cat >> "$OUT" << 'HTMLMID'
</style>
</head>
<body class="bg-navy text-ink font-body antialiased">
  <div id="root"></div>
  <div id="boot-error" style="display:none;position:fixed;inset:0;background:#0B1020;color:#F8FAFC;font-family:monospace;padding:32px;white-space:pre-wrap;overflow:auto;z-index:9999;"></div>

  <!--
    All app source (data + components + app logic) lives below as plain text, not as an
    executable script, inside a <script type="application/skillpilot-source"> tag — browsers
    ignore unknown script types, so this never runs as-is. A tiny bootstrap script (at the very
    bottom of this file) reads that text, transforms it with Babel Standalone using the CLASSIC
    JSX runtime explicitly (React.createElement calls, no ES "import" statements), and then
    evaluates the result. This sidesteps CDN Babel versions that default to the "automatic" JSX
    runtime (which emits `import` statements plain <script> tags can't execute).

    Edit the readable, per-file source in /src instead of this generated file, then run
    `bash src/build.sh` to regenerate this block.
  -->
  <script type="application/skillpilot-source" id="skillpilot-source">
HTMLMID

for f in src/data/mockData.js src/data/engine.js src/data/skillCatalog.js src/data/careerSkills.js src/data/careerRoles.js src/data/careerCatalog.js src/data/assessmentBank.js src/data/assessmentEngine.js src/data/interviewBank.js src/data/interviewEngine.js src/data/projectCatalog.js src/data/projectEngine.js src/data/api.js src/components/ui.js src/components/Landing.js src/components/Auth.js src/components/SkillPicker.js src/components/Onboarding.js src/components/CareerSelect.js src/components/Dashboard.js src/components/DigitalTwin.js src/components/GithubAnalyzer.js src/components/ResumeIntel.js src/components/JobAnalyzer.js src/components/Assessment.js src/components/Interview.js src/components/Projects.js src/components/Roadmap.js src/components/Progress.js src/components/Report.js src/components/ProfileSettings.js src/components/Assistant.js src/components/Shell.js src/app.js; do
  echo "// ==== $f ====" >> "$OUT"
  cat "$f" >> "$OUT"
  echo "" >> "$OUT"
done

cat >> "$OUT" << 'HTMLEND'
  </script>

  <script>
    (function () {
      function showBootError(title, detail) {
        var el = document.getElementById('boot-error');
        el.style.display = 'block';
        el.textContent = title + (detail ? ('\n\n' + detail) : '');
      }
      try {
        var src = document.getElementById('skillpilot-source').textContent;
        var compiled = Babel.transform(src, {
          presets: [['react', { runtime: 'classic' }]],
          filename: 'skillpilot.jsx',
        }).code;
        (0, eval)(compiled);
      } catch (err) {
        console.error(err);
        showBootError(
          'SkillPilot AI failed to start.',
          'This usually means a required CDN script (React / Tailwind / Babel / fonts) was blocked ' +
          'by your network, firewall, VPN, or an ad-blocker/extension, or there is no internet connection.\n\n' +
          'Try: a different network, disabling extensions, or an incognito window.\n\n' +
          'Technical detail: ' + (err && err.message ? err.message : err)
        );
      }
    })();
  </script>
</body>
</html>
HTMLEND

echo "Built $OUT ($(wc -l < $OUT) lines)"
