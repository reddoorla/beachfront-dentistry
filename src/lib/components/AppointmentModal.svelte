<script lang="ts">
  import { enhance } from "$app/forms";
  import { trapFocus } from "$lib/actions/trapFocus";
  import Field from "$lib/components/Field.svelte";
  import { appointmentOpen } from "$lib/stores/appointment";

  let submitted = $state(false);
  let name = $state("");
  let email = $state("");
  let phone = $state("");
  let message = $state("");

  const close = () => appointmentOpen.set(false);
  const onKeydown = (e: KeyboardEvent) => e.key === "Escape" && close();

  // The timing screen (createIngestAction, MIN_FILL_MS) needs a fill window;
  // stamping open-time here is equivalent to the contact route's load-time
  // `formTs` — there's no per-request server load for a layout-mounted modal.
  let openedAt = $state(0);
  $effect(() => {
    if ($appointmentOpen) {
      openedAt = Date.now();
      submitted = false;
      name = "";
      email = "";
      phone = "";
      message = "";
    }
  });
</script>

<svelte:window onkeydown={$appointmentOpen ? onKeydown : undefined} />

{#if $appointmentOpen}
  <!-- Sibling to the dialog, not a parent: clicks inside the dialog never
       bubble to this handler, so no stopPropagation is needed on the dialog. -->
  <div
    class="fixed inset-0 z-100 bg-black/50"
    role="presentation"
    onclick={close}
  ></div>
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Request an appointment"
    use:trapFocus
    class="fixed top-1/2 left-1/2 z-101 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 shadow-xl"
  >
    <button
      type="button"
      class="absolute top-3 right-3 min-h-11 min-w-11"
      onclick={close}
      aria-label="Close"
    >
      ✕
    </button>
    {#if submitted}
      <p role="status">Thanks — we'll reach out to schedule your visit.</p>
    {:else}
      <h2 class="text-2xl">Request an appointment</h2>
      <form
        method="POST"
        action="/contact-us"
        class="mt-4 space-y-4"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === "success") submitted = true;
            else await update();
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

        <Field
          name="name"
          label="Name"
          autocomplete="name"
          required
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

        <button
          type="submit"
          class="w-full rounded bg-primary px-6 py-3 text-white"
        >
          Request Appointment
        </button>
      </form>
    {/if}
  </div>
{/if}
