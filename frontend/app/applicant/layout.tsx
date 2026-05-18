import TopNav from '@/components/applicant/TopNav'
import BottomNav from '@/components/applicant/BottomNav'

export const metadata = {
  title: 'MCDSS — Applicant Portal',
}

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  )
}
