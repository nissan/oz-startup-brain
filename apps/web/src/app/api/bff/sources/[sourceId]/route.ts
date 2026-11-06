import { handleSource } from '@/lib/server/bff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ sourceId: string }> }): Promise<Response> {
  const { sourceId } = await context.params;
  return handleSource(sourceId);
}
