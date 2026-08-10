import Sidebar from '@/components/director/Sidebar'
import { RequireRole } from '@/lib/auth'

export const metadata = {
  title: 'MCDSS — Academic Director Portal',
}

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole roles={['director']}>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFF]">{children}</main>
      </div>
    </RequireRole>
  )
}
