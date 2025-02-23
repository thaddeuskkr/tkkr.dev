export async function GET() {
    return new Response(
        JSON.stringify({
            associatedApplications: [
                {
                    applicationId: "ee100a84-e7c0-438e-8f0b-8536e9a209f8",
                },
            ],
        }),
        { headers: { "Content-Type": "application/json" } },
    );
}
