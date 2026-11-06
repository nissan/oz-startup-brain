import { handleCapabilities } from '@/lib/server/bff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return handleCapabilities();
}
