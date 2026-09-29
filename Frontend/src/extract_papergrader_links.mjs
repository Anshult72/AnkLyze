async function main() {
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?https://papergrader.in/', { method: 'PUT' });
  const target = await newTabRes.json();

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      }
    } catch (err) {}
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    pending.set(cur, resolve);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 3000));

  const linksRes = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        rawHref: a.getAttribute('href')
      }));
    })()`
  });

  console.log('ALL ANCHOR LINKS ON PAPERGRADER:');
  console.log(JSON.stringify(linksRes.result?.value, null, 2));

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
  process.exit(0);
}

main().catch(console.error);
