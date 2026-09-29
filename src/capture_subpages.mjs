import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  const subpages = [
    { url: 'http://localhost:3000/ai-answer-sheet-evaluation', filename: 'our_ai_eval_page.jpg' },
    { url: 'http://localhost:3000/handwritten-answer-sheet-grading', filename: 'our_handwritten_page.jpg' },
    { url: 'http://localhost:3000/pricing', filename: 'our_pricing_page.jpg' },
    { url: 'http://localhost:3000/contact', filename: 'our_contact_page.jpg' }
  ];

  for (const page of subpages) {
    console.log(`Opening ${page.url} ...`);
    const newTabRes = await fetch(`http://127.0.0.1:9222/json/new?${page.url}`, { method: 'PUT' });
    const target = await newTabRes.json();

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
    await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1200));

    const snap = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    if (snap.result?.data) {
      fs.writeFileSync(path.join(outDir, page.filename), Buffer.from(snap.result.data, 'base64'));
      console.log(`✓ Saved ${page.filename}`);
    }

    ws.close();
    await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  }

  console.log('ALL SUBPAGE SCREENSHOTS CAPTURED!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
