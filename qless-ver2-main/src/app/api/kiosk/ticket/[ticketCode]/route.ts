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
      concernDetails,
      category,
    } = body;

    const resolvedInstructor = instructor || instructorName || null;
    const resolvedDepartment = department || departmentName || null;
    const resolvedDetails = details || concernDetails || null;

    if (!studentIdentifier) {
      return NextResponse.json(
        { error: 'Student number or identifier is required.' },
        { status: 400 }
      );
    }

    const isDepartmentConcern = 
      category === 'DEPARTMENT' ||
      Boolean(resolvedInstructor) || 
      Boolean(resolvedDepartment) ||
      Number(serviceOfficeId) === 4;

    const finalOfficeId = isDepartmentConcern ? 4 : Number(serviceOfficeId || 1);
    const finalServiceId = isDepartmentConcern ? 4 : Number(serviceId || 1);

    const result = await createQueueTicket({
      serviceOfficeId: finalOfficeId,
      serviceId: finalServiceId,
      studentIdentifier: studentIdentifier.trim(),
      studentName: studentName || null,
      instructor: resolvedInstructor,
      department: resolvedDepartment,
      details: resolvedDetails,
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
