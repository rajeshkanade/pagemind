// src/components/SummaryTab.jsx

import { s } from '../styles/styles'

export default function SummaryTab({ status, summary, handleExtract }) {
  if (status === 'idle') {
    return (
      <div style={s.pane}>
        <button onClick={handleExtract}>Extract</button>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div style={s.pane}>
        <p>{summary}</p>
      </div>
    )
  }

  return <div style={s.pane}>Loading...</div>
}