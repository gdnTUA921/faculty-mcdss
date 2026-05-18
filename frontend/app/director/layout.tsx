import Sidebar from '@/components/director/Sidebar'

export const metadata = {
  title: 'MCDSS — Academic Director Portal',
}

export default function DirectorLayout({
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
