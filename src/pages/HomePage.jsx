import { useCallback, useEffect, useMemo, useState } from 'react'
import { chromeAPI } from '../utils/chromeApi'
import { askPageQuestion, summarizePage } from '../services/pageService'

const initialSettings = {
  backendUrl: 'http://localhost:8000',
}

const statusConfig = {
  loading: {
    label: 'Reading active tab',
    tone: 'loading',
    helper: 'Looking up the current website from Chrome.',
  },
  ready: {
    label: 'Ready to process',
    tone: 'ready',
    helper: 'The current page is captured and ready for page-specific AI actions.',
  },
  missing: {
    label: 'No active page found',
    tone: 'warning',
    helper: 'Open a normal browser tab and try again.',
  },
  error: {
    label: 'Chrome access failed',
    tone: 'error',
    helper: 'The popup could not read the active tab.',
  },
}

function extractBodyDataFromPage() {
  const body = document.body
  const text = (body?.innerText || '')
    .replace(/\s{3,}/g, '\n\n')
    .replace(/\n{4,}/g, '\n\n')
    .trim()

  const links = Array.from(document.links || []).slice(0, 50).map((link) => ({
    text: (link.textContent || '').trim(),
    href: link.href,
  }))

  const images = Array.from(document.images || []).slice(0, 30).map((image) => ({
    alt: image.alt || '',
    src: image.currentSrc || image.src || '',
  }))

  return {
    html: body?.innerHTML || '',
    text,
    innerText: body?.innerText || '',
    outerHTML: body?.outerHTML || '',
    childElementCount: body?.childElementCount || 0,
    links,
    images,
    title: document.title,
    url: window.location.href,
  }
}

function getDomain(url) {
  if (!url) return 'No site selected'

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Unsupported page'
  }
}

function truncateUrl(url) {
  if (!url) return 'Current URL will appear here'
  return url.length > 56 ? `${url.slice(0, 53)}...` : url
}

