/**
 * Admin Monitoring Dashboard
 *
 * F028: Real-time observability for prediction accuracy.
 *
 * Features:
 * - Live accuracy metrics (MAE, RMSE, MAPE)
 * - Alert thresholds for degradation
 * - Historical accuracy trends
 * - Model version performance comparison
 */

'use client'

import { useState, useEffect } from 'react'

// =============================================================================
// TYPES
// =============================================================================

interface AccuracyMetrics {
  mae: number
  mse: number
  rmse: number
  mape: number
  sampleCount: number
}

interface AccuracyReport {
  id: string
  reportDate: string
  reportPeriod: string
  metrics: AccuracyMetrics
  trend: 'improving' | 'stable' | 'degrading'
  changePct: number
  hasAlert: boolean
  alertLevel?: 'warning' | 'critical'
}

interface ModelStats {
  version: string
  mae: number
  sampleCount: number
  trafficPct: number
  isProduction: boolean
}

interface SystemHealth {
  predictionsLast24h: number
  avgConfidence: number
  exceptionRate: number
  avgLatencyMs: number
}

// =============================================================================
// ALERT THRESHOLDS
// =============================================================================

const ALERT_THRESHOLDS = {
  mae: {
    warning: 0.8,
    critical: 1.2,
  },
  degradation: {
    warning: 10,
    critical: 20,
  },
  confidence: {
    warning: 0.6,
    critical: 0.5,
  },
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AdminMonitoringPage() {
  const [reports, setReports] = useState<AccuracyReport[]>([])
  const [latestReport, setLatestReport] = useState<AccuracyReport | null>(null)
  const [modelStats, setModelStats] = useState<ModelStats[]>([])
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardData() {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchReports(),
        fetchModelStats(),
        fetchSystemHealth(),
      ])
    } catch {
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function fetchReports() {
    const res = await fetch('/api/admin/accuracy?limit=30')
    const data = await res.json()
    if (data.success && data.reports) {
      const mapped = data.reports.map(mapReport)
      setReports(mapped)
      if (mapped.length > 0) {
        setLatestReport(mapped[0])
      }
    }
  }

  async function fetchModelStats() {
    const res = await fetch('/api/admin/models')
    const data = await res.json()
    if (data.success && data.models) {
      setModelStats(data.models)
    }
  }

  async function fetchSystemHealth() {
    const res = await fetch('/api/admin/health')
    const data = await res.json()
    if (data.success) {
      setHealth(data.health)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapReport(r: any): AccuracyReport {
    return {
      id: r.id,
      reportDate: r.report_date || r.reportDate,
      reportPeriod: r.report_period || r.reportPeriod,
      metrics: {
        mae: r.mae,
        mse: r.mse,
        rmse: r.rmse,
        mape: r.mape,
        sampleCount: r.sample_count || r.sampleCount,
      },
      trend: r.mae_trend || r.maeTrend || 'stable',
      changePct: r.mae_change_pct || r.maeChangePct || 0,
      hasAlert: r.has_alert || r.hasAlert || false,
      alertLevel: r.alert_level || r.alertLevel,
    }
  }

  function getAlertLevel(metrics: AccuracyMetrics | null): 'none' | 'warning' | 'critical' {
    if (!metrics) return 'none'
    if (metrics.mae >= ALERT_THRESHOLDS.mae.critical) return 'critical'
    if (metrics.mae >= ALERT_THRESHOLDS.mae.warning) return 'warning'
    return 'none'
  }

  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'degrading': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '\u2193'
      case 'degrading': return '\u2191'
      default: return '\u2192'
    }
  }

  function formatPercent(value: number | undefined): string {
    if (value === undefined) return '-'
    return (value >= 0 ? '+' : '') + value.toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  const alertLevel = getAlertLevel(latestReport?.metrics || null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prediction Accuracy</h1>
            <p className="text-gray-600 mt-2">
              Real-time monitoring of SHARE prediction quality
            </p>
          </div>
          <div className="flex items-center gap-4">
            {refreshing && (
              <span className="text-sm text-gray-500">Refreshing...</span>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {alertLevel !== 'none' && (
          <div className={'mb-6 p-4 rounded-lg ' + (
            alertLevel === 'critical'
              ? 'bg-red-100 border border-red-200'
              : 'bg-yellow-100 border border-yellow-200'
          )}>
            <div className="flex items-center gap-2">
              <span className={'text-xl ' + (
                alertLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
              )}>
                {'\u26A0'}
              </span>
              <div>
                <p className={'font-medium ' + (
                  alertLevel === 'critical' ? 'text-red-800' : 'text-yellow-800'
                )}>
                  {alertLevel === 'critical' ? 'Critical' : 'Warning'}: Accuracy Degradation Detected
                </p>
                <p className={'text-sm ' + (
                  alertLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
                )}>
                  Current MAE: {latestReport?.metrics.mae.toFixed(3)} Brix
                  {latestReport?.changePct !== 0 && (
                    <> ({formatPercent(latestReport?.changePct)} vs previous)</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">MAE (Brix)</div>
            <div className="text-3xl font-bold text-gray-900">
              {latestReport?.metrics.mae.toFixed(3) || '-'}
            </div>
            {latestReport && (
              <div className={'text-sm mt-1 ' + getTrendColor(latestReport.trend)}>
                {getTrendIcon(latestReport.trend)} {formatPercent(latestReport.changePct)}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">RMSE</div>
            <div className="text-3xl font-bold text-gray-900">
              {latestReport?.metrics.rmse.toFixed(3) || '-'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">MAPE</div>
            <div className="text-3xl font-bold text-gray-900">
              {latestReport?.metrics.mape ? latestReport.metrics.mape.toFixed(1) + '%' : '-'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Sample Count</div>
            <div className="text-3xl font-bold text-gray-900">
              {latestReport?.metrics.sampleCount?.toLocaleString() || '-'}
            </div>
          </div>
        </div>

        {/* System Health */}
        {health && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Predictions (24h)</div>
                <div className="text-xl font-bold">{health.predictionsLast24h.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
                <div className={'text-xl font-bold ' + (
                  health.avgConfidence < ALERT_THRESHOLDS.confidence.warning
                    ? 'text-yellow-600'
                    : 'text-green-600'
                )}>
                  {(health.avgConfidence * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Exception Rate</div>
                <div className={'text-xl font-bold ' + (
                  health.exceptionRate > 5 ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {health.exceptionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Latency</div>
                <div className="text-xl font-bold">{health.avgLatencyMs.toFixed(0)}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Model Performance */}
        {modelStats.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Versions</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="pb-2">Version</th>
                  <th className="pb-2">MAE</th>
                  <th className="pb-2">Samples</th>
                  <th className="pb-2">Traffic</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {modelStats.map((model) => (
                  <tr key={model.version} className="border-b last:border-0">
                    <td className="py-3 font-medium">{model.version}</td>
                    <td className="py-3">{model.mae?.toFixed(3) || '-'}</td>
                    <td className="py-3">{model.sampleCount?.toLocaleString() || '-'}</td>
                    <td className="py-3">{model.trafficPct.toFixed(0)}%</td>
                    <td className="py-3">
                      {model.isProduction ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Production
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Historical Accuracy */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accuracy History</h2>
          {reports.length === 0 ? (
            <p className="text-gray-500">No historical reports available</p>
          ) : (
            <div className="space-y-2">
              {reports.slice(0, 10).map((report) => (
                <div
                  key={report.id}
                  className={'flex items-center justify-between p-3 rounded-lg ' + (
                    report.hasAlert
                      ? report.alertLevel === 'critical'
                        ? 'bg-red-50'
                        : 'bg-yellow-50'
                      : 'bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 w-28">
                      {report.reportDate}
                    </div>
                    <div className="text-sm text-gray-500 w-20">
                      {report.reportPeriod}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-sm text-gray-600">MAE: </span>
                      <span className="font-medium">{report.metrics.mae.toFixed(3)}</span>
                    </div>
                    <div className="text-right w-20">
                      <span className={getTrendColor(report.trend)}>
                        {getTrendIcon(report.trend)} {formatPercent(report.changePct)}
                      </span>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-500">
                      n={report.metrics.sampleCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Thresholds */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600 mb-2">MAE (Brix)</div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-yellow-400"></span>
                <span>Warning: &gt; {ALERT_THRESHOLDS.mae.warning}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span>Critical: &gt; {ALERT_THRESHOLDS.mae.critical}</span>
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-2">Degradation</div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-yellow-400"></span>
                <span>Warning: &gt; {ALERT_THRESHOLDS.degradation.warning}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span>Critical: &gt; {ALERT_THRESHOLDS.degradation.critical}%</span>
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-2">Confidence</div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-yellow-400"></span>
                <span>Warning: &lt; {ALERT_THRESHOLDS.confidence.warning * 100}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span>Critical: &lt; {ALERT_THRESHOLDS.confidence.critical * 100}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
