import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/tradie-app/login-form';

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect('/app/home');
  }

  return <LoginForm />;
}
