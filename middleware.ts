import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Completely disabled for testing - let all routes through
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
