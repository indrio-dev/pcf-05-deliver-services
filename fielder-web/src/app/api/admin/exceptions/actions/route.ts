/**
 * Admin Exception Actions API
 *
 * F026: Handle exception resolution actions.
 *
 * POST /api/admin/exceptions/actions - Approve/reject/escalate exception
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveException } from '@/lib/intelligence/exception-handler'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    const { exceptionId, action, resolutionNotes } = body

    if (!exceptionId || typeof exceptionId !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'exceptionId is required',
      }, { status: 400 })
    }

    if (!action || !['approve', 'reject', 'escalate'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'action must be one of: approve, reject, escalate',
      }, { status: 400 })
    }

    // Map action to status
    const statusMap: Record<string, 'approved' | 'rejected' | 'escalated'> = {
      approve: 'approved',
      reject: 'rejected',
      escalate: 'escalated',
    }

    const result = await resolveException(
      exceptionId,
      statusMap[action],
      'admin_user', // TODO: Get from auth session
      resolutionNotes
    )

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to resolve exception',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Exception ${action}d successfully`,
      exception: result.exception,
    })
  } catch (error) {
    console.error('Exception actions API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
