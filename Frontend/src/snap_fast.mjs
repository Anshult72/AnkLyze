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
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  async function takeSnap(filename) {
    const snap = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 85,
      captureBeyondViewport: false
    });
    if (snap.result?.data) {
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.result.data, 'base64'));
      console.log('Saved', filename);
    }
  }

  // 1. Hero
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 400));
  await takeSnap('our_1_hero.jpg');

  // 2. Trust & Workflow top
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 750)' });
  await new Promise(r => setTimeout(r, 400));
  await takeSnap('our_2_features.jpg');

  // 3. Workflow cards
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1550)' });
  await new Promise(r => setTimeout(r, 400));
  await takeSnap('our_3_workflow.jpg');

  // 4. Feature Suite
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2300)' });
  await new Promise(r => setTimeout(r, 400));
  await takeSnap('our_5_suite.jpg');

  // 5. Footer
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3300)' });
  await new Promise(r => setTimeout(r, 400));
  await takeSnap('our_6_footer.jpg');

  // Mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 500));
  await takeSnap('our_mobile_home.jpg');

  console.log('DONE ALL SECTIONS SUCCESSFULLY!');
  ws.close();
}

main().catch(console.error);
