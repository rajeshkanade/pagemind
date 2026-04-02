// content_script.js — injected into every page by Chrome
// Must be plain JS (no JSX, no imports)

function extractPageText() {
  const body = document.body.cloneNode(true)

  // Remove noise elements
  const remove = ['script', 'style', 'nav', 'footer', 'header', 'aside',
                  'noscript', 'iframe', '[aria-hidden="true"]']
  remove.forEach(sel => {
    body.querySelectorAll(sel).forEach(el => el.remove())
  })

  const text = body.innerText
    .replace(/\s{3,}/g, '\n\n')   // collapse excessive whitespace
    .replace(/\n{4,}/g, '\n\n')   // max 2 blank lines
    .trim()

  return text
}

function extractBodyData() {
  const body = document.body
  const links = Array.from(document.links || []).slice(0, 50).map(link => ({
    text: (link.textContent || '').trim(),
    href: link.href,
  }))
  const images = Array.from(document.images || []).slice(0, 30).map(image => ({
    alt: image.alt || '',
    src: image.currentSrc || image.src || '',
  }))

  return {
    html: body?.innerHTML || '',
    text: extractPageText(),
    innerText: body?.innerText || '',
    outerHTML: body?.outerHTML || '',
    childElementCount: body?.childElementCount || 0,
    links,
    images,
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'EXTRACT') {
    const bodyData = extractBodyData()

    sendResponse({
      ...bodyData,
      url: window.location.href,
      title: document.title,
    })
  }
  return true  // keep message channel open for async
})
