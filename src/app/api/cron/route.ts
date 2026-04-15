import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Cron jobs are managed directly in n8n — this endpoint returns an empty list.
 * Future: could query n8n API to list active workflows.
 */
export async function GET() {
  return NextResponse.json([])
}

export async function POST() {
  return NextResponse.json({ error: 'Cron jobs are managed in n8n' }, { status: 501 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Cron jobs are managed in n8n' }, { status: 501 })
}
