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

  console.log('Navigating to https://papergrader.in/ ...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'https://papergrader.in/' });
  // Wait for network idle / page load
  await new Promise((r) => setTimeout(r, 6000));

  // Extract site structure, navigation links, headings, and sections
  const siteAnalysis = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        location: a.closest('header, nav') ? 'header' : a.closest('footer') ? 'footer' : 'body'
      }));

      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        tag: h.tagName,
        text: h.textContent.trim()
      }));

      const computedBody = window.getComputedStyle(document.body);
      const computedH1 = document.querySelector('h1') ? window.getComputedStyle(document.querySelector('h1')) : null;
      const primaryBtn = document.querySelector('button, a.btn, [class*="button"], [class*="btn"]') ? 
        window.getComputedStyle(document.querySelector('button, a.btn, [class*="button"], [class*="btn"]')) : null;

      const metaTheme = document.querySelector('meta[name="theme-color"]')?.content;

      // Extract sections in order
      const sections = Array.from(document.querySelectorAll('section, main > div, header + div, body > div')).map((sec, idx) => {
        const h2 = sec.querySelector('h2')?.textContent.trim();
        const h3 = sec.querySelector('h3')?.textContent.trim();
        const p = sec.querySelector('p')?.textContent.trim();
        const classes = sec.className;
        const bg = window.getComputedStyle(sec).backgroundColor;
        return { index: idx, h2, h3, preview: p?.slice(0, 100), bg, classes: typeof classes === 'string' ? classes.slice(0, 100) : '' };
      });

      return {
        title: document.title,
        themeColor: metaTheme,
        fontFamily: computedBody.fontFamily,
        bodyBg: computedBody.backgroundColor,
        h1Color: computedH1?.color,
        h1FontSize: computedH1?.fontSize,
        h1FontWeight: computedH1?.fontWeight,
        links,
        headings,
        sections: sections.filter(s => s.h2 || s.h3 || s.preview)
      };
    })()`
  });

  fs.writeFileSync('papergrader_analysis.json', JSON.stringify(siteAnalysis.result?.value, null, 2));
  console.log('Saved papergrader_analysis.json');

  // Capture desktop screenshots (Hero and Top Section)
  const heroScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (heroScreenshot.result?.data) {
    fs.writeFileSync('ref_desktop_hero.png', Buffer.from(heroScreenshot.result.data, 'base64'));
    console.log('Saved ref_desktop_hero.png');
  }

  // Scroll down to mid-page
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 1200, behavior: 'instant' });` });
  await new Promise((r) => setTimeout(r, 1000));
  const midScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (midScreenshot.result?.data) {
    fs.writeFileSync('ref_desktop_mid.png', Buffer.from(midScreenshot.result.data, 'base64'));
    console.log('Saved ref_desktop_mid.png');
  }

  // Scroll down to features & workflow
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 2500, behavior: 'instant' });` });
  await new Promise((r) => setTimeout(r, 1000));
  const workflowScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (workflowScreenshot.result?.data) {
    fs.writeFileSync('ref_desktop_workflow.png', Buffer.from(workflowScreenshot.result.data, 'base64'));
    console.log('Saved ref_desktop_workflow.png');
  }

  // Scroll to footer
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 4000, behavior: 'instant' });` });
  await new Promise((r) => setTimeout(r, 1000));
  const footerScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (footerScreenshot.result?.data) {
    fs.writeFileSync('ref_desktop_footer.png', Buffer.from(footerScreenshot.result.data, 'base64'));
    console.log('Saved ref_desktop_footer.png');
  }

  // Mobile screenshot (375 x 812)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' });` });
  await new Promise((r) => setTimeout(r, 1000));
  const mobileScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (mobileScreenshot.result?.data) {
    fs.writeFileSync('ref_mobile_hero.png', Buffer.from(mobileScreenshot.result.data, 'base64'));
    console.log('Saved ref_mobile_hero.png');
  }

  ws.close();
  console.log('Reference audit complete!');
}

run().catch(console.error);
