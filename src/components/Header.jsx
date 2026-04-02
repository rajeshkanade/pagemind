// src/components/Header.jsx

import { s } from '../styles/styles'

export default function Header({ pageInfo, shortUrl }) {
  return (
    <div style={s.header}>
      <div style={s.logo}>⚡</div>
      <span style={s.appName}>PageMind</span>
      <span style={s.urlBadge} title={pageInfo.url}>
        {shortUrl(pageInfo.url)}
      </span>
    </div>
  )
}