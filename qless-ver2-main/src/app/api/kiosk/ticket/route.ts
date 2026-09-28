import { NextResponse } from 'next/server';
import { createQueueTicket } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Incoming Ticket Body:', body);

    const {
      serviceOfficeId,
      serviceId,
      studentIdentifier,
      studentName,
      instructor,
      instructorName,
      department,
      departmentName,
      details,
    } = body;

    // Accept either instructor/department or instructorName/departmentName
    const resolvedInstructor = instructor || instructorName || null;
    const resolvedDepartment = department || departmentName || null;

    if (!serviceOfficeId || !serviceId || !studentIdentifier) {
      return NextResponse.json(
        { error: 'Missing required queue information.' },
        { status: 400 }
      );
    }

    const result = await createQueueTicket({
      serviceOfficeId: Number(serviceOfficeId),
      serviceId: Number(serviceId),
      studentIdentifier,
      studentName,
      instructor: resolvedInstructor,
      department: resolvedDepartment,
      details,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (err: any) {
    console.error('API ticket generation error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}