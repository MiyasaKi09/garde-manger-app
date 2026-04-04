import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { getSystemPrompt } from '@/lib/aiSystemPrompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/ai/chat
 * Streaming chat with Claude. Accepts:
 * {
 *   intent: 'planning' | 'recipe_suggest' | 'general',
 *   messages: [{ role: 'user'|'assistant', content: string }],
 *   contextOverride?: string  // optional extra context
 * }
 */
export async function POST(request) {
  // Auth
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { intent = 'general', messages = [], contextOverride } = body

  if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'Le dernier message doit être de role "user"' }, { status: 400 })
  }

  try {
    // Build context from real data
    const ctx = await buildAiContext(supabase, user.id)
    let formattedContext = formatContextForPrompt(ctx)
    if (contextOverride) {
      formattedContext += '\n\nCONTEXTE SUPPLÉMENTAIRE :\n' + contextOverride
    }

    const systemPrompt = getSystemPrompt(intent, formattedContext)

    // Clean messages for API (only role + content)
    const apiMessages = messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Stream response — planning needs more tokens for full JSON with cooking steps
    const maxTokens = intent === 'planning' ? 16384 : 4096

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: apiMessages,
    })

    // Convert to ReadableStream for Next.js
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
            if (event.type === 'message_stop') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (err) {
    console.error('[AI Chat] Error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec Claude' },
      { status: 500 }
    )
  }
}
