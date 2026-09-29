import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  
  // 1. Create a fresh dedicated tab
  console.log('Creating new tab for localhost:3000...');
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
  const target = await newTabRes.json();
  console.log('Created dedicated tab:', target.id, target.webSocketDebuggerUrl);

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
  console.log('WebSocket connected to dedicated tab');

  await send('Page.enable');
  await send('Runtime.enable');
  
  // Wait 3s for Next.js to fully render
  await new Promise(r => setTimeout(r, 3000));

  // Set desktop viewport 1400 x 900
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  async function capture(scrollY, filename) {
    console.log(`Capturing ${filename} at y=${scrollY}...`);
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 600));
    const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    if (snap.result?.data) {
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.result.data, 'base64'));
      console.log(`✓ Saved ${filename}`);
    } else {
      console.error(`✗ Failed ${filename}:`, snap);
    }
  }

  // Capture all 5 desktop sections
  await capture(0, 'our_1_hero.jpg');
  await capture(750, 'our_2_features.jpg');
  await capture(1550, 'our_3_workflow.jpg');
  await capture(2350, 'our_5_suite.jpg');
  await capture(3400, 'our_6_footer.jpg');

  // Mobile capture
  console.log('Switching to mobile viewport 375x812...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' })` });
  await new Promise(r => setTimeout(r, 600));
  const mobileSnap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (mobileSnap.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_mobile_home.jpg'), Buffer.from(mobileSnap.result.data, 'base64'));
    console.log('✓ Saved our_mobile_home.jpg');
  }

  ws.close();

  // Close the tab cleanly
  console.log('Closing dedicated tab...');
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  console.log('ALL SCREENSHOTS CAPTURED AND CLEANED UP!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
