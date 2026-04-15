/**
 * Memory search — returns empty results (no filesystem memory in INTELLBUSINESS)
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  return NextResponse.json({ results: [], query, total: 0 })
}
