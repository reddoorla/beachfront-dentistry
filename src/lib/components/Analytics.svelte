<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { GA_MEASUREMENT_ID, shouldLoadAnalytics } from "$utils/analytics";

  // Everything happens in onMount, nothing in markup: an inline snippet in
  // app.html is silently dropped by the CSP header on server-rendered routes
  // (see the app.html <noscript> comment for the measured failure), while a
  // bundle-owned bootstrap is 'self' on every route. The loader host is
  // allowlisted in svelte.config.js script-src.
  onMount(() => {
    if (!shouldLoadAnalytics(location.hostname, dev)) return;

    const w = window as typeof window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() {
      // gtag.js requires the live `arguments` object — it tells commands from
      // data by their type, and a spread array is treated as pushed data.
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GA_MEASUREMENT_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.append(script);
  });
</script>
