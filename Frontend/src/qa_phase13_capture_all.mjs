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

    // 1. Visit Moderation Queue
    console.log("Navigating to /moderation...");
    await send("Page.navigate", { url: "http://localhost:3000/moderation" });
    await new Promise((r) => setTimeout(r, 2500));
    console.log("Capturing phase13_moderation_queue.png...");
    const snap1 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase13_moderation_queue.png`, Buffer.from(snap1.result.data, "base64"));

    // 2. Visit Moderation Workspace Detail
    console.log("Navigating to /moderation/case-01...");
    await send("Page.navigate", { url: "http://localhost:3000/moderation/case-01" });
    await new Promise((r) => setTimeout(r, 2500));
    console.log("Capturing phase13_moderator_workspace.png...");
    const snap2 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase13_moderator_workspace.png`, Buffer.from(snap2.result.data, "base64"));

    // 3. Visit Quality & Consistency Analytics (Tab 1: Coverage)
    console.log("Navigating to /admin/analytics...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/analytics" });
    await new Promise((r) => setTimeout(r, 2500));
    console.log("Capturing phase13_analytics_coverage.png...");
    const snap3 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase13_analytics_coverage.png`, Buffer.from(snap3.result.data, "base64"));

    // Click Evaluator Consistency Tab
    console.log("Switching to Evaluator Consistency tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText.includes('Evaluator Consistency'));
        if (target) target.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Capturing phase13_analytics_consistency.png...");
    const snap4 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase13_analytics_consistency.png`, Buffer.from(snap4.result.data, "base64"));

    // Click Evaluator Drift Signals Tab
    console.log("Switching to Drift Signals tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.innerText.includes('Drift Signals'));
        if (target) target.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Capturing phase13_analytics_drift.png...");
    const snap5 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase13_analytics_drift.png`, Buffer.from(snap5.result.data, "base64"));

    console.log("Screenshots captured successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Browser QA Error:", err);
    process.exit(1);
  }
}

run();
