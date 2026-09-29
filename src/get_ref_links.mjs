async function getLinks() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await versionRes.json();
  const pageTarget = targets.find(t => t.url && t.url.includes('papergrader.in')) || targets.find(t => t.type === 'page');

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

  await new Promise(r => ws.onopen = r);

  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.innerText.trim().replace(/\\n/g, ' '),
        href: a.getAttribute('href')
      })).filter(x => x.text && x.href);
    })()`
  });

  console.log(JSON.stringify(res.result?.value, null, 2));
  ws.close();
}

getLinks().catch(console.error);
