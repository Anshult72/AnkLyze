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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to /login?redirect=%2Fexaminer%2Fevaluate%2FA-10492 ...');
    await send('Page.navigate', { url: 'http://localhost:3000/login?redirect=%2Fexaminer%2Fevaluate%2FA-10492' });
    await new Promise((r) => setTimeout(r, 2000));

    // Fill form and submit using requestSubmit
    console.log('Filling form and submitting via requestSubmit...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelectorAll('input')[0];
        const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
        
        if (emailInput && passInput) {
          const nativeEmailSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeEmailSetter.call(emailInput, 'examiner@anklyze.demo');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));

          const nativePassSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativePassSetter.call(passInput, 'AnklyzeDemo#2026');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          passInput.dispatchEvent(new Event('change', { bubbles: true }));

          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        }
      })()`
    });

    // Wait for redirect to evaluation workspace
    await new Promise((r) => setTimeout(r, 3500));

    const checkUrl = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `window.location.href`
    });
    console.log('Current URL after login:', checkUrl.result.value);

    // 1. Capture Risk Badge & Double Evaluation Workspace
    console.log('Capturing Risk Workspace with Double Evaluation comparison...');
    const snapWorkspace = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase12_risk_workspace.png', Buffer.from(snapWorkspace.result.data, 'base64'));

    // 2. Open Risk Breakdown Modal
    console.log('Opening Risk Breakdown Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-view-risk-factors');
        if (btn) {
          btn.click();
        } else {
          const allBtns = Array.from(document.querySelectorAll('button'));
          const target = allBtns.find(b => b.innerText.includes('View Risk Breakdown') || b.innerText.includes('View Factors'));
          if (target) target.click();
        }
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

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

    console.log('Phase 12 Browser QA Screenshots captured successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Browser QA Error:', err);
    process.exit(1);
  }
}

run();
