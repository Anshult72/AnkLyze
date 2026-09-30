import fs from 'fs';

async function run() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    return;
  }

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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1536,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate directly to examiner evaluate page (session already stored in browser)
  console.log('Navigating to evaluate page...');
  await send('Page.navigate', { url: 'http://localhost:3000/examiner/evaluate/A-10492' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Capture Draft State
  console.log('Capturing Draft Workspace...');
  const snapDraft = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_workspace_draft.png', Buffer.from(snapDraft.result.data, 'base64'));

  // 2. Open History Drawer
  console.log('Opening History Drawer...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const histBtn = btns.find(b => b.innerText.includes('View History'));
      if (histBtn) histBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Capturing History Drawer...');
  const snapHist = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_history_drawer.png', Buffer.from(snapHist.result.data, 'base64'));

  // Close History Drawer
  console.log('Closing History Drawer...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.innerText.includes('Close') || b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // 3. Finalize Decision
  console.log('Finalizing Decision...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finBtn = btns.find(b => b.innerText.includes('Finalize Decision'));
      if (finBtn) finBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Capturing Final Locked State...');
  const snapFinal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_final_locked_state.png', Buffer.from(snapFinal.result.data, 'base64'));

  // 4. Click Reopen Decision to open Modal
  console.log('Opening Reopen Modal...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reopenBtn = btns.find(b => b.innerText.includes('Reopen Decision'));
      if (reopenBtn) reopenBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log('Capturing Reopen Modal...');
  const snapReopenModal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_reopen_modal.png', Buffer.from(snapReopenModal.result.data, 'base64'));

  // 5. Submit Reopen
  console.log('Submitting Reopen...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Formal student grievance received for step marking in phasor calculation';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirm & Reopen'));
      if (confirmBtn) confirmBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Capturing Reopened State...');
  const snapReopened = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_reopened_state.png', Buffer.from(snapReopened.result.data, 'base64'));

  console.log('All screenshots captured successfully!');
  ws.close();
}

run().catch(console.error);
