import Sidebar from '@/components/admin/Sidebar'

export const metadata = {
  title: 'MCDSS — Admin Dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#F8FAFF]">{children}</main>
    </div>
  )
}
