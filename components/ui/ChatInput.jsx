'use client'

import { useState, useRef } from 'react'
import { Send, Image } from 'lucide-react'

/**
 * Barre de saisie chat avec envoi + upload image optionnel.
 */
export default function ChatInput({ onSend, onImageUpload, disabled, placeholder = 'Écris un message...' }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const fileRef = useRef(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && onImageUpload) {
      onImageUpload(file)
    }
    e.target.value = ''
  }

  return (
    <div style={styles.bar}>
      {onImageUpload && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            style={styles.imageBtn}
            disabled={disabled}
            title="Ajouter une image"
          >
            <Image size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={styles.input}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          ...styles.sendBtn,
          opacity: disabled || !text.trim() ? 0.4 : 1,
        }}
      >
        <Send size={18} />
      </button>
    </div>
  )
}

const styles = {
  bar: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px 16px',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 24,
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.8)',
    color: 'var(--ink, #1f281f)',
    outline: 'none',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: 'none',
    background: '#16a34a',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    flexShrink: 0,
  },
  imageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}
