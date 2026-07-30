<script lang="ts">
  import { PrismicPreview } from "@prismicio/svelte/kit";
  import { page } from "$app/state";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { repositoryName } from "$lib/prismicio";
  import "../app.css";
  import Seo from "$lib/components/Seo.svelte";
  import { composeTitle, DEFAULT_OG_IMAGE } from "$lib/seo";
  import LandscapeModal from "$lib/components/LandscapeModal.svelte";
  import TransitionOverlay from "$lib/components/TransitionOverlay.svelte";
  import AppointmentModal from "$lib/components/AppointmentModal.svelte";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { loadSiteConfig, footerColumns } from "$lib/blux/site-config";
  import { appointmentOpen } from "$lib/stores/appointment";
  import {
    disableSmoothScroll,
    restoreSmoothScroll,
  } from "$lib/utils/instantNavScroll";

  let { data, children } = $props();

  // Site chrome from the Blux convert (empty stub on an unconverted starter →
  // logo-only Nav + placeholder Footer). A migrated site's page data takes
  // precedence over this in each chrome component.
  const siteConfig = loadSiteConfig();

  // Routes that open with a full-bleed dark hero can carry a transparent nav
  // that turns solid on scroll (the live site's behaviour). Every other route
  // starts on a light section, where a transparent white nav would be
  // invisible — those keep the solid brand-blue band from the top.
  const HERO_COVER_ROUTES = new Set(["/", "/your-first-visit"]);
  const navTransparentAtTop = $derived(
    HERO_COVER_ROUTES.has(page.url.pathname),
  );

  // Kit's own post-nav scroll (top / hash anchor / popstate restore) runs
  // instantly instead of gliding under app.css's smooth-scroll. See the util.
  beforeNavigate(disableSmoothScroll);
  afterNavigate(restoreSmoothScroll);

  // Delegated so any anchor with href="#appointment" — including ones from
  // ordinary Prismic link fields, not just hardcoded CTAs — opens the global
  // appointment modal instead of navigating to a same-page hash.
  const interceptAppointment = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.('a[href="#appointment"]');
    if (a) {
      e.preventDefault();
      appointmentOpen.set(true);
    }
  };
</script>

<!-- Single head source for the whole app. Static routes feed their title
     (and optional description/image) through `page.data`; per-page <svelte:head>
     title overrides would desync og:title, so pages set data, not tags. -->
<Seo
  title={composeTitle(page.data.meta_title || page.data.title)}
  description={page.data.meta_description}
  image={page.data.meta_image || DEFAULT_OG_IMAGE || undefined}
  imageAlt={page.data.meta_image_alt}
  url={page.url}
/>
{#if page.data.frozen}
  <!-- A frozen Blux page is a complete standalone document (its own nav, footer,
       and CSS reset are baked into the frozen template). The app chrome +
       wrappers would double them, so render the page bare. -->
  {@render children?.()}
{:else}
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-white focus:text-primary-deep focus:px-4 focus:py-2 focus:rounded focus:shadow"
  >
    Skip to main content
  </a>
  <!-- Chrome renders from page data when a route supplies it (a migrated Blux
       site's per-route navLinks/footerColumns), else from the site-config chrome
       (`blux convert` fills it; empty stub → Nav logo-only + Footer default).
       Each component applies its own page-data-over-config precedence, so
       existing routes are unaffected. -->
  <!-- Purely delegating click-to-open for #appointment anchors; the anchors
       themselves are keyboard-activatable, so the wrapper adds no new
       interaction and needs no keyboard handler or interactive role of its own. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="flex flex-col min-h-screen" onclick={interceptAppointment}>
    <Nav
      navLinks={page.data.navLinks}
      items={siteConfig.nav.items}
      logo={siteConfig.nav.logo}
      transparentAtTop={navTransparentAtTop}
    />

    <main id="main-content" tabindex="-1" class="flex-1">
      {@render children?.()}
    </main>

    <Footer
      columns={footerColumns(page.data.footerColumns, siteConfig)}
      socials={siteConfig.footer.socials}
      text={siteConfig.footer.text}
      heading="Want to learn more?"
      showMap
    />
  </div>
  <TransitionOverlay />
  <LandscapeModal />
  <!-- The id makes the CTA's `#appointment` anchor target real for prerender
       validation and no-JS clicks (which land harmlessly at the document end —
       /contact-us covers no-JS users); JS clicks are intercepted above to open
       the modal. -->
  <div id="appointment"><AppointmentModal /></div>
{/if}
{#if data.isPreviewSession}
  <PrismicPreview {repositoryName} />
{/if}
