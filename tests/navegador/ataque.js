(async () => {
  await new Promise(r => setTimeout(r, 800));
  document.querySelectorAll('input[type=search], #q, [name=busca]').forEach(i => { i.focus(); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await new Promise(r => setTimeout(r, 400));
  return { xss: window.__xss || 0, injetado: document.querySelectorAll('img[src="x"],svg[onload],[onerror],iframe').length, jsLink: [...document.querySelectorAll('a[href^="javascript:"]')].length };
})()
