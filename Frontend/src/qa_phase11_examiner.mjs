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

  console.log('Navigating to http://localhost:3000/login?redirect=%2Fexaminer%2Fevaluate%2FA-10492 ...');
  await send('Page.navigate', { url: 'http://localhost:3000/login?redirect=%2Fexaminer%2Fevaluate%2FA-10492' });
  await new Promise((r) => setTimeout(r, 2000));

  // Perform form fill and submit directly
  console.log('Filling form and submitting...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelectorAll('input')[0];
      const passInput = document.querySelector('input[type="password"]') || document.querySelectorAll('input')[1];
      
      if (emailInput && passInput) {
        // Set native values
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
  await new Promise((r) => setTimeout(r, 3000));

  // Step 1: Check initial page DOM in evaluate workspace
  const initialCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      return {
        url: window.location.href,
        hasViewer: document.body.innerText.includes('ANSWER SHEET VIEWER'),
        hasEvaluationPanel: document.body.innerText.includes('AI ASSESSMENT'),
        hasDecisionPanel: document.body.innerText.includes('YOUR DECISION'),
        versionText: document.body.innerText.match(/v\\d+ · DRAFT|v\\d+ · FINAL/)?.[0] || 'not found',
        suggestedMarks: document.body.innerText.includes('4.5 / 6') || document.body.innerText.includes('/ 6'),
      };
    })()`
  });
  console.log('Step 1 - Initial State:', initialCheck.result ? initialCheck.result.value : initialCheck);

  // Take screenshot 1: Initial Workspace
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_workspace_initial.png', Buffer.from(snap1.result.data, 'base64'));

  // Step 2: Click Accept Suggestion
  console.log('Step 2: Clicking Accept Suggestion...');
  const acceptClick = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b => b.innerText.includes('Accept AI Suggestion'));
      if (acceptBtn) {
        acceptBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });
  console.log('Step 2 - Accept Suggestion clicked:', acceptClick.result ? acceptClick.result.value : acceptClick);
  await new Promise((r) => setTimeout(r, 800));

  // Step 3: Trigger an override by incrementing a criterion mark
  console.log('Step 3: Modifying criterion marks...');
  const overrideAction = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      // Find plus buttons for criterion
      const plusBtns = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('svg.lucide-plus') || b.innerText === '+');
      if (plusBtns.length > 0) {
        plusBtns[0].click();
      }
      // Set override reason
      const reasonSelect = document.querySelector('select');
      if (reasonSelect) {
        reasonSelect.value = 'Partial credit applied according to rubric';
        reasonSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        plusClicked: plusBtns.length > 0,
        selectVal: reasonSelect ? reasonSelect.value : null
      };
    })()`
  });
  console.log('Step 3 - Override Action:', overrideAction.result ? overrideAction.result.value : overrideAction);
  await new Promise((r) => setTimeout(r, 800));

  // Step 4: Click Save Draft
  console.log('Step 4: Clicking Save Draft...');
  const saveDraft = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const draftBtn = btns.find(b => b.innerText.includes('Save Draft'));
      if (draftBtn) {
        draftBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });
  console.log('Step 4 - Save Draft clicked:', saveDraft.result ? saveDraft.result.value : saveDraft);
  await new Promise((r) => setTimeout(r, 1000));

  // Step 5: Click View History to open History Drawer / Modal
  console.log('Step 5: Clicking View History...');
  const openHistory = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const histBtn = btns.find(b => b.innerText.includes('View History'));
      if (histBtn) {
        histBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });
  console.log('Step 5 - View History clicked:', openHistory.result ? openHistory.result.value : openHistory);
  await new Promise((r) => setTimeout(r, 1000));

  // Screenshot 2: History Drawer
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_history_drawer.png', Buffer.from(snap2.result.data, 'base64'));

  // Close history drawer
  console.log('Closing history drawer...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.innerText.includes('Close') || b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Step 6: Finalize Decision
  console.log('Step 6: Finalizing Decision...');
  const finalizeClick = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finBtn = btns.find(b => b.innerText.includes('Finalize Decision'));
      if (finBtn) {
        finBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });
  console.log('Step 6 - Finalize clicked:', finalizeClick.result ? finalizeClick.result.value : finalizeClick);
  await new Promise((r) => setTimeout(r, 1000));

  // Screenshot 3: Final Locked State
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_final_locked_state.png', Buffer.from(snap3.result.data, 'base64'));

  // Step 7: Click Reopen Decision
  console.log('Step 7: Clicking Reopen Decision...');
  const reopenClick = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reopenBtn = btns.find(b => b.innerText.includes('Reopen Decision'));
      if (reopenBtn) {
        reopenBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });
  console.log('Step 7 - Reopen clicked:', reopenClick.result ? reopenClick.result.value : reopenClick);
  await new Promise((r) => setTimeout(r, 800));

  // Fill Reopen reason in modal
  console.log('Step 8: Submitting Reopen reason...');
  const submitReopen = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Formal student revaluation request received for calculation verification';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirm & Reopen'));
      if (confirmBtn) {
        confirmBtn.click();
        return 'reopened';
      }
      return 'confirm btn not found';
    })()`
  });
  console.log('Step 8 - Submit Reopen:', submitReopen.result ? submitReopen.result.value : submitReopen);
  await new Promise((r) => setTimeout(r, 1000));

  // Screenshot 4: Post-reopen Draft State
  const snap4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7/phase11_reopened_state.png', Buffer.from(snap4.result.data, 'base64'));

  const finalSummary = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      return {
        statusBadge: document.body.innerText.match(/v\\d+ · DRAFT|v\\d+ · FINAL/)?.[0] || 'not found',
        hasNotification: !!document.querySelector('.fixed.bottom-4.right-4') || document.body.innerText.includes('Decision reopened as Draft'),
        totalMarksDisplayed: document.querySelector('.text-2xl.font-serif')?.innerText || 'not found'
      };
    })()`
  });
  console.log('Final Summary Verification:', finalSummary.result ? finalSummary.result.value : finalSummary);

  ws.close();
}

run().catch(console.error);
