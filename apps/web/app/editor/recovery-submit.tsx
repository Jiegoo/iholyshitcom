'use client';
import { useFormStatus } from 'react-dom';
export default function RecoverySubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-disabled={pending}>{pending ? '请稍候…' : children}</button>;
}
