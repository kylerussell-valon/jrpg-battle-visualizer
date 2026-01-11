import { NextRequest, NextResponse } from 'next/server';
import { getSessionImages, getCurrentSessionId } from '@/lib/db';
import { generateGif } from '@jrpg-visualizer/core';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get project root for exports directory
const projectRoot = process.cwd().includes('packages/dashboard')
  ? join(process.cwd(), '..', '..')
  : process.cwd();

const EXPORTS_DIR = join(projectRoot, 'data', 'exports');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { sessionId } = body;

    // If no sessionId provided, use current session
    if (!sessionId) {
      sessionId = getCurrentSessionId();
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided and no active session found' },
        { status: 400 }
      );
    }

    // Get images for session
    const imagePaths = getSessionImages(sessionId);

    if (imagePaths.length === 0) {
      return NextResponse.json({ error: 'No images found for this session' }, { status: 404 });
    }

    // Generate GIF
    const result = await generateGif(imagePaths, {
      sessionId,
      totalDurationMs: 60000,
      maxWidth: 800,
    });

    if (!result.success || !result.buffer) {
      return NextResponse.json({ error: result.error || 'Failed to generate GIF' }, { status: 500 });
    }

    // Save to exports directory
    if (!existsSync(EXPORTS_DIR)) {
      mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const filename = `battle_${sessionId}_${Date.now()}.gif`;
    const filePath = join(EXPORTS_DIR, filename);
    writeFileSync(filePath, result.buffer);

    // Return GIF as download
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Frame-Count': result.frameCount.toString(),
        'X-File-Path': filePath,
      },
    });
  } catch (error) {
    console.error('GIF export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET to check export status or get session info
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (sessionId) {
    const imagePaths = getSessionImages(sessionId);
    return NextResponse.json({
      sessionId,
      imageCount: imagePaths.length,
      estimatedDuration: '60s',
      frameDuration:
        imagePaths.length > 0 ? `${Math.round(60000 / imagePaths.length)}ms` : 'N/A',
    });
  }

  // Return current session info
  const currentSession = getCurrentSessionId();
  return NextResponse.json({
    currentSessionId: currentSession,
    imageCount: currentSession ? getSessionImages(currentSession).length : 0,
  });
}
