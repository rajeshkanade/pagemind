// src/components/Tabs.jsx

import { s } from '../styles/styles'

export default function Tabs({ tab, setTab }) {
  return (
    <div style={s.tabs}>
      {['summary', 'ask', 'settings'].map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}