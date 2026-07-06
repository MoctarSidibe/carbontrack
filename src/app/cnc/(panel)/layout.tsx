import CncShell from './CncShell'

export const metadata = {
  title: 'CNC — Conseil National du Climat',
  description: 'Espace de certification officielle du Conseil National du Climat',
}

export default function CncLayout({ children }: { children: React.ReactNode }) {
  return <CncShell>{children}</CncShell>
}
