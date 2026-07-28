import { writable } from "svelte/store";

/** Open state for the global appointment-request modal. Any anchor with
 *  href="#appointment" opens it (delegated handler in +layout.svelte), which
 *  makes the CTA reachable from ordinary Prismic link fields. */
export const appointmentOpen = writable(false);
