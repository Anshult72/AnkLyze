import fs from 'fs';
import path from 'path';

async function testSection2() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.url && t.url.includes('localhost:3000')) || list.find(t => t.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
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

  // Scroll to section 2 (Trust Metrics and Workflow)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Capturing section 2...');
  const s2 = await send('Page.captureScreenshot', { format: 'png' });
  if (s2.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_2_features.png'), Buffer.from(s2.result.data, 'base64'));
    console.log('Saved our_2_features.png!');
  }

  // Scroll to section 3 (Feature Suite)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1900)' });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing section 3...');
  const s3 = await send('Page.captureScreenshot', { format: 'png' });
  if (s3.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_3_workflow.png'), Buffer.from(s3.result.data, 'base64'));
    console.log('Saved our_3_workflow.png!');
  }

  // Scroll to footer
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2900)' });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing footer...');
  const s4 = await send('Page.captureScreenshot', { format: 'png' });
  if (s4.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_6_footer.png'), Buffer.from(s4.result.data, 'base64'));
    console.log('Saved our_6_footer.png!');
  }

  // Mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing mobile...');
  const sM = await send('Page.captureScreenshot', { format: 'png' });
  if (sM.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_mobile_home.png'), Buffer.from(sM.result.data, 'base64'));
    console.log('Saved our_mobile_home.png!');
  }

  ws.close();
}

testSection2().catch(console.error);
