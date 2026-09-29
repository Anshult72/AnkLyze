import fs from 'fs';
import path from 'path';

const [yStr, filename, isMobile] = process.argv.slice(2);
const y = parseInt(yStr || '0', 10);
const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.url && t.url.includes('localhost:3000')) || list.find(t => t.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    const onMsg = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(msg);
        }
      } catch (err) {}
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  if (isMobile === 'mobile') {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  } else {
    await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  }

  // Scroll
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${y}, behavior: 'instant' })` });
  await new Promise(r => setTimeout(r, 600));

  const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
  if (snap.result?.data) {
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.result.data, 'base64'));
    console.log(`SUCCESS: saved ${filename}`);
  } else {
    console.log(`FAILED: ${JSON.stringify(snap)}`);
  }

  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
