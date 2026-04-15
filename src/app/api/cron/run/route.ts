import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({ error: 'Cron jobs are managed in n8n' }, { status: 501 })
}
