import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.url && t.url.includes('localhost:3000')) || list.find(t => t.type === 'page');

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
    } catch (err) {}
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    pending.set(cur, resolve);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');

  // Set desktop viewport 1400 x 900
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  async function snapClip(y, filename) {
    console.log(`Snapping clip at y=${y} -> ${filename}...`);
    const snap = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 85,
      clip: { x: 0, y, width: 1400, height: 900, scale: 1 },
      captureBeyondViewport: true
    });
    if (snap.result?.data) {
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.result.data, 'base64'));
      console.log('Saved', filename);
    } else {
      console.warn('Failed', snap);
    }
  }

  await snapClip(0, 'our_1_hero.jpg');
  await snapClip(750, 'our_2_features.jpg');
  await snapClip(1500, 'our_3_workflow.jpg');
  await snapClip(2250, 'our_5_suite.jpg');
  await snapClip(3100, 'our_6_footer.jpg');

  // Mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  console.log('Snapping mobile...');
  const snapM = await send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 85,
    clip: { x: 0, y: 0, width: 375, height: 812, scale: 2 },
    captureBeyondViewport: true
  });
  if (snapM.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_mobile_home.jpg'), Buffer.from(snapM.result.data, 'base64'));
    console.log('Saved our_mobile_home.jpg');
  }

  console.log('ALL SECTIONS CAPTURED!');
  ws.close();
}

main().catch(console.error);
