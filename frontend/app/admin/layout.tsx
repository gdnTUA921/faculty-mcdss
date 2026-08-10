import Sidebar from '@/components/admin/Sidebar'
import { RequireRole } from '@/lib/auth'

export const metadata = {
  title: 'MCDSS — Admin Dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole roles={['admin']}>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFF]">{children}</main>
      </div>
    </RequireRole>
  )
}
