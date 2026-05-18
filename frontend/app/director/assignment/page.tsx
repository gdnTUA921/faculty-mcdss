import { FiCheckCircle, FiTarget, FiBookOpen, FiInfo } from 'react-icons/fi'
import PageHeader from '@/components/director/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  assignmentRun,
  assignmentResults,
  facultyWorkload,
  directorInfo,
} from '@/lib/directorData'

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AssignmentResultsPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Assignment Results"
        subtitle={`ILP-based candidate selection and faculty allocation for ${directorInfo.departmentName}`}
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
        <FiInfo className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#1E3A8A]">
          <p className="font-semibold">Read-only assignment results</p>
          <p className="text-[#64748B] mt-0.5">
            The latest assignment run is shown below. Only HR Personnel can configure or trigger new runs.
          </p>
        </div>
      </div>

      {/* Run summary card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-[#16A34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-[#1E293B]">Latest Run</h2>
                <StatusBadge status={assignmentRun.status} />
              </div>
              <p className="text-xs text-[#64748B]">Completed on {formatTimestamp(assignmentRun.runAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Total Assigned</p>
              <p className="text-xl font-bold text-[#1E293B]">{assignmentRun.totalAssigned}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Filled Positions</p>
              <p className="text-xl font-bold text-[#1E293B]">{assignmentRun.positionsFullyFilled}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Objective Score</p>
              <p className="text-xl font-bold text-[#2563EB] font-mono">{assignmentRun.objectiveScore.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Results Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
          <FiTarget className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#1E293B]">Hiring Assignment Results</h2>
          <span className="text-xs text-[#64748B]">({assignmentResults.length} evaluated)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">WSM Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Assigned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Objective</th>
              </tr>
            </thead>
            <tbody>
              {assignmentResults.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                  <td className="px-6 py-3 font-semibold text-[#1E293B]">{row.applicantName}</td>
                  <td className="px-4 py-3 text-[#1E293B]">{row.position}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.type} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#1E293B]">{row.wsmScore.toFixed(4)}</span>
                      <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${row.wsmScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.isAssigned ? (
                      <StatusBadge status="yes" />
                    ) : (
                      <StatusBadge status="no" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1E293B]">
                    {row.objectiveScore.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty Workload */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
          <FiBookOpen className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#1E293B]">Faculty Workload Allocation</h2>
          <span className="text-xs text-[#64748B]">({facultyWorkload.length} entries — DIT only)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Faculty Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Course Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Course Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Units</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Semester</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Academic Year</th>
              </tr>
            </thead>
            <tbody>
              {facultyWorkload.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                  <td className="px-6 py-3 font-semibold text-[#1E293B]">{row.facultyName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1E293B]">{row.courseCode}</td>
                  <td className="px-4 py-3 text-[#1E293B]">{row.courseName}</td>
                  <td className="px-4 py-3 text-[#1E293B]">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#DBEAFE] text-[#1E3A8A] text-xs font-bold">
                      {row.units}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">{row.semester}</td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">{row.academicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
