'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkPassword, createToken } from '@/lib/auth'

const COOKIE = 'aurum_admin_session'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string | null

  if (!password || !checkPassword(password)) {
    redirect('/login?error=1')
  }

  const token = await createToken()
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  cookies().delete(COOKIE)
  redirect('/login')
}
