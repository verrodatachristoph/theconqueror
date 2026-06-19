"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionToken, hashPassword } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const secret = process.env.AUTH_SECRET!;

  // Prefer the DB-stored password hash (admin-changeable); fall back to the
  // APP_PASSWORD env for fresh installs that haven't set one yet.
  const settings = await getSettings();
  let ok: boolean;
  if (settings?.password_hash) {
    ok = (await hashPassword(secret, password)) === settings.password_hash;
  } else {
    ok = !!process.env.APP_PASSWORD && password === process.env.APP_PASSWORD;
  }
  if (!ok) {
    return { error: "Falsches Passwort." };
  }
  const token = await sessionToken(process.env.AUTH_SECRET!);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
