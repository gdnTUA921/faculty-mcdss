import { FiCheck, FiClock } from 'react-icons/fi'

type Status = 'applied' | 'for_interview' | 'for_review' | 'hired' | 'rejected' | 'withdrawn'

interface HiringPipelineProps {
  currentStatus: Status
  compact?: boolean
}

const stages: { id: Status; label: string }[] = [
  { id: 'applied', label: 'Applied' },
  { id: 'for_interview', label: 'For Interview' },
  { id: 'for_review', label: 'For Review' },
  { id: 'hired', label: 'Hired' },
]

export default function HiringPipeline({ currentStatus, compact = false }: HiringPipelineProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStatus)
  const isTerminated = currentStatus === 'rejected' || currentStatus === 'withdrawn'

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {stages.map((stage, idx) => {
          const isComplete = idx < currentIndex
          const isCurrent = idx === currentIndex
          const dotColor = isComplete
            ? 'bg-[#16A34A]'
            : isCurrent
            ? 'bg-[#2563EB]'
            : 'bg-[#E2E8F0]'
          return (
            <div key={stage.id} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
              {idx < stages.length - 1 && (
                <div
                  className={`w-4 h-0.5 ${idx < currentIndex ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        {stages.map((stage, idx) => {
          const isComplete = idx < currentIndex || (idx === currentIndex && currentStatus === 'hired')
          const isCurrent = idx === currentIndex && currentStatus !== 'hired'

          return (
            <div key={stage.id} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={
                  isComplete
                    ? 'w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center'
                    : isCurrent
                    ? 'w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center ring-4 ring-blue-100'
                    : 'w-10 h-10 rounded-full bg-white border-2 border-[#E2E8F0] flex items-center justify-center'
                }
              >
                {isComplete ? (
                  <FiCheck className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <FiClock className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-sm font-bold text-[#64748B]">{idx + 1}</span>
                )}
              </div>
              <p
                className={
                  isCurrent
                    ? 'mt-2 text-xs font-semibold text-[#2563EB] text-center'
                    : isComplete
                    ? 'mt-2 text-xs font-semibold text-[#16A34A] text-center'
                    : 'mt-2 text-xs font-medium text-[#64748B] text-center'
                }
              >
                {stage.label}
              </p>
            </div>
          )
        })}
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E2E8F0] -z-0">
          <div
            className="h-full bg-[#16A34A] transition-all"
            style={{
              width: `${(currentIndex / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {isTerminated && (
        <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 text-center font-medium">
          Application {currentStatus === 'rejected' ? 'rejected' : 'withdrawn'}
        </div>
      )}
    </div>
  )
}
