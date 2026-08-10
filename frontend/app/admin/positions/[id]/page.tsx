'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  FiChevronLeft,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiPlayCircle,
  FiX,
} from 'react-icons/fi'
import PositionFormModal from '@/components/admin/PositionFormModal'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  EmptyState,
  ErrorBanner,
  ErrorState,
  Spinner,
  SuccessBanner,
} from '@/components/shared/DataState'
import { ApiError } from '@/lib/api/client'
import {
  createCriterion,
  createCriterionOption,
  deleteCriterion,
  deleteCriterionOption,
  getCriteria,
  getDepartments,
  getPosition,
  getRankings,
  scorePosition,
  setPositionStatus,
  updateCriterion,
  updateCriterionOption,
} from '@/lib/api/admin'
import { formatDate, formatScore, fullName } from '@/lib/format'
import { useResource } from '@/lib/useResource'
import type { Criterion } from '@/lib/types'

type Tab = 'overview' | 'criteria' | 'applicants'

/** A row in the select-options editor. `id` is absent until it's been saved. */
interface OptionDraft {
  id?: string
  label: string
  value: string
  score: string
}

function WeightBar({ weight }: { weight: number }) {
  const pct = Math.round(weight * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-[#1E293B] w-10 text-right">{pct}%</span>
      <div className="flex-1 bg-[#E2E8F0] rounded-full h-2 min-w-[80px]">
        <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function PositionDetailPage() {
  const params = useParams<{ id: string }>()
  const positionId = params.id

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showCriterionModal, setShowCriterionModal] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [editingPosition, setEditingPosition] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [scoring, setScoring] = useState(false)

  const { data: position, loading, error, reload } = useResource(
    () => getPosition(positionId),
    [positionId],
  )

  const { data: criteria, reload: reloadCriteria } = useResource(
    () => getCriteria(positionId),
    [positionId],
  )

  const { data: rankings, reload: reloadRankings } = useResource(
    () => getRankings(positionId),
    [positionId],
  )

  const { data: departments } = useResource(getDepartments, [])

  if (loading) return <Spinner label="Loading position…" />

  if (error || !position) {
    return (
      <div className="p-8">
        <BackLink />
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <ErrorState message={error ?? 'Position not found.'} onRetry={reload} />
        </div>
      </div>
    )
  }

  const criteriaRows = criteria ?? []
  const totalWeight = criteriaRows.reduce((sum, c) => sum + Number(c.weight), 0)
  const weightOk = Math.abs(totalWeight - 1.0) < 0.001
  const rankingRows = rankings ?? []

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'criteria', label: `Criteria & Weights (${criteriaRows.length})` },
    { id: 'applicants', label: `Applicants (${rankingRows.length})` },
  ]

  async function handleScore() {
    setActionError(null)
    setScoring(true)
    try {
      await scorePosition(positionId)
      setNotice('Scoring complete — WSM scores and rankings refreshed.')
      reloadRankings()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Scoring failed.')
    } finally {
      setScoring(false)
    }
  }

  async function handleToggleStatus() {
    if (!position) return
    setActionError(null)
    const next = position.status === 'open' ? 'closed' : 'open'
    try {
      await setPositionStatus(positionId, next)
      setNotice(`Position is now ${next}.`)
      reload()
    } catch (err) {
      setActionError(
        err instanceof ApiError ? (err.fieldError('status') ?? err.message) : 'Could not change the status.',
      )
    }
  }

  async function handleDeleteCriterion(criterion: Criterion) {
    setActionError(null)
    try {
      await deleteCriterion(criterion.id)
      setNotice(`"${criterion.name}" removed.`)
      reloadCriteria()
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the criterion.')
    }
  }

  return (
    <div className="p-8">
      <BackLink />

      {notice && <SuccessBanner message={notice} onDismiss={() => setNotice(null)} />}
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Position Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-[#1E293B]">{position.title}</h1>
              <StatusBadge status={position.status} size="md" />
            </div>
            <p className="text-[#64748B] text-sm mb-3">{position.department?.name ?? '—'}</p>
            <div className="flex flex-wrap gap-4 text-sm items-center">
              <div>
                <span className="text-[#64748B]">Slots filled: </span>
                <span className="font-semibold text-[#1E293B]">
                  {position.slots_filled} / {position.slots_available}
                </span>
              </div>
              <div>
                <span className="text-[#64748B]">Deadline: </span>
                <span className="font-semibold text-[#1E293B]">
                  {formatDate(position.application_deadline)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#64748B]">Target Type: </span>
                <StatusBadge status={position.target_applicant_type} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleScore}
              disabled={scoring || !weightOk}
              title={weightOk ? 'Recalculate WSM scores' : 'Criteria weights must total 100% before scoring'}
              className="flex items-center gap-1.5 bg-[#2563EB] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlayCircle className="w-4 h-4" />
              {scoring ? 'Scoring…' : 'Run Scoring'}
            </button>
            <button
              onClick={() => setEditingPosition(true)}
              className="flex items-center gap-1.5 border border-[#E2E8F0] text-[#64748B] px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleToggleStatus}
              className="flex items-center gap-1.5 border border-[#E2E8F0] text-[#64748B] px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {position.status === 'open' ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
              {position.status === 'open' ? 'Close' : 'Re-open'}
            </button>
          </div>
        </div>

        {/* Slot progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#64748B] mb-1">
            <span>Slots Progress</span>
            <span>
              {position.slots_filled}/{position.slots_available} filled
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className="bg-[#16A34A] h-2 rounded-full transition-all"
              style={{
                width: `${
                  position.slots_available > 0
                    ? Math.min((position.slots_filled / position.slots_available) * 100, 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#E2E8F0] mb-6">
        <div className="flex flex-wrap gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'px-5 py-3 text-sm font-semibold text-[#2563EB] border-b-2 border-[#2563EB] -mb-px transition-colors'
                  : 'px-5 py-3 text-sm font-medium text-[#64748B] hover:text-[#1E293B] border-b-2 border-transparent -mb-px transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-4">Position Description</h2>
          <p className="text-[#64748B] text-sm leading-relaxed mb-6">
            {position.description || 'No description provided.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Field label="Created Date" value={formatDate(position.created_at)} />
              <Field label="Department" value={position.department?.name} />
              <Field
                label="Target Applicant Type"
                node={<StatusBadge status={position.target_applicant_type} />}
              />
            </div>
            <div className="space-y-3">
              <Field
                label="Created By"
                value={
                  position.creator
                    ? fullName(position.creator.first_name, position.creator.last_name)
                    : '—'
                }
              />
              <Field label="Application Deadline" value={formatDate(position.application_deadline)} />
              <Field label="Current Status" node={<StatusBadge status={position.status} />} />
            </div>
          </div>
        </div>
      )}

      {/* Criteria */}
      {activeTab === 'criteria' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-[#1E293B]">Evaluation Criteria</h2>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                weightOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {weightOk ? <FiCheck className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
              Total Weight: {(totalWeight * 100).toFixed(0)}%
              {weightOk ? ' — Valid' : ' — Must equal 100%'}
            </div>
          </div>

          {criteriaRows.length === 0 ? (
            <EmptyState
              title="No criteria configured"
              description="Applications cannot be scored until this position has criteria whose weights total 100%."
              action={
                <button
                  onClick={() => setShowCriterionModal(true)}
                  className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Criterion
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Criterion Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Data Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-48">Weight</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Required</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Range</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {criteriaRows.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={
                        idx % 2 === 0
                          ? 'bg-white border-b border-[#F1F5F9]'
                          : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                      }
                    >
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-[#1E293B]">{c.name}</p>
                        {c.description && (
                          <p className="text-xs text-[#64748B] mt-0.5">{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.data_type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <WeightBar weight={Number(c.weight)} />
                      </td>
                      <td className="px-4 py-3.5">
                        {c.is_required ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                            <FiCheck className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#64748B]">
                        {c.min_value !== null && c.max_value !== null
                          ? `${Number(c.min_value)} – ${Number(c.max_value)}`
                          : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCriterion(c)}
                            className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCriterion(c)}
                            className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {criteriaRows.length > 0 && (
            <div className="px-6 py-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowCriterionModal(true)}
                className="flex items-center gap-2 text-[#2563EB] text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                Add Criterion
              </button>
            </div>
          )}
        </div>
      )}

      {/* Applicants (ranked) */}
      {activeTab === 'applicants' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#1E293B]">
              Applicants for {position.title}
              <span className="ml-2 text-sm font-normal text-[#64748B]">
                ({rankingRows.length} total)
              </span>
            </h2>
          </div>
          {rankingRows.length === 0 ? (
            <EmptyState
              title="No ranked applicants yet"
              description="Rankings appear once applications are submitted and scoring has run."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-40">WSM Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingRows.map((row, idx) => {
                    const score = row.total_wsm_score === null ? null : Number(row.total_wsm_score)
                    const name =
                      row.applicant_name ?? fullName(row.first_name, row.last_name)
                    return (
                      <tr
                        key={row.application_id}
                        className={
                          idx % 2 === 0
                            ? 'bg-white border-b border-[#F1F5F9]'
                            : 'bg-[#F8FAFF] border-b border-[#F1F5F9]'
                        }
                      >
                        <td className="px-6 py-3.5 font-bold text-[#64748B] text-center w-12">
                          #{row.rank_in_position ?? idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/applicants/${row.application_id}`}
                            className="font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline"
                          >
                            {name}
                          </Link>
                          {row.email && <p className="text-xs text-[#94A3B8]">{row.email}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          {row.applicant_type ? <StatusBadge status={row.applicant_type} /> : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {score === null ? (
                            <span className="text-xs text-[#94A3B8]">Not scored</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#1E293B] text-xs w-14">
                                {formatScore(score)}
                              </span>
                              <div className="flex-1 bg-[#E2E8F0] rounded-full h-1.5 min-w-[50px]">
                                <div
                                  className="bg-[#2563EB] h-1.5 rounded-full"
                                  style={{ width: `${Math.min(score * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-end">
                            <Link
                              href={`/admin/applicants/${row.application_id}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View Profile
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(showCriterionModal || editingCriterion) && (
        <CriterionModal
          positionId={positionId}
          criterion={editingCriterion}
          remainingWeight={Math.max(0, 1 - totalWeight + Number(editingCriterion?.weight ?? 0))}
          onClose={() => {
            setShowCriterionModal(false)
            setEditingCriterion(null)
          }}
          onSaved={(name, wasEdit) => {
            setShowCriterionModal(false)
            setEditingCriterion(null)
            setNotice(`"${name}" ${wasEdit ? 'updated' : 'added'}.`)
            reloadCriteria()
            reload()
          }}
        />
      )}

      {editingPosition && (
        <PositionFormModal
          position={position}
          departments={departments ?? []}
          onClose={() => setEditingPosition(false)}
          onSaved={(title) => {
            setEditingPosition(false)
            setNotice(`"${title}" updated.`)
            reload()
          }}
        />
      )}
    </div>
  )
}

function CriterionModal({
  positionId,
  criterion,
  remainingWeight,
  onClose,
  onSaved,
}: {
  positionId: string
  criterion: Criterion | null
  remainingWeight: number
  onClose: () => void
  onSaved: (name: string, wasEdit: boolean) => void
}) {
  const isEdit = criterion !== null

  const [name, setName] = useState(criterion?.name ?? '')
  const [description, setDescription] = useState(criterion?.description ?? '')
  const [dataType, setDataType] = useState(criterion?.data_type ?? 'numeric')
  const [weightPct, setWeightPct] = useState(
    criterion ? String(Math.round(Number(criterion.weight) * 100)) : String(Math.round(remainingWeight * 100)),
  )
  const [minValue, setMinValue] = useState(criterion?.min_value != null ? String(criterion.min_value) : '')
  const [maxValue, setMaxValue] = useState(criterion?.max_value != null ? String(criterion.max_value) : '')
  const [required, setRequired] = useState(criterion?.is_required ?? true)
  const [options, setOptions] = useState<OptionDraft[]>(
    (criterion?.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
      score: o.score_value === null ? '' : String(o.score_value),
    })),
  )
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addOption() {
    setOptions((prev) => [...prev, { label: '', value: '', score: '' }])
  }

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  function removeOption(index: number) {
    const target = options[index]
    if (target.id) setRemovedOptionIds((prev) => [...prev, target.id!])
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (dataType === 'select' && options.length === 0) {
      setError('A Select criterion needs at least one option, or applicants get an empty dropdown.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      data_type: dataType,
      // The API takes a 0–1 decimal; the form works in percentages.
      weight: Number(weightPct) / 100,
      min_value: minValue === '' ? null : Number(minValue),
      max_value: maxValue === '' ? null : Number(maxValue),
      is_required: required,
    }

    try {
      const saved =
        isEdit && criterion
          ? await updateCriterion(criterion.id, payload)
          : await createCriterion(positionId, payload)

      // Options are a separate resource, so sync them after the criterion exists.
      if (dataType === 'select') {
        for (const id of removedOptionIds) {
          await deleteCriterionOption(id)
        }

        for (const [index, option] of options.entries()) {
          const body = {
            label: option.label.trim(),
            value: option.value.trim() || option.label.trim(),
            score_value: Number(option.score),
            display_order: index,
          }

          if (option.id) {
            await updateCriterionOption(option.id, body)
          } else {
            await createCriterionOption(saved.id, body)
          }
        }
      }

      onSaved(payload.name, isEdit)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(Object.values(err.errors)[0]?.[0] ?? err.message)
      } else {
        setError('Could not save the criterion.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1E293B]">
            {isEdit ? 'Edit Criterion' : 'Add Criterion'}
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <div>
              <label htmlFor="c-name" className="block text-sm font-semibold text-[#1E293B] mb-1">
                Criterion Name <span className="text-red-500">*</span>
              </label>
              <input
                id="c-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Years of Teaching Experience"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
              />
            </div>

            <div>
              <label htmlFor="c-desc" className="block text-sm font-semibold text-[#1E293B] mb-1">
                Description
              </label>
              <textarea
                id="c-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-type" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Data Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="c-type"
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as Criterion['data_type'])}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B] bg-white"
                >
                  <option value="numeric">Numeric</option>
                  <option value="boolean">Boolean</option>
                  <option value="select">Select</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div>
                <label htmlFor="c-weight" className="block text-sm font-semibold text-[#1E293B] mb-1">
                  Weight % <span className="text-red-500">*</span>
                </label>
                <input
                  id="c-weight"
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={weightPct}
                  onChange={(e) => setWeightPct(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                />
                <p className="text-xs text-[#94A3B8] mt-1">
                  {Math.round(remainingWeight * 100)}% unallocated
                </p>
              </div>
            </div>

            {dataType === 'numeric' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-min" className="block text-sm font-semibold text-[#1E293B] mb-1">
                    Min Value
                  </label>
                  <input
                    id="c-min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="c-max" className="block text-sm font-semibold text-[#1E293B] mb-1">
                    Max Value
                  </label>
                  <input
                    id="c-max"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-[#1E293B]"
                  />
                </div>
                <p className="col-span-2 text-xs text-[#94A3B8] -mt-2">
                  Answers are normalized between min and max, then multiplied by the weight.
                </p>
              </div>
            )}

            {dataType === 'select' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#1E293B]">
                    Options <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 px-2 py-1 rounded-md"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add option
                  </button>
                </div>

                {options.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg px-3 py-2">
                    No options yet. Applicants would see an empty dropdown — add at least one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      <span className="col-span-5">Label</span>
                      <span className="col-span-4">Stored Value</span>
                      <span className="col-span-2">Score</span>
                      <span className="col-span-1" />
                    </div>
                    {options.map((option, index) => (
                      <div key={option.id ?? index} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          required
                          value={option.label}
                          onChange={(e) => updateOption(index, { label: e.target.value })}
                          placeholder="Doctorate"
                          className="col-span-5 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm text-[#1E293B]"
                        />
                        <input
                          value={option.value}
                          onChange={(e) => updateOption(index, { value: e.target.value })}
                          placeholder="doctorate"
                          className="col-span-4 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm text-[#1E293B]"
                        />
                        <input
                          required
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={option.score}
                          onChange={(e) => updateOption(index, { score: e.target.value })}
                          placeholder="1.0"
                          className="col-span-2 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm text-[#1E293B]"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="col-span-1 text-[#DC2626] hover:bg-red-50 rounded-md p-1.5 flex justify-center"
                          title="Remove option"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[#94A3B8] mt-2">
                  Score is 0–1 and is multiplied by the criterion weight. Leave Stored Value blank to
                  reuse the label.
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-[#1E293B]">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#2563EB]"
              />
              Applicants must answer this criterion
            </label>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Criterion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/admin/positions"
      className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] font-medium mb-5 transition-colors"
    >
      <FiChevronLeft className="w-4 h-4" />
      Back to Positions
    </Link>
  )
}

function Field({ label, value, node }: { label: string; value?: string | null; node?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-0.5">{label}</p>
      {node ? <div className="mt-1">{node}</div> : <p className="text-sm text-[#1E293B] font-medium">{value || '—'}</p>}
    </div>
  )
}
