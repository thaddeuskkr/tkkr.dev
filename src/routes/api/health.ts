import { createFileRoute } from '@tanstack/react-router';

const health = {
    message: 'ok',
    error: null,
} as const;

export const Route = createFileRoute('/api/health')({
    server: {
        handlers: {
            GET: () =>
                Response.json(health, {
                    headers: {
                        'Cache-Control': 'no-store',
                        'X-Content-Type-Options': 'nosniff',
                    },
                }),
        },
    },
});
