import { createFileRoute, notFound, rootRouteId } from '@tanstack/react-router';

export const Route = createFileRoute('/$')({
    loader: () => {
        throw notFound({ routeId: rootRouteId });
    },
});
