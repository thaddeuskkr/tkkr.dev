import { defineConfig } from "@neon/config/v1";

export default defineConfig({
    auth: false,
    buckets: { assets: { access: "private" } },
    // Expire newly created preview branches after seven days.
    branch: ({ isDefault, exists }) => (!isDefault && !exists ? { ttl: "7d" } : {}),
});