function buildSummary(pageInfo) {
  if (!pageInfo.url) {
    return 'Open any website and the extension will capture its URL automatically.'
  }

  const domain = getDomain(pageInfo.url)

  return `Connected to ${domain}. This page is ready for a focused summary and page-specific questions.`
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [status, setStatus] = useState('loading')
  const [pageInfo, setPageInfo] = useState({ url: '', title: '' })
  const [pageData, setPageData] = useState(null)
  const [summary, setSummary] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState(initialSettings)
  const [apiState, setApiState] = useState({ loading: false, error: '' })

  const statusMeta = statusConfig[status] ?? statusConfig.loading
  const domain = useMemo(() => getDomain(pageInfo.url), [pageInfo.url])

  const extractWebpageData = useCallback(async (tabId) => {
    try {
      return await chromeAPI.tabs.sendMessage(tabId, { type: 'EXTRACT' })
    } catch (sendMessageError) {
      if (!chromeAPI.scripting?.executeScript) {
        throw sendMessageError
      }

      const results = await chromeAPI.scripting.executeScript({
        target: { tabId },
        func: extractBodyDataFromPage,
      })

      return results?.[0]?.result ?? null
    }
  }, [])

  const loadCurrentTab = useCallback(async () => {
    setStatus('loading')

    try {
      // if (!isChromeExt) {
      //   throw new Error('Chrome extension APIs are unavailable. Load this as an unpacked extension in Chrome.')
      // }

      const tabs = await chromeAPI.tabs.query({ active: true, currentWindow: true })
      const currentTab = tabs?.[0]

      if (!currentTab?.url) {
        setPageInfo({ url: '', title: '' })
        setPageData(null)
        setStatus('missing')
        return
      }

      const webpageData = currentTab.id ? await extractWebpageData(currentTab.id) : null

      console.log('Webpage body data from Chrome:', webpageData)

      setPageInfo({
        url: webpageData?.url || currentTab.url,
        title: webpageData?.title || currentTab.title || '',
      })
      setPageData(webpageData)
      setStatus('ready')
    } catch (error) {
      console.error('Failed to read active tab', error)
      setPageInfo({ url: '', title: '' })
      setPageData(null)
      setStatus('error')
    }
  }, [extractWebpageData])

  useEffect(() => {
    loadCurrentTab()
  }, [loadCurrentTab])

  useEffect(() => {
    setSummary(buildSummary(pageInfo))
  }, [pageInfo])

  useEffect(() => {
    if (!copied) return undefined

    const timeoutId = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function handleGenerateSummary() {
    if (!pageData) {
      setSummary(buildSummary(pageInfo))
      return
    }

    setApiState({ loading: true, error: '' })

    try {
      const response = await summarizePage(settings.backendUrl, {
        url: pageData.url,
        title: pageData.title,
        text: pageData.text,
        html: pageData.html,
        innerText: pageData.innerText,
        outerHTML: pageData.outerHTML,
        links: pageData.links,
        images: pageData.images,
      })

      setSummary(response.summary || response.message || buildSummary(pageInfo))
      setActiveTab('overview')
    } catch (error) {
      console.error('Failed to call summarize API', error)
      setApiState({ loading: false, error: error.message || 'Failed to summarize page.' })
      return
    }

    setApiState({ loading: false, error: '' })
    setActiveTab('overview')
  }

  async function handleAsk() {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return

    setApiState({ loading: true, error: '' })

    try {
      const response = await askPageQuestion(settings.backendUrl, {
        question: trimmedQuestion,
        url: pageData?.url || pageInfo.url,
        title: pageData?.title || pageInfo.title,
        text: pageData?.text || '',
        html: pageData?.html || '',
      })

      const reply = response.answer || response.message || 'Question submitted successfully.'

      setMessages((current) => [
        { role: 'user', text: trimmedQuestion },
        { role: 'assistant', text: reply },
        ...current,
      ])
      setQuestion('')
      setActiveTab('assistant')
    } catch (error) {
      console.error('Failed to call ask API', error)
      setApiState({ loading: false, error: error.message || 'Failed to send question.' })
      return
    }

    setApiState({ loading: false, error: '' })
  }

  async function handleCopyUrl() {
    if (!pageInfo.url || !navigator.clipboard?.writeText) return

    try {
      await navigator.clipboard.writeText(pageInfo.url)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy URL', error)
    }
  }

  return (
    <main className="popup-shell">
      <section className="hero-card">
        <div className="hero-badge">Active Site</div>
        <div className="hero-top">
          <div>
            <p className="eyebrow">Chrome extension workspace</p>
            <h1>PageMind</h1>
          </div>
          <button className="ghost-button" onClick={loadCurrentTab} type="button">
            Refresh
          </button>
        </div>

        <div className="site-chip">
          <span className={`status-dot ${statusMeta.tone}`} />
          <span>{domain}</span>
        </div>

        <h2 className="page-title">{pageInfo.title || 'Waiting for an active tab'}</h2>
        <p className="hero-copy">{statusMeta.helper}</p>

        <div className="url-panel">
          <span className="section-label">Current website URL</span>
          <p className="url-value" title={pageInfo.url || 'No URL available'}>
            {truncateUrl(pageInfo.url)}
          </p>
          <p className="status-copy">{statusMeta.label}</p>
        </div>

        <div className="cta-row">
          <button
            className="primary-button"
            onClick={handleGenerateSummary}
            type="button"
            disabled={apiState.loading}
          >
            {apiState.loading ? 'Processing...' : 'Generate summary'}
          </button>
          <button
            className="secondary-button"
            onClick={handleCopyUrl}
            type="button"
            disabled={!pageInfo.url}
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
        </div>
        {apiState.error && <p className="error-copy">{apiState.error}</p>}
      </section>

      <nav className="tab-row" aria-label="Popup sections">
        {[
          ['overview', 'Overview'],
          ['assistant', 'Page Q&A'],
          ['settings', 'Settings'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab-button ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="content-card">
          <div className="metric-grid">
            <article className="metric-card">
              <span className="metric-label">Tracking</span>
              <strong>{pageInfo.url ? 'Live tab' : 'No tab'}</strong>
              <p>{pageData?.text ? `${pageData.text.length} characters extracted from the page body.` : 'The popup stores the active tab URL in React state.'}</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Source</span>
              <strong>{domain}</strong>
              <p>{pageData ? `${pageData.childElementCount} top-level body elements detected.` : pageInfo.title || 'Add a tab to see its page title.'}</p>
            </article>
          </div>

          <div className="summary-card">
            <div className="card-head">
              <div>
                <span className="section-label">Quick summary</span>
                <h3>Summary for this page</h3>
              </div>
            </div>
            <p>{summary}</p>
          </div>

          {pageData && (
            <div className="summary-card">
              <span className="section-label">Extracted body preview</span>
              <h3>Real data from the current page</h3>
              <p>{pageData.text?.slice(0, 420) || 'No body text found.'}</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'assistant' && (
        <section className="content-card">
          <div className="summary-card">
            <span className="section-label">Ask about this page</span>
            <h3>Get answers grounded in this page</h3>
            <div className="input-stack">
              <textarea
                className="text-input text-area"
                placeholder="Ask something about the current page..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button className="primary-button full-width" onClick={handleAsk} type="button">
                {apiState.loading ? 'Sending...' : 'Ask this page'}
              </button>
            </div>
          </div>

          <div className="message-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>No page questions yet.</p>
                <span>Ask a question and the answer will use content from the current page.</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`message-card ${message.role}`}>
                  <span className="message-role">{message.role === 'user' ? 'You' : 'Assistant'}</span>
                  <p>{message.text}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="content-card">
          <div className="summary-card">
            <span className="section-label">Extension settings</span>
            <h3>Backend connection</h3>
            <label className="field-label" htmlFor="backend-url">
              API URL
            </label>
            <input
              id="backend-url"
              className="text-input"
              value={settings.backendUrl}
              onChange={(event) =>
                setSettings((current) => ({ ...current, backendUrl: event.target.value }))
              }
              placeholder="http://localhost:8000"
            />
            <p className="settings-copy">
              Keep your backend or AI service URL here so this popup can reuse it later.
            </p>
          </div>
        </section>
      )}
    </main>
  )
}
