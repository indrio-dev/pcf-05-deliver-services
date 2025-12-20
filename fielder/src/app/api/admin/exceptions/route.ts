/**
 * Admin Exceptions API
 *
 * F026: Endpoints for exception queue management.
 *
 * GET /api/admin/exceptions - List exceptions with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingExceptions,
  type ExceptionStatus,
  type ExceptionSeverity,
  type ExceptionType,
} from '@/lib/intelligence/exception-handler'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const options: {
      status?: ExceptionStatus
      severity?: ExceptionSeverity
      exceptionType?: ExceptionType
      limit?: number
    } = {}

    const status = searchParams.get('status')
    if (status && status !== 'all') {
      options.status = status as ExceptionStatus
    }

    const severity = searchParams.get('severity')
    if (severity && severity !== 'all') {
      options.severity = severity as ExceptionSeverity
    }

    const type = searchParams.get('type')
    if (type && type !== 'all') {
      options.exceptionType = type as ExceptionType
    }

    const limit = searchParams.get('limit')
    if (limit) {
      options.limit = parseInt(limit)
    }

    const exceptions = await getPendingExceptions(options)

    return NextResponse.json({
      success: true,
      exceptions,
      count: exceptions.length,
    })
  } catch (error) {
    console.error('Exceptions API GET error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
