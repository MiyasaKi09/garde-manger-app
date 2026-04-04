'use client'

/**
 * Renders markdown-lite text (bold, italic, lists, headers).
 * Used for both streaming and static assistant messages.
 */
export default function StreamingText({ text }) {
  if (!text) return null

  return (
    <div>
      {text.split('\n').map((line, i) => {
        let html = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>')

        const isHeader = /^#{1,3}\s/.test(line)
        const isList = /^\s*[-•]\s/.test(line)
        const isNumbered = /^\s*\d+[.)]\s/.test(line)

        if (isHeader) {
          html = html.replace(/^#{1,3}\s/, '')
          return <p key={i} style={{ fontWeight: 700, fontSize: '1.05em', margin: '12px 0 4px' }} dangerouslySetInnerHTML={{ __html: html }} />
        }
        if (isList || isNumbered) {
          return <p key={i} style={{ margin: '2px 0', paddingLeft: 12 }} dangerouslySetInnerHTML={{ __html: html }} />
        }
        if (!line.trim()) return <br key={i} />
        return <p key={i} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </div>
  )
}
