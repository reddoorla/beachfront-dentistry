<script lang="ts">
  import { enhance } from "$app/forms";
  import Field from "$lib/components/Field.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import TurnstileWidget from "$lib/components/TurnstileWidget.svelte";
  import { appointmentOpen } from "$lib/stores/appointment";
  import { PHONE } from "$lib/site";

  /** Used when the server gave us no copy of its own — a thrown exception, a
   *  dropped connection, or a failure payload without an `error` string. */
  const FALLBACK_ERROR =
    "Something went wrong sending your request. Please try again.";

  let submitted = $state(false);
  let name = $state("");
  let email = $state("");
  let phone = $state("");
  let message = $state("");

  // The action (createIngestAction) answers a failure with fail(400|500|502,
  // { error }) — friendly copy it has already chosen. This modal used to throw
  // that away: the handler called `update()`, which re-renders the form and
  // sets `form` on the PAGE, but nothing here ever read it. So a visitor whose
  // submission was rejected saw the modal sit there completely unchanged —
  // same fields, same button, no message — and either assumed it worked or
  // clicked again. On a route whose whole purpose is booking a dental
  // appointment, that is a lost patient, silently.
  let errorMessage = $state("");
  let submitting = $state(false);

  /** Focused when the confirmation replaces the form. Without this, focus is
   *  left on a submit button that no longer exists, which sends it to <body>;
   *  a keyboard or screen-reader user is then dropped at the top of the
   *  document with no idea the request went through. */
  let confirmationEl = $state<HTMLElement | null>(null);
  $effect(() => {
    if (submitted) confirmationEl?.focus();
  });

  // The timing screen (createIngestAction, MIN_FILL_MS) needs a fill window;
  // stamping open-time here is equivalent to the contact route's load-time
  // `formTs` — there's no per-request server load for a layout-mounted modal.
  let openedAt = $state(0);
  $effect(() => {
    if ($appointmentOpen) {
      openedAt = Date.now();
      submitted = false;
      errorMessage = "";
      submitting = false;
      name = "";
      email = "";
      phone = "";
      message = "";
    }
  });
</script>

<!-- Modal (native <dialog> via showModal) owns focus containment, Escape,
     backdrop-click close, the Close button, and layering — nothing to
     hand-roll here. bind:open keeps the store in sync both ways, so the
     layout's delegated #appointment handler opens it and any close path
     (Escape / backdrop / ✕) resets the store. -->
<Modal bind:open={$appointmentOpen} ariaLabel="Request an appointment">
  {#if submitted}
    <!-- tabindex=-1 so the $effect above can move focus here; role=status
         announces it to assistive tech without stealing the reading position
         from a user who is already elsewhere. -->
    <p bind:this={confirmationEl} role="status" tabindex="-1">
      Thanks — we'll reach out to schedule your visit.
    </p>
  {:else}
    <h2 class="text-2xl">Request an appointment</h2>
    <form
      method="POST"
      action="/contact-us"
      class="mt-4 space-y-4"
      use:enhance={() => {
        submitting = true;
        // Clear on submit, not on failure: leaving the previous error up while
        // the retry is in flight reads as "it failed again" before it has.
        errorMessage = "";
        return async ({ result }) => {
          submitting = false;
          if (result.type === "success") {
            submitted = true;
            return;
          }
          // `update()` is deliberately NOT called. It would reset the form's
          // values, and the one thing a visitor must not lose after a failed
          // submit is what they just typed — the fields are bound to state
          // here, so leaving them alone keeps the retry a single click.
          if (result.type === "failure") {
            errorMessage =
              typeof result.data?.error === "string"
                ? result.data.error
                : FALLBACK_ERROR;
          } else {
            // "error" (an exception or a dropped connection) and "redirect",
            // which this action never issues but would otherwise vanish here.
            errorMessage = FALLBACK_ERROR;
          }
        };
      }}
    >
      <!-- Anti-bot contract mirrored from src/routes/contact-us/+page.svelte:
           a per-request timing token + a hidden honeypot, screened centrally
           by createIngestAction (bot-field / ts field names, 800ms min fill). -->
      <input type="hidden" name="ts" value={openedAt} />
      <input
        type="text"
        name="bot-field"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="hidden"
      />

      <!-- autofocus: the modal must open ONTO the first thing to fill in.
           Without it the native dialog-focusing steps take the first focusable
           child, which is Modal's ✕ — the booking flow's keyboard path started
           on the exit. Exactly one field carries it. -->
      <Field
        name="name"
        label="Name"
        autocomplete="name"
        required
        autofocus
        bind:value={name}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autocomplete="email"
        required
        bind:value={email}
      />
      <Field
        name="phone"
        label="Phone"
        type="tel"
        autocomplete="tel"
        required
        bind:value={phone}
      />
      <Field
        name="message"
        label="Anything we should know?"
        bind:value={message}
      />

      <!-- role=alert so a failure is announced the moment it appears; the
           phone number is the escape hatch when the form itself is the thing
           that is broken (a 500 means the ingest config is missing, and no
           amount of retrying will help). -->
      {#if errorMessage}
        <p
          role="alert"
          class="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorMessage}
          <br />
          You can also call us at
          <a class="underline" href={PHONE.href}>{PHONE.display}</a>.
        </p>
      {/if}

      <!-- Renders nothing until PUBLIC_TURNSTILE_SITE_KEY is set (so dev, tests
           and the pixel gates never see it). Mounted inside the form: Turnstile
           injects its hidden cf-turnstile-response input here, and the action's
           createIngestAction forwards it as the verification token. -->
      <TurnstileWidget />

      <!-- The last click in the booking flow, and it used to acknowledge
           nothing: probed transition-duration 0s, and the hovered background
           byte-identical to the resting one.
           - hover is a DARKENED deep (#0e7799 × 0.8), not the audit's
             `hover:bg-primary`: #129ecc puts the white label at 3.09:1, i.e.
             hovering the button would have broken AA. #0b5f7a is 7.16:1.
           - `disabled:opacity-60` is gone. It composited the label to 1.78:1
             against the faded button, making "Sending…" the least readable
             state on the site at the exact moment someone is waiting on it and
             deciding whether to click again. The sending state now keeps the
             background and the label at full strength (5.10:1) and signals
             itself with a static inset ring + cursor — no keyframes, because
             the reduced-motion reset pins animations to 1e-05s and any spinner
             would freeze on frame one.
           - aria-busy so the state change reaches a screen reader instead of
             only the accessible name silently mutating. -->
      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        class="w-full rounded bg-primary-deep px-6 py-3 text-white transition-[background-color,transform] duration-150 hover:bg-[#0b5f7a] active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-wait disabled:hover:bg-primary-deep disabled:active:translate-y-0 aria-busy:ring-2 aria-busy:ring-inset aria-busy:ring-white/40"
      >
        {submitting ? "Sending…" : "Request Appointment"}
      </button>
    </form>
  {/if}
</Modal>
