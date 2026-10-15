import { Profile } from "@/components/profile";
import { publicDirectoryGroups } from "@/lib/admin/directory";
// Cache the rendered homepage until an admin directory edit invalidates it.
export const dynamic = "force-static";
export const revalidate = false;
export default async function Home() {
    let groups;
    try {
        groups = await publicDirectoryGroups();
    } catch {
        // Abort regeneration so a database outage cannot replace the cached links.
        throw new Error("Directory could not be loaded.");
    }

    return <Profile groups={groups} />;
}
