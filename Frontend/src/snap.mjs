import fs from 'fs';
import path from 'path';

async function snap() {
  const outDir = 'C:\\Users\\tripa\\.gemini\\antigravity-ide\\brain\\4c647d67-f7ca-49ec-9475-eca48958cb97';
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find(t => t.url && t.url.includes('localhost:3000')) || targets.find(t => t.type === 'page');
  console.log('Target:', pageTarget.title, pageTarget.url);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === cur) {
        ws.removeEventListener('message', handler);
        resolve(msg);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('WS Open');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // Desktop Viewport 1440 x 900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Ensure scroll is at top
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Hero
  console.log('Capturing our_1_hero.jpg...');
  const res1 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (res1.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_1_hero.jpg'), Buffer.from(res1.result.data, 'base64'));
    console.log('Saved our_1_hero.jpg');
  }

  // 2. Metrics & Human in Loop
  console.log('Capturing our_2_features.jpg...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 750)' });
  await new Promise(r => setTimeout(r, 600));
  const res2 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (res2.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_2_features.jpg'), Buffer.from(res2.result.data, 'base64'));
    console.log('Saved our_2_features.jpg');
  }

  // 3. Workflow
  console.log('Capturing our_3_workflow.jpg...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1550)' });
  await new Promise(r => setTimeout(r, 600));
  const res3 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (res3.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_3_workflow.jpg'), Buffer.from(res3.result.data, 'base64'));
    console.log('Saved our_3_workflow.jpg');
  }

  // 4. Feature Suite
  console.log('Capturing our_5_suite.jpg...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2350)' });
  await new Promise(r => setTimeout(r, 600));
  const res4 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (res4.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_5_suite.jpg'), Buffer.from(res4.result.data, 'base64'));
    console.log('Saved our_5_suite.jpg');
  }

  // 5. Footer
  console.log('Capturing our_6_footer.jpg...');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3400)' });
  await new Promise(r => setTimeout(r, 600));
  const res5 = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (res5.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_6_footer.jpg'), Buffer.from(res5.result.data, 'base64'));
    console.log('Saved our_6_footer.jpg');
  }

  // 6. Mobile
  console.log('Capturing our_mobile_home.jpg...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 600));
  const resM = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  if (resM.result?.data) {
    fs.writeFileSync(path.join(outDir, 'our_mobile_home.jpg'), Buffer.from(resM.result.data, 'base64'));
    console.log('Saved our_mobile_home.jpg');
  }

  console.log('ALL HOME SCREENSHOTS SAVED!');
  ws.close();
}

snap().catch(console.error);
