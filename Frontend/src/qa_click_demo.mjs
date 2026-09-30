import fs from 'fs';

async function run() {
  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await versionRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
      console.error('No page target found on port 9222');
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
    await send('DOM.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to login page...');
    await send('Page.navigate', { url: 'http://localhost:3000/login?redirect=%2Fexaminer%2Fevaluate%2FA-10492' });
    await new Promise((r) => setTimeout(r, 2000));

    // Get position of Examiner demo card
    const evalDemoBtn = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('button'));
        const card = cards.find(c => c.innerText.includes('Prof. R.K. Sharma') || c.innerText.includes('Examiner'));
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`
    });

    console.log('Examiner card position:', evalDemoBtn.result.value);

    if (evalDemoBtn.result.value) {
      const { x, y } = evalDemoBtn.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      console.log('Dispatched mouse click on Examiner card');
    }

    await new Promise((r) => setTimeout(r, 800));

    // Get position of submit button
    const evalSubmitBtn = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submit = btns.find(b => b.innerText.includes('Secure Sign In') || b.type === 'submit');
        if (!submit) return null;
        const rect = submit.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`
    });

    console.log('Submit button position:', evalSubmitBtn.result.value);

    if (evalSubmitBtn.result.value) {
      const { x, y } = evalSubmitBtn.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      console.log('Dispatched mouse click on Submit button');
    }

    // Wait for Next.js transition
    console.log('Waiting for evaluation workspace transition...');
    await new Promise((r) => setTimeout(r, 3500));

    const currentUrl = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `window.location.href`
    });
    console.log('Active Page URL:', currentUrl.result.value);

    // 1. Capture Risk Workspace
    console.log('Capturing Risk Workspace with Double Evaluation comparison...');
    const snapWorkspace = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase12_risk_workspace.png', Buffer.from(snapWorkspace.result.data, 'base64'));

    // 2. Open Risk Breakdown Modal
    console.log('Opening Risk Breakdown Modal...');
    const modalBtnPos = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const btn = document.getElementById('btn-view-risk-factors');
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`
    });

    if (modalBtnPos.result.value) {
      const { x, y } = modalBtnPos.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    }
    await new Promise((r) => setTimeout(r, 1000));

    console.log('Capturing Risk Breakdown Modal...');
    const snapModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase12_risk_breakdown_modal.png', Buffer.from(snapModal.result.data, 'base64'));

    // 3. Close Modal
    console.log('Closing Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const closeBtn = allBtns.find(b => b.innerText.includes('Close Breakdown') || b.querySelector('svg.lucide-x'));
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // 4. Mobile Responsiveness Test
    console.log('Testing Mobile Responsiveness (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase12_mobile_view.png', Buffer.from(snapMobile.result.data, 'base64'));

    console.log('Phase 12 Browser QA completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('QA Error:', err);
    process.exit(1);
  }
}

run();
