import fs from "fs";

const ARTIFACT_DIR = "C:/Users/tripa/.gemini/antigravity-ide/brain/812dd324-257e-48cf-9843-90ff819de0c7";

async function run() {
  try {
    const versionRes = await fetch("http://127.0.0.1:9222/json/list");
    const targets = await versionRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) {
      console.error("No page target found on CDP 9222");
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

    const waitForPageReady = async () => {
      for (let i = 0; i < 25; i++) {
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

    const captureScreen = async (filename) => {
      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      if (screenshot.result && screenshot.result.data) {
        fs.writeFileSync(`${ARTIFACT_DIR}/${filename}`, Buffer.from(screenshot.result.data, "base64"));
        console.log(`✓ Saved screenshot: ${filename}`);
      }
    };

    // 1. Desktop Viewport
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1536,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Landing
    await send("Page.navigate", { url: "http://localhost:3000" });
    await new Promise((r) => setTimeout(r, 1200));
    await captureScreen("phase15_landing_desktop.png");

    // Examiner Dashboard
    await send("Page.navigate", { url: "http://localhost:3000/examiner/dashboard" });
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreen("phase15_dashboard_desktop.png");

    // Evaluation Workspace
    await send("Page.navigate", { url: "http://localhost:3000/examiner/evaluate/script-demo-001" });
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 1200));
    await captureScreen("phase15_evaluation_workspace.png");

    // Moderation
    await send("Page.navigate", { url: "http://localhost:3000/moderation" });
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreen("phase15_moderation_queue.png");

    // Results & Revaluation
    await send("Page.navigate", { url: "http://localhost:3000/admin/results" });
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreen("phase15_results_revaluation.png");

    // 2. Mobile Responsive Viewport (390 x 844)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send("Page.navigate", { url: "http://localhost:3000/examiner/dashboard" });
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreen("phase15_examiner_mobile_view.png");

    console.log("====================================================");
    console.log("Phase 15 Browser QA Pass Completed Successfully");
    console.log("====================================================");

    ws.close();
  } catch (err) {
    console.error("Browser QA Error:", err);
  }
}

run();
