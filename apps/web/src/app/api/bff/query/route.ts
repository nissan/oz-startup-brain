import { handleQuery } from '@/lib/server/bff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  return handleQuery(request);
}
