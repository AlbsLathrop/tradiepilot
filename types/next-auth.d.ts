import 'next-auth';

declare module 'next-auth' {
  interface User {
    tradieConfigId?: string;
    tradieSlug?: string;
  }

  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tradieConfigId?: string;
      tradieSlug?: string;
    };
  }
}
