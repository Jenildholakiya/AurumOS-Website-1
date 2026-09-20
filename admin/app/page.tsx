import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const ok = await getSession()
  redirect(ok ? '/dashboard' : '/login')
}
