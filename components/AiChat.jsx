'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/authFetch'
import ChatBubble from '@/components/ui/ChatBubble'
import ChatInput from '@/components/ui/ChatInput'
import StreamingText from '@/components/ui/StreamingText'

/**
 * Composant chat IA réutilisable.
 *
 * @param {object} props
 * @param {'planning'|'recipe_suggest'|'general'} props.intent
 * @param {string} [props.contextOverride] - Contexte supplémentaire à envoyer
 * @param {Array} [props.initialMessages] - Messages initiaux
 * @param {function} [props.onMessage] - Callback quand un message assistant est complet (role, content)
 * @param {boolean} [props.showImageUpload] - Afficher le bouton upload image
 * @param {string} [props.placeholder] - Placeholder de l'input
 * @param {Array} [props.suggestions] - Suggestions de messages rapides
 * @param {string} [props.welcomeTitle] - Titre d'accueil
 * @param {string} [props.welcomeSubtitle] - Sous-titre d'accueil
 */
export default function AiChat({
  intent = 'general',
  contextOverride,
  initialMessages = [],
  onMessage,
  showImageUpload = false,
  placeholder,
  suggestions = [],
  welcomeTitle = 'Salut ! Qu\'est-ce qu\'on cuisine ?',
  welcomeSubtitle,
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [streamingText, setStreamingText] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)
  const abortRef = useRef(null)

  // Scroll on new messages or streaming update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, loading])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setStreamingText('')
    setLoading(true)

    try {
      abortRef.current = new AbortController()

      const response = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          messages: newMessages,
          contextOverride,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullText += data.text
              setStreamingText(fullText)
            }
            if (data.error) {
              fullText += `\n\n_Erreur: ${data.error}_`
              setStreamingText(fullText)
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Finalize message
      const assistantMsg = { role: 'assistant', content: fullText || 'Désolé, je n\'ai pas pu répondre.' }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)
      setStreamingText('')
      onMessage?.(assistantMsg, finalMessages)
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMsg = { role: 'assistant', content: 'Erreur de connexion. Vérifie ta connexion ou réessaie.' }
        setMessages(prev => [...prev, errorMsg])
        setStreamingText('')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [messages, loading, intent, contextOverride, onMessage])

  const handleImageUpload = useCallback(async (file) => {
    // Convert to base64 and send as message context
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      sendMessage(`[Image jointe : ${file.name}]\n${base64}`)
    }
    reader.readAsDataURL(file)
  }, [sendMessage])

  const isEmpty = messages.length === 0 && !streamingText

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {isEmpty && (
          <div style={styles.welcome}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👨‍🍳</div>
            <p style={styles.welcomeTitle}>{welcomeTitle}</p>
            {welcomeSubtitle && <p style={styles.welcomeSubtitle}>{welcomeSubtitle}</p>}
            {suggestions.length > 0 && (
              <div style={styles.suggestions}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={styles.suggestionBtn}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role}>
            {msg.role === 'user' ? msg.content : <StreamingText text={msg.content} />}
          </ChatBubble>
        ))}

        {streamingText && (
          <ChatBubble role="assistant">
            <StreamingText text={streamingText} />
          </ChatBubble>
        )}

        {loading && !streamingText && (
          <ChatBubble role="assistant">
            <div style={styles.typing}>
              <span style={{ ...styles.dot, animationDelay: '0s' }}>·</span>
              <span style={{ ...styles.dot, animationDelay: '0.2s' }}>·</span>
              <span style={{ ...styles.dot, animationDelay: '0.4s' }}>·</span>
            </div>
            <style>{`@keyframes blink { 0%, 80%, 100% { opacity: 0.2 } 40% { opacity: 1 } }`}</style>
          </ChatBubble>
        )}

        <div ref={chatEndRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onImageUpload={showImageUpload ? handleImageUpload : undefined}
        disabled={loading}
        placeholder={placeholder}
      />
    </div>
  )
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 16px',
  },
  welcome: {
    textAlign: 'center',
    padding: '30px 10px 20px',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 4,
    color: 'var(--ink, #1f281f)',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#7f8c7f',
    marginBottom: 20,
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  suggestionBtn: {
    padding: '8px 14px',
    border: '1px solid rgba(22,163,74,0.2)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--ink, #1f281f)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  typing: {
    display: 'flex',
    gap: 4,
    padding: '4px 0',
  },
  dot: {
    animation: 'blink 1.2s infinite',
    fontSize: 18,
    color: '#7f8c7f',
    lineHeight: 1,
  },
}
