import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getSession } from "@/lib/session"

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const session = await getSession()

  if (path.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/portal", req.url))
    }
  }

  if (path.startsWith("/portal") && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (path === "/login" && session) {
    return NextResponse.redirect(
      new URL(session.role === "ADMIN" ? "/dashboard" : "/portal", req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login"],
}
