import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login']

const ADMIN_ONLY_ROUTES = ['/dashboard/utilizadores']
const ADMIN_GESTOR_ROUTES = ['/dashboard/relatorios', '/dashboard/exportar']
const AUTH_ROUTES = ['/dashboard']

function startsWithRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...(options || {}) })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...(options || {}), maxAge: 0 })
        },
      },
    }
  )

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const pathname = request.nextUrl.pathname

  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const needsAuth = startsWithRoute(pathname, AUTH_ROUTES)

  if (!user && needsAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (!user || isPublic || !needsAuth) {
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, ativo')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'
  const ativo = profile?.ativo ?? true

  if (!ativo) {
    await supabase.auth.signOut()

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'conta_inativa')
    return NextResponse.redirect(url)
  }

  if (startsWithRoute(pathname, ADMIN_ONLY_ROUTES) && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (
    startsWithRoute(pathname, ADMIN_GESTOR_ROUTES) &&
    !['admin', 'gestor', 'tecnico'].includes(role)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
