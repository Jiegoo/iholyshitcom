'use server';
import { redirect } from 'next/navigation';
import { createClient, isConfigured } from '../../lib/supabase';

function field(form: FormData, name: string) {
  const value = form.get(name);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${name}`);
  return value.trim();
}
async function session() {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) throw new Error('Authentication required');
  return client;
}

export async function login(form: FormData) {
  if (!isConfigured()) redirect('/editor?status=configuration');
  const client = await createClient();
  const password = form.get('password');
  if (typeof password !== 'string' || !password) throw new Error('Password required');
  const { error } = await client.auth.signInWithPassword({ email: field(form, 'email'), password });
  if (error) redirect('/editor?status=login');
  redirect('/editor');
}
export async function logout() {
  const client = await session();
  const { error } = await client.auth.signOut();
  if (error) redirect('/editor?status=error');
  redirect('/editor');
}
