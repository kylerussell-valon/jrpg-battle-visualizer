import { NextResponse } from 'next/server';
import { getLatestBattleState, getRecentEvents, getPartyMembers } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Fetch current battle state and recent events
 */
export async function GET() {
  try {
    const state = getLatestBattleState();
    const events = getRecentEvents(50);
    const party = getPartyMembers();

    return NextResponse.json({
      state,
      events,
      party,
    });
  } catch (error) {
    console.error('Failed to fetch battles:', error);
    return NextResponse.json(
      { state: null, events: [], party: [] },
      { status: 200 } // Don't error, just return empty
    );
  }
}
