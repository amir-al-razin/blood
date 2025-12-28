import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(5000)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = contactSchema.parse(body)

    // Store contact message in database
    await db.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to user

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!'
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}
