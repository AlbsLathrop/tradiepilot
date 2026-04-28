'use client';

import { SessionProvider } from 'next-auth/react';
import { PushProvider } from './components/push-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PushProvider />
      {children}
    </SessionProvider>
  );
}
