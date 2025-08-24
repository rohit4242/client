import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getExchanges } from "@/db/actions/exchange/get-exchanges";
import { ExchangesClient } from './_components/exchanges-client';

export default async function ExchangesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  const exchanges = await getExchanges();
  
  return <ExchangesClient initialExchanges={exchanges} />;
}