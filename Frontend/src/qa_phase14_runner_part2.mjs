import fs from "fs";

const ARTIFACT_DIR = "C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7";

async function run() {
  try {
    const versionRes = await fetch("http://127.0.0.1:9222/json/list");
    const targets = await versionRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) {
      console.error("No page target found");
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

    await new Promise((res) => (ws.onopen = res));
    await send("Page.enable");
    await send("Runtime.enable");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 1536,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const waitForPageReady = async () => {
      for (let i = 0; i < 20; i++) {
        const res = await send("Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => {
            return !document.body.innerText.includes('Verifying ANKLYZE secure session');
          })()`,
        });
        if (res.result && res.result.value) {
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    };

    // 1. Visit /admin/results/res-01 and Open Revaluation Drawer
    console.log("Navigating to /admin/results/res-01 for Revaluation Drawer...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/results/res-01" });
    await new Promise((r) => setTimeout(r, 1200));
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 500));

    console.log("Clicking Request Revaluation...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const revBtn = btns.find(b => b.innerText.includes('Request Revaluation'));
        if (revBtn) revBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    console.log("Capturing phase14_revaluation_drawer_delta.png...");
    const snap1 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_revaluation_drawer_delta.png`, Buffer.from(snap1.result.data, "base64"));

    // 2. Visit Blocked Result (/admin/results/res-02)
    console.log("Navigating to /admin/results/res-02 (Blocked Result)...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/results/res-02" });
    await new Promise((r) => setTimeout(r, 1200));
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 500));

    // Switch to Validation Rules Tab to see blockers
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const valBtn = btns.find(b => b.innerText.includes('Validation Rules'));
        if (valBtn) valBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log("Capturing phase14_result_validation_blocked.png...");
    const snap2 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_validation_blocked.png`, Buffer.from(snap2.result.data, "base64"));

    console.log("Phase 14 QA Completed successfully!");
    ws.close();
  } catch (err) {
    console.error("QA Runner Error:", err);
  }
}

run();
