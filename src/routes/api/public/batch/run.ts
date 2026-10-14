import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/api/public/batch/run')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer (\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
        if (!token) return new Response('Unauthorized', { status: 401 });
        const { verifyBatchToken, runDebtReport } = await import('@/components/lunchdebt/batch.server');
        if (!(await verifyBatchToken(token))) return new Response('Unauthorized', { status: 401 });
        const body = z.object({ job_id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
        if (!body.success) return new Response('Bad request', { status: 400 });
        const r = await runDebtReport(body.data.job_id, 'schedule');
        return Response.json({ status: r.status });
      },
    },
  },
});
