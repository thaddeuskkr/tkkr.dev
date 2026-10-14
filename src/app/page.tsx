import { Profile } from "@/components/profile";
import { publicDirectoryGroups } from "@/lib/admin/directory";
import { directoryGroups } from "@/lib/directory";
export const dynamic = "force-dynamic";
export default async function Home() {
    let groups;
    try {
        groups = await publicDirectoryGroups();
    } catch {
        console.error("Directory could not be loaded; using the existing site links.");
        groups = directoryGroups;
    }

    return <Profile groups={groups} />;
}
