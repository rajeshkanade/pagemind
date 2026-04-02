// src/components/SettingsTab.jsx

export default function SettingsTab({ settings, setSettings }) {
  return (
    <div>
      <input
        value={settings.backendUrl}
        onChange={e =>
          setSettings(p => ({ ...p, backendUrl: e.target.value }))
        }
      />
    </div>
  )
}