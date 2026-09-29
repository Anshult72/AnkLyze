import fs from 'fs';
import path from 'path';

async function auditSolutionPage() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  console.log('Opening https://papergrader.in/ai-answer-sheet-evaluation ...');
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?https://papergrader.in/ai-answer-sheet-evaluation', { method: 'PUT' });
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
  await send('Runtime.enable');

  // Wait 4s for network load
  await new Promise(r => setTimeout(r, 4000));

  // Extract page headings and structure
  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const h1 = document.querySelector('h1')?.innerText?.trim();
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: h.innerText.trim() }));
      const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
      return { title: document.title, h1, headings, paragraphs: paragraphs.slice(0, 15) };
    })()`
  });

  console.log('Page info:', JSON.stringify(info.result?.value, null, 2));

  // Desktop viewport 1400 x 900
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 600));

  const snap1 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (snap1.result?.data) {
    fs.writeFileSync(path.join(outDir, 'ref_solution_hero.jpg'), Buffer.from(snap1.result.data, 'base64'));
    console.log('✓ Saved ref_solution_hero.jpg');
  }

  // Scroll down
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise(r => setTimeout(r, 600));
  const snap2 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (snap2.result?.data) {
    fs.writeFileSync(path.join(outDir, 'ref_solution_mid.jpg'), Buffer.from(snap2.result.data, 'base64'));
    console.log('✓ Saved ref_solution_mid.jpg');
  }

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  console.log('Done auditing solution page!');
  process.exit(0);
}

auditSolutionPage().catch(err => {
  console.error(err);
  process.exit(1);
});
