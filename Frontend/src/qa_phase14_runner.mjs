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

    // 1. Visit Results Overview List (/admin/results)
    console.log("Navigating to /admin/results...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/results" });
    await new Promise((r) => setTimeout(r, 1200));
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 600));
    console.log("Capturing phase14_results_list.png...");
    const snap1 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_results_list.png`, Buffer.from(snap1.result.data, "base64"));

    // 2. Visit Result Detail - Question Breakdown (/admin/results/res-01)
    console.log("Navigating to /admin/results/res-01 (Question Breakdown)...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/results/res-01" });
    await new Promise((r) => setTimeout(r, 1200));
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 600));
    console.log("Capturing phase14_result_detail_breakdown.png...");
    const snap2 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_detail_breakdown.png`, Buffer.from(snap2.result.data, "base64"));

    // 3. Switch to Validation Tab
    console.log("Switching to Validation tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const valBtn = btns.find(b => b.innerText.includes('Validation Rules'));
        if (valBtn) valBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log("Capturing phase14_result_validation_inspector.png...");
    const snap3 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_validation_inspector.png`, Buffer.from(snap3.result.data, "base64"));

    // 4. Switch to Provenance Tab
    console.log("Switching to Provenance tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const provBtn = btns.find(b => b.innerText.includes('Provenance'));
        if (provBtn) provBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log("Capturing phase14_result_provenance_tree.png...");
    const snap4 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_provenance_tree.png`, Buffer.from(snap4.result.data, "base64"));

    // 5. Switch to History Tab
    console.log("Switching to History tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const histBtn = btns.find(b => b.innerText.includes('Version History'));
        if (histBtn) histBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log("Capturing phase14_result_history_timeline.png...");
    const snap5 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_history_timeline.png`, Buffer.from(snap5.result.data, "base64"));

    // 6. Open Internal Explainable Report Modal
    console.log("Opening Internal Report Modal...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const repBtn = btns.find(b => b.innerText.includes('Internal Report'));
        if (repBtn) repBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log("Capturing phase14_explainable_report_modal.png...");
    const snap6 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_explainable_report_modal.png`, Buffer.from(snap6.result.data, "base64"));

    // Close Report Modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const closeBtn = btns.find(b => b.innerText.includes('Close'));
        if (closeBtn) closeBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // 7. Open Revaluation Drawer
    console.log("Opening Revaluation Drawer...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const revBtn = btns.find(b => b.innerText.includes('Request Revaluation'));
        if (revBtn) revBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log("Capturing phase14_revaluation_drawer_delta.png...");
    const snap7 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_revaluation_drawer_delta.png`, Buffer.from(snap7.result.data, "base64"));

    // 8. Visit Blocked Result (/admin/results/res-02)
    console.log("Navigating to /admin/results/res-02 (Blocked Result)...");
    await send("Page.navigate", { url: "http://localhost:3000/admin/results/res-02" });
    await new Promise((r) => setTimeout(r, 1200));
    await waitForPageReady();
    await new Promise((r) => setTimeout(r, 500));
    console.log("Capturing phase14_result_validation_blocked.png...");
    const snap8 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${ARTIFACT_DIR}/phase14_result_validation_blocked.png`, Buffer.from(snap8.result.data, "base64"));

    console.log("All Phase 14 screenshots successfully captured!");
    ws.close();
  } catch (err) {
    console.error("QA Runner Error:", err);
  }
}

run();
