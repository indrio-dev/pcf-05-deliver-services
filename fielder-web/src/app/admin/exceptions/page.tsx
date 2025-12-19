/**
 * Admin Exceptions Page
 *
 * F026: UI for managing prediction exceptions that need human review.
 *
 * Features:
 * - List pending exceptions with context
 * - Approve/reject/escalate actions
 * - Resolution time tracking
 * - Filter by severity, type, status
 */

'use client'

import { useState, useEffect } from 'react'

// =============================================================================
// TYPES
// =============================================================================

interface ExceptionRecord {
  id: string
  predictionId: string | null
  cultivarId: string
  regionId: string | null
  exceptionDate: string
  exceptionType: string
  severity: string
  triggerSource: string
  confidenceScore: number | null
  expectedValue: number | null
  actualValue: number | null
  deviationStddev: number | null
  status: string
  assignedTo: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  resolutionNotes: string | null
  createdAt: string
  slaDeadline: string
}

interface ExceptionStats {
  pending: number
  inReview: number
  overdue: number
  resolvedToday: number
  avgResolutionHours: number
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AdminExceptionsPage() {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([])
  const [stats, setStats] = useState<ExceptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [filter, setFilter] = useState({
    status: 'pending',
    severity: 'all',
    type: 'all',
  })

  // Fetch exceptions on mount and filter change
  useEffect(() => {
    fetchExceptions()
    fetchStats()
  }, [filter])

  async function fetchExceptions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status !== 'all') params.set('status', filter.status)
      if (filter.severity !== 'all') params.set('severity', filter.severity)
      if (filter.type !== 'all') params.set('type', filter.type)

      const res = await fetch(`/api/admin/exceptions?${params}`)
      const data = await res.json()

      if (data.success) {
        setExceptions(data.exceptions || [])
      } else {
        setError(data.message || 'Failed to fetch exceptions')
      }
    } catch {
      setError('Failed to fetch exceptions')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/exceptions/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch {
      // Stats are optional, don't block UI
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'escalate') {
    try {
      const res = await fetch('/api/admin/exceptions/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exceptionId: id,
          action,
          resolutionNotes: action !== 'escalate' ? resolutionNotes : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSelectedId(null)
        setResolutionNotes('')
        fetchExceptions()
        fetchStats()
      } else {
        setError(data.message || `Failed to ${action} exception`)
      }
    } catch {
      setError(`Failed to ${action} exception`)
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'escalated': return 'bg-purple-100 text-purple-800'
      case 'auto_resolved': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function isOverdue(slaDeadline: string): boolean {
    return new Date(slaDeadline) < new Date()
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exception Queue</h1>
          <p className="text-gray-600 mt-2">
            Review predictions that need human verification
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
              <div className="text-sm text-gray-600">In Review</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
              <div className="text-sm text-gray-600">Resolved Today</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">
                {stats.avgResolutionHours.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Avg Resolution</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filter.severity}
                onChange={(e) => setFilter(f => ({ ...f, severity: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm text-sm"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm text-sm"
              >
                <option value="all">All</option>
                <option value="low_confidence">Low Confidence</option>
                <option value="anomalous_measurement">Anomaly</option>
                <option value="missing_data">Missing Data</option>
                <option value="validation_warning">Validation</option>
                <option value="calibration_conflict">Calibration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Exception List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading exceptions...</div>
          ) : exceptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No exceptions found matching filters
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {exceptions.map((exc) => (
                <div
                  key={exc.id}
                  className={`p-4 hover:bg-gray-50 ${
                    isOverdue(exc.slaDeadline) && exc.status === 'pending'
                      ? 'bg-red-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(exc.severity)}`}>
                          {exc.severity}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exc.status)}`}>
                          {exc.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {exc.exceptionType.replace('_', ' ')}
                        </span>
                        {isOverdue(exc.slaDeadline) && exc.status === 'pending' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="text-sm text-gray-900 mb-1">
                        <strong>{exc.cultivarId}</strong>
                        {exc.regionId && ` in ${exc.regionId}`}
                      </div>
                      <div className="text-xs text-gray-500 space-x-4">
                        {exc.confidenceScore !== null && (
                          <span>Confidence: {(exc.confidenceScore * 100).toFixed(0)}%</span>
                        )}
                        {exc.expectedValue !== null && exc.actualValue !== null && (
                          <span>
                            Expected: {exc.expectedValue.toFixed(1)} / Actual: {exc.actualValue.toFixed(1)}
                          </span>
                        )}
                        {exc.deviationStddev !== null && (
                          <span>Deviation: {exc.deviationStddev.toFixed(1)}σ</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {formatDate(exc.createdAt)} | SLA: {formatDate(exc.slaDeadline)}
                      </div>
                    </div>

                    {/* Actions */}
                    {exc.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedId(selectedId === exc.id ? null : exc.id)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Panel */}
                  {selectedId === exc.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resolution Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm text-sm"
                          rows={3}
                          placeholder="Add notes about your decision..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(exc.id, 'approve')}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(exc.id, 'reject')}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(exc.id, 'escalate')}
                          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          Escalate
                        </button>
                        <button
                          onClick={() => {
                            setSelectedId(null)
                            setResolutionNotes('')
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
