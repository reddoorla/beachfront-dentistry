<script lang="ts">
  import { X } from "@lucide/svelte";
  import { tick, type Snippet } from "svelte";

  interface ModalProps {
    open: boolean;
    onclose?: () => void;
    /** Accessible name for the dialog (omit when the content provides a
     *  heading you reference some other way). */
    ariaLabel?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onclose,
    ariaLabel,
    class: passedClasses = "",
    children,
  }: ModalProps = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  // No use:trapFocus here: showModal() already gives native focus containment,
  // Escape handling, and focus restore — adding the action would double-trap.
  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      dialogEl.showModal();
      void focusInitial();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  });

  /** showModal() runs the spec's dialog-focusing steps against the DOM as it
   *  exists at that instant: first `[autofocus]` descendant, else the first
   *  focusable one — which is the ✕, i.e. the exit. Two things break the
   *  native path on its own, so re-assert one tick later:
   *  (1) a consumer whose autofocus target only appears on the NEXT render
   *      (AppointmentModal resets `submitted` in its own $effect, so the form
   *      is absent for one tick when reopening after a success), and
   *  (2) jsdom, where Modal.test.ts's showModal polyfill only flips the
   *      attribute and moves no focus at all.
   *  One tick is short enough that this cannot yank focus away from a user. */
  async function focusInitial() {
    await tick();
    const el = dialogEl;
    if (!el?.open) return;
    const target = el.querySelector<HTMLElement>("[autofocus]");
    if (target && document.activeElement !== target) target.focus();
  }

  // Scroll lock. `showModal()` puts the dialog in the top layer but does NOT
  // stop the document behind it scrolling: probed at 1440x900, a 600px wheel
  // over the open modal moved window.scrollY 0 → 600. On a phone that reads as
  // the modal having closed — the beach photo slides past behind the form.
  //
  // `overflow: hidden` on <body> (not documentElement, and not `position:
  // fixed`): body's overflow propagates to the viewport while html's is
  // `visible`, and unlike the position:fixed technique it neither loses the
  // scroll position nor changes the containing block for absolute descendants
  // — which matters here, because the site header is absolutely positioned.
  //
  // Keyed on `open`, so Svelte runs the teardown on EVERY close path (Escape,
  // backdrop, ✕ — all of them route through `open = false`) and on unmount.
  // A lock that outlives its modal leaves the page permanently unscrollable,
  // which is a worse bug than the one being fixed.
  $effect(() => {
    if (!open || typeof document === "undefined") return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Classic-scrollbar environments lose the scrollbar's width when the
    // document stops scrolling; pay it back as padding so the page behind
    // doesn't jump sideways as the modal opens.
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  });

  function close() {
    open = false;
    onclose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) close();
  }
</script>

<!-- `m-auto` is load-bearing, not decoration: Tailwind preflight's `*{margin:0}`
     beats the UA's `dialog{margin:auto}`, and with the UA's `inset:0` still in
     force that pinned the dialog to the top-left — probed {x:16, y:0} at
     1440x900, the 16px being the old `mx-4` and nothing else. Restoring auto
     margins against `inset:0` is what centers it on both axes.
     `w-[calc(100%-2rem)]` keeps the 16px side gutter `mx-4` used to provide,
     without the overflow `w-full mx-4` caused below 544px. -->
<dialog
  bind:this={dialogEl}
  aria-label={ariaLabel}
  onclose={close}
  onclick={handleBackdropClick}
  class="bf-modal m-auto w-[calc(100%-2rem)] max-w-lg bg-transparent p-0"
>
  <div
    class="relative bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto {passedClasses}"
  >
    <!-- 44x44 hit area (WCAG 2.2 2.5.8 wants ≥24x24; the rest of the site uses
         min-h-11/min-w-11 for icon controls) pulled back over the corner with
         -m-2 so the 20px glyph stays where it has always sat. -->
    <button
      type="button"
      onclick={close}
      class="absolute top-4 right-4 -m-2 flex min-h-11 min-w-11 items-center justify-center rounded p-2 text-dark/60 transition hover:text-dark active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:outline-hidden cursor-pointer"
      aria-label="Close"
    >
      <X size={20} />
    </button>
    <div class="p-8">
      {@render children?.()}
    </div>
  </div>
</dialog>

<style>
  /* Entrance AND exit, panel and scrim together. The old
     `open:animate-[fade-in_200ms]` was one-way and the ::backdrop computed
     `animation: none`, so the scrim hard-cut in and, one frame after ✕, the
     whole thing went `display:none` at `opacity:1`.

     `display` and `overlay` are in the transition list with `allow-discrete`,
     which is what keeps the dialog in the top layer long enough for the exit
     to be seen — so `dialogEl.close()` stays a plain call with no JS timing.
     `@starting-style` supplies the pre-open frame the transition starts from.
     Both need Chrome 117+/Safari 17.4+/Firefox 129+; older engines simply
     skip to the end state, i.e. exactly today's behaviour.

     `:global` rather than Svelte's scoping because `[open]` is never on the
     element in the template — Svelte's unused-selector pass would prune these
     rules. `.bf-modal` is unique to this component, so the reach is the same. */
  :global(dialog.bf-modal) {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition:
      opacity 240ms var(--transition-out-expo),
      transform 240ms var(--transition-out-expo),
      display 240ms allow-discrete,
      overlay 240ms allow-discrete;
  }

  :global(dialog.bf-modal[open]) {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  @starting-style {
    :global(dialog.bf-modal[open]) {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
  }

  :global(dialog.bf-modal::backdrop) {
    background-color: rgb(0 0 0 / 0);
    backdrop-filter: blur(0px);
    transition:
      background-color 240ms var(--transition-out-expo),
      backdrop-filter 240ms var(--transition-out-expo),
      display 240ms allow-discrete,
      overlay 240ms allow-discrete;
  }

  :global(dialog.bf-modal[open]::backdrop) {
    background-color: rgb(0 0 0 / 0.5);
    backdrop-filter: blur(4px);
  }

  @starting-style {
    :global(dialog.bf-modal[open]::backdrop) {
      background-color: rgb(0 0 0 / 0);
      backdrop-filter: blur(0px);
    }
  }

  /* app.css's reduced-motion reset covers `*, *::before, *::after` — which does
     NOT include `::backdrop`, so the scrim would have kept its 240ms ramp for a
     user who asked for none. Collapse both here. The discrete display/overlay
     legs still flip at the near-zero end, so open/close stay functional. */
  @media (prefers-reduced-motion: reduce) {
    :global(dialog.bf-modal),
    :global(dialog.bf-modal::backdrop) {
      transition-duration: 0.01ms !important;
    }
  }
</style>
