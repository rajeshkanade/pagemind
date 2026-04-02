// src/components/StatusBar.jsx

import { s } from '../styles/styles'

export default function StatusBar({ status, wordCount }) {
  return (
    <div style={s.statusBar}>
      <span>{status}</span>
      {wordCount && <span>{wordCount} words</span>}
    </div>
  )
}
