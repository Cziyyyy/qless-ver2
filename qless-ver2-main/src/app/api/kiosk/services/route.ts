import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch active service offices
    const offices = await query<any[]>(
      `SELECT id, name, prefix, description, icon_name 
       FROM service_offices 
       WHERE status = 'ACTIVE' 
       ORDER BY name ASC`
    );

    // 2. Fetch active services for each office (including parent/child relationships)
    const services = await query<any[]>(
      `SELECT id, service_office_id, name, parent_id, estimated_minutes 
       FROM services 
       WHERE status = 'ACTIVE' 
       ORDER BY name ASC`
    );

    // Group services by office and organize parent-child hierarchy
    const result = offices.map((office) => {
      const officeServices = services.filter((s) => s.service_office_id === office.id);
      
      const mainServices = officeServices
        .filter((s) => s.parent_id === null)
        .map((main) => {
          const subServices = officeServices.filter((sub) => sub.parent_id === main.id);
          return {
            id: main.id,
            name: main.name,
            estimatedMinutes: main.estimated_minutes,
            subServices: subServices.map((sub) => ({
              id: sub.id,
              name: sub.name,
              estimatedMinutes: sub.estimated_minutes,
            })),
          };
        });

      return {
        id: office.id,
        name: office.name,
        prefix: office.prefix,
        description: office.description,
        iconName: office.icon_name,
        services: mainServices,
      };
    });

    return NextResponse.json({ offices: result });
  } catch (err: any) {
    console.error('Error fetching kiosk services:', err);
    return NextResponse.json({ error: 'Failed to retrieve service offices from database.' }, { status: 500 });
  }
}
