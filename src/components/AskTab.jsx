// src/components/AskTab.jsx

export default function AskTab({
  messages,
  input,
  setInput,
  handleAsk
}) {
  return (
    <div>
      {messages.map((m, i) => (
        <p key={i}>{m.text}</p>
      ))}

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button onClick={handleAsk}>Send</button>
    </div>
  )
}