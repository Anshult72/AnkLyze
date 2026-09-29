import fs from 'fs';
import path from 'path';

const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';

async function captureUrl(url, configs) {
  console.log(`Opening tab for ${url}...`);
  const newTabRes = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await newTabRes.json();
  console.log('Opened tab:', target.id);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      }
    } catch (err) {}
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    pending.set(cur, resolve);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  // Allow page hydration
  await new Promise(r => setTimeout(r, 2500));

  for (const cfg of configs) {
    console.log(`Setting viewport ${cfg.width}x${cfg.height}, mobile=${cfg.mobile}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: cfg.width,
      height: cfg.height,
      deviceScaleFactor: 1,
      mobile: cfg.mobile || false,
    });
    if (cfg.scrollY) {
      await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${cfg.scrollY}, behavior: 'instant' })` });
    }
    await new Promise(r => setTimeout(r, 1000));

    const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    if (snap.result?.data) {
      const filePath = path.join(outDir, cfg.filename);
      fs.writeFileSync(filePath, Buffer.from(snap.result.data, 'base64'));
      console.log(`✓ Saved ${cfg.filename}`);
    } else {
      console.error(`✗ Failed ${cfg.filename}:`, snap);
    }
  }

  // Close tab cleanly
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  console.log('Closed tab', target.id);
}

async function main() {
  // 1. Examiner Dashboard (Desktop + Mobile)
  await captureUrl('http://localhost:3000/examiner/dashboard', [
    { width: 1440, height: 900, mobile: false, filename: 'unified_dashboard_desktop_1.jpg', scrollY: 0 },
    { width: 1440, height: 900, mobile: false, filename: 'unified_dashboard_desktop_2.jpg', scrollY: 500 },
    { width: 390, height: 844, mobile: true, filename: 'unified_dashboard_mobile.jpg', scrollY: 0 },
  ]);

  // 2. Examiner Evaluation Workspace (Desktop + Mobile)
  await captureUrl('http://localhost:3000/examiner/evaluate/A-10492', [
    { width: 1440, height: 900, mobile: false, filename: 'unified_workspace_desktop.jpg', scrollY: 0 },
    { width: 390, height: 844, mobile: true, filename: 'unified_workspace_mobile.jpg', scrollY: 0 },
  ]);

  // 3. Landing page hero for direct comparison
  await captureUrl('http://localhost:3000', [
    { width: 1440, height: 900, mobile: false, filename: 'public_landing_hero_reference.jpg', scrollY: 0 },
  ]);

  console.log('All screenshots completed successfully!');
}

main().catch(console.error);
