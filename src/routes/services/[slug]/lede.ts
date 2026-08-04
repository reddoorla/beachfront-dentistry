// The lede-splitting helper is shared with the question detail route (live
// gives both the same cyan right-indented lede), so it now lives in $lib.
// Re-exported here to keep this route's existing import + load test stable.
export { splitLede } from "$lib/detail-lede";
