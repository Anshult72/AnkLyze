import fs from 'fs';
import path from 'path';

async function capture() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  let target = targets.find(t => t.type === 'page');

  if (!target) {
    const newTargetRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
    target = await newTargetRes.json();
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const resolver = pending.get(data.id);
        pending.delete(data.id);
        resolver(data);
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      console.log(`Sending ${method} (#${id})`);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => ws.onopen = res);
  console.log('WS connected to page');

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000/ ...');
  const navRes = await send('Page.navigate', { url: 'http://localhost:3000/' });
  console.log('Navigated, waiting 3s for render...');
  await new Promise(r => setTimeout(r, 3000));

  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';

  // 1. Hero capture
  console.log('Capturing hero screenshot...');
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_1_hero.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_1_hero.png');
  }

  // Scroll down to Metrics & Human in loop
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 700)' });
  await new Promise(r => setTimeout(r, 800));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_2_features.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_2_features.png');
  }

  // Scroll down to workflow cards
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1400)' });
  await new Promise(r => setTimeout(r, 800));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_3_workflow.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_3_workflow.png');
  }

  // Scroll down to feature suite
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2200)' });
  await new Promise(r => setTimeout(r, 800));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_5_suite.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_5_suite.png');
  }

  // Scroll to footer
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3200)' });
  await new Promise(r => setTimeout(r, 800));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_6_footer.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_6_footer.png');
  }

  // Mobile capture
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 1000));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_mobile_home.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('Captured our_mobile_home.png');
  }

  ws.close();
  console.log('Finished capturing all Home page views!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
