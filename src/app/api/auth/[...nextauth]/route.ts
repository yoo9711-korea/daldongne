import type { NextRequest } from 'next/server';

import { handlers } from '@/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handlers.GET(request as never);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request as never);
}