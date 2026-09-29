import fs from 'fs';

async function run() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find(t => t.url && t.url.includes('localhost:3000')) || targets.find(t => t.type === 'page');
  
  if (!pageTarget) {
    console.error('No target found');
    return;
  }

  console.log('Connecting to target:', pageTarget.url, pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolver = pending.get(data.id);
      pending.delete(data.id);
      resolver(data);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((res) => ws.onopen = res);
  await send('Page.enable');
  await send('Runtime.enable');

  // Desktop viewport 1400 x 900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Reload or ensure page is fresh
  console.log('Navigating to http://localhost:3000/ ...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Hero
  console.log('Capturing our_1_hero.png...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 800));
  const s1 = await send('Page.captureScreenshot', { format: 'png' });
  if (s1.result?.data) fs.writeFileSync('our_1_hero.png', Buffer.from(s1.result.data, 'base64'));

  // 2. Metrics & Human in Loop
  console.log('Capturing our_2_features.png...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 750)' });
  await new Promise(r => setTimeout(r, 800));
  const s2 = await send('Page.captureScreenshot', { format: 'png' });
  if (s2.result?.data) fs.writeFileSync('our_2_features.png', Buffer.from(s2.result.data, 'base64'));

  // 3. Workflow
  console.log('Capturing our_3_workflow.png...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1550)' });
  await new Promise(r => setTimeout(r, 800));
  const s3 = await send('Page.captureScreenshot', { format: 'png' });
  if (s3.result?.data) fs.writeFileSync('our_3_workflow.png', Buffer.from(s3.result.data, 'base64'));

  // 4. Feature Suite
  console.log('Capturing our_5_suite.png...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2350)' });
  await new Promise(r => setTimeout(r, 800));
  const s4 = await send('Page.captureScreenshot', { format: 'png' });
  if (s4.result?.data) fs.writeFileSync('our_5_suite.png', Buffer.from(s4.result.data, 'base64'));

  // 5. Footer
  console.log('Capturing our_6_footer.png...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3400)' });
  await new Promise(r => setTimeout(r, 800));
  const s5 = await send('Page.captureScreenshot', { format: 'png' });
  if (s5.result?.data) fs.writeFileSync('our_6_footer.png', Buffer.from(s5.result.data, 'base64'));

  // 6. Mobile View
  console.log('Capturing our_mobile_home.png...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 1000));
  const sm = await send('Page.captureScreenshot', { format: 'png' });
  if (sm.result?.data) fs.writeFileSync('our_mobile_home.png', Buffer.from(sm.result.data, 'base64'));

  console.log('All screenshots captured successfully!');
  ws.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
