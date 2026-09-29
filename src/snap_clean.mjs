import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.url && t.url.includes('localhost:3000')) || list.find(t => t.type === 'page');
  console.log('Connecting to', page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
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
    } catch (err) {
      console.error(err);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    pending.set(cur, resolve);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('Connected');

  await send('Page.enable');
  await send('Runtime.enable');

  // Set desktop viewport 1400 x 900
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  // Helper to capture
  async function captureSection(scrollPos, filename) {
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollPos})` });
    await new Promise(r => setTimeout(r, 600));
    console.log(`Capturing ${filename} at y=${scrollPos}...`);
    const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    if (snap.result?.data) {
      const targetPath = path.join(outDir, filename);
      fs.writeFileSync(targetPath, Buffer.from(snap.result.data, 'base64'));
      console.log(`Saved ${filename} (${snap.result.data.length} bytes)`);
    } else {
      console.warn(`Failed capturing ${filename}:`, snap);
    }
  }

  await captureSection(0, 'our_1_hero.jpg');
  await captureSection(750, 'our_2_features.jpg');
  await captureSection(1550, 'our_3_workflow.jpg');
  await captureSection(2350, 'our_5_suite.jpg');
  await captureSection(3400, 'our_6_footer.jpg');

  // Mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await captureSection(0, 'our_mobile_home.jpg');

  console.log('DONE ALL CAPTURES!');
  ws.close();
}

main().catch(console.error);
