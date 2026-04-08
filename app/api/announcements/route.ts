import { getAnnouncement } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    const announcement = await getAnnouncement();

    if (!announcement) {
        return Response.json({
            announcement: null,
        });
    }

    return Response.json({
        announcement: {
            category: announcement.category,
            message: announcement.message,
            createdAt: announcement.createdAt,
            updatedAt: announcement.updatedAt,
        },
    });
}
