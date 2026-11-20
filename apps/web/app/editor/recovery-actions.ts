'use server';
import { redirect } from 'next/navigation';
import { createClient, isConfigured } from '../../lib/supabase';
import { recoveryOrigin, requestRecovery, changeRecoveredPassword } from '../../lib/password-recovery.mjs';
export async function requestPasswordRecovery(form: FormData) {
  const origin = recoveryOrigin();
  if (!origin || !isConfigured()) redirect('/editor/forgot-password?status=unavailable');
  const result = await requestRecovery(await createClient(), form.get('email'), origin);
  redirect(`/editor/forgot-password?status=${result}`);
}
export async function saveRecoveredPassword(form: FormData) {
  if (!recoveryOrigin() || !isConfigured()) redirect('/editor/update-password?status=unavailable');
  const result = await changeRecoveredPassword(await createClient(), form.get('password'), form.get('confirmation'));
  if (result === 'saved') redirect('/editor/forgot-password?status=saved');
  redirect(`/editor/update-password?status=${result}`);
}
