import fs from 'fs';

async function run() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find(t => t.url && t.url.includes('papergrader.in')) || targets.find(t => t.type === 'page');
  
  if (!pageTarget) {
    console.error('No target found');
    return;
  }

  console.log('Connecting to target:', pageTarget.url, pageTarget.webSocketDebuggerUrl);
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

  // Set desktop viewport 1440 x 900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Extract site info
  const extractCode = `(() => {
    const navLinks = Array.from(document.querySelectorAll('header a, nav a')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href')
    }));

    const footerLinks = Array.from(document.querySelectorAll('footer a')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href')
    }));

    const allSections = Array.from(document.querySelectorAll('section, main > div, body > div')).map((el, i) => {
      const h1 = el.querySelector('h1')?.innerText?.trim();
      const h2 = el.querySelector('h2')?.innerText?.trim();
      const h3 = Array.from(el.querySelectorAll('h3')).map(h => h.innerText.trim());
      const p = Array.from(el.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
      const btns = Array.from(el.querySelectorAll('button, a[class*="btn"], a[class*="button"]')).map(b => b.innerText.trim());
      const bg = window.getComputedStyle(el).backgroundColor;
      return { index: i, h1, h2, h3, pPreview: p.slice(0, 3), btns, bg };
    }).filter(s => s.h1 || s.h2 || s.h3.length > 0 || s.btns.length > 0);

    const bodyStyle = window.getComputedStyle(document.body);
    const heroH1 = document.querySelector('h1');
    const heroH1Style = heroH1 ? window.getComputedStyle(heroH1) : null;
    const heroBtn = document.querySelector('header a, main button, main a');
    const heroBtnStyle = heroBtn ? window.getComputedStyle(heroBtn) : null;

    return {
      title: document.title,
      navLinks,
      footerLinks,
      styles: {
        bodyBg: bodyStyle.backgroundColor,
        fontFamily: bodyStyle.fontFamily,
        h1Color: heroH1Style?.color,
        h1FontSize: heroH1Style?.fontSize,
        h1FontWeight: heroH1Style?.fontWeight,
        btnBg: heroBtnStyle?.backgroundColor,
        btnColor: heroBtnStyle?.color
      },
      sections: allSections
    };
  })()`;

  const infoRes = await send('Runtime.evaluate', {
    expression: extractCode,
    returnByValue: true
  });

  const siteData = infoRes.result?.value || {};
  fs.writeFileSync('papergrader_site_data.json', JSON.stringify(siteData, null, 2));
  console.log('Site data written to papergrader_site_data.json');

  // Let's take sequential screenshots as we scroll
  // Top / Hero
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 800));
  const s1 = await send('Page.captureScreenshot', { format: 'png' });
  if (s1.result?.data) fs.writeFileSync('ref_1_hero.png', Buffer.from(s1.result.data, 'base64'));

  // Section 2
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise(r => setTimeout(r, 800));
  const s2 = await send('Page.captureScreenshot', { format: 'png' });
  if (s2.result?.data) fs.writeFileSync('ref_2_features.png', Buffer.from(s2.result.data, 'base64'));

  // Section 3
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1600)' });
  await new Promise(r => setTimeout(r, 800));
  const s3 = await send('Page.captureScreenshot', { format: 'png' });
  if (s3.result?.data) fs.writeFileSync('ref_3_workflow.png', Buffer.from(s3.result.data, 'base64'));

  // Section 4
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2400)' });
  await new Promise(r => setTimeout(r, 800));
  const s4 = await send('Page.captureScreenshot', { format: 'png' });
  if (s4.result?.data) fs.writeFileSync('ref_4_solutions.png', Buffer.from(s4.result.data, 'base64'));

  // Section 5
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3200)' });
  await new Promise(r => setTimeout(r, 800));
  const s5 = await send('Page.captureScreenshot', { format: 'png' });
  if (s5.result?.data) fs.writeFileSync('ref_5_testimonials.png', Buffer.from(s5.result.data, 'base64'));

  // Footer
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 4200)' });
  await new Promise(r => setTimeout(r, 800));
  const s6 = await send('Page.captureScreenshot', { format: 'png' });
  if (s6.result?.data) fs.writeFileSync('ref_6_footer.png', Buffer.from(s6.result.data, 'base64'));

  // Mobile View
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await new Promise(r => setTimeout(r, 1000));
  const sm1 = await send('Page.captureScreenshot', { format: 'png' });
  if (sm1.result?.data) fs.writeFileSync('ref_mobile_hero.png', Buffer.from(sm1.result.data, 'base64'));

  ws.close();
  console.log('Inspection complete and screenshots saved.');
}

run().catch(console.error);
