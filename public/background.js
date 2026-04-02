// background.js — Manifest V3 service worker
// Bridges popup ↔ content_script ↔ FastAPI

const BACKEND = 'http://localhost:8000'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SUMMARIZE') {
    handleSummarize(msg.tabId).then(sendResponse).catch(err => {
      sendResponse({ error: err.message })
    })
    return true  // async response
  }
})

async function handleSummarize(tabId) {
  // Step 1: ask content_script for the page text
  const { text, url, title } = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT' })

  // Step 2: POST to FastAPI
  const res = await fetch(`${BACKEND}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, url, title }),
  })

  if (!res.ok) throw new Error(`FastAPI error ${res.status}`)
  return await res.json()  // { summary, chunks, session_id }
}