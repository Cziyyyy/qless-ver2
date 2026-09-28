import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('office') || searchParams.get('department') || searchParams.get('name');

    let sql = `
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 5.0) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
      FROM ratings
    `;
    const params: any[] = [];

    if (target && target !== 'ALL') {
      sql += ` WHERE LOWER(office_or_dept) LIKE LOWER(CONCAT('%', ?, '%'))`;
      params.push(target);
    }

    let stats: any = { total_reviews: 0, average_rating: 5.0, stars_5: 0, stars_4: 0, stars_3: 0, stars_2: 0, stars_1: 0 };
    let recentFeedback: any[] = [];

    try {
      const statsRows = await query<any[]>(sql, params);
      if (statsRows && statsRows.length > 0) {
        stats = statsRows[0];
        stats.average_rating = parseFloat(stats.average_rating || 5.0).toFixed(1);
      }

      let fbSql = `
        SELECT r.*, u.name as student_name 
        FROM ratings r 
        LEFT JOIN users u ON r.student_id = u.id 
      `;
      if (target && target !== 'ALL') {
        fbSql += ` WHERE LOWER(r.office_or_dept) LIKE LOWER(CONCAT('%', ?, '%'))`;
      }
      fbSql += ` ORDER BY r.created_at DESC LIMIT 10`;

      recentFeedback = await query<any[]>(fbSql, params);
    } catch (e) {
      // Table may not exist yet or be empty
    }

    return NextResponse.json({
      success: true,
      stats,
      recentFeedback: recentFeedback || [],
    });
  } catch (err: any) {
    console.error('Error fetching rating stats:', err);
    return NextResponse.json({ error: 'Failed to retrieve rating stats' }, { status: 500 });
  }
}
