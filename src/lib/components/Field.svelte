<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  type FieldType =
    | "text"
    | "email"
    | "tel"
    | "url"
    | "password"
    | "number"
    | "search"
    | "textarea";

  interface Props {
    name: string;
    label: string;
    type?: FieldType;
    value?: string;
    description?: string;
    error?: string;
    required?: boolean;
    autocomplete?: HTMLInputAttributes["autocomplete"];
    placeholder?: string;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
    inputmode?: HTMLInputAttributes["inputmode"];
    rows?: number;
    /** Marks this control as the one a containing dialog should open onto.
     *  Modal.svelte looks for `[autofocus]` after showModal(); without it the
     *  native dialog-focusing steps land on the first focusable child, which
     *  is the ✕ — the exit. Only ever set it on ONE field per dialog. */
    autofocus?: boolean;
  }

  let {
    name,
    label,
    type = "text",
    value = $bindable(""),
    description,
    error,
    required = false,
    autocomplete,
    placeholder,
    minlength,
    maxlength,
    pattern,
    inputmode,
    rows = 4,
    autofocus = false,
  }: Props = $props();

  const uid = $props.id();
  const inputId = `${uid}-input`;
  const descriptionId = `${uid}-description`;
  const errorId = `${uid}-error`;

  const describedBy = $derived(
    [description ? descriptionId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined,
  );

  // One string, two controls: the input and the textarea had the same class
  // list copy-pasted, which is exactly how a fix lands on one and not the
  // other. Kept as a literal so Tailwind's source scan still sees every class.
  //
  // `border-secondary/75` replaces `border-light`: --color-light is #fafafa,
  // measured 1.04:1 against the white modal card — the four inputs were
  // effectively invisible boxes and a patient had to hunt for where to type.
  // /75 composites to rgb(134,145,156) = 3.21:1 on white, the lightest step of
  // --color-secondary that clears the 3:1 non-text minimum. (The audit's
  // suggested `border-secondary/30` computes to 1.51:1 — it would not have
  // fixed the defect.)
  //
  // Focus uses -deep, not plain primary: #129ecc is 3.09:1 on white, i.e. it
  // clears 3:1 by 0.09 with no margin for the ring's own antialiasing;
  // #0e7799 is 5.10:1. Border and ring share one 150ms ramp so the field reads
  // as waking up rather than erroring; `outline-hidden` (NOT `outline-none`,
  // which in Tailwind v4 resolves to `outline-style:none`) keeps the
  // forced-colors fallback outline the rest of the repo gets.
  const controlClass =
    "border-2 border-secondary/75 rounded px-3 py-2 " +
    "transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none " +
    "focus:outline-hidden focus:border-primary-deep focus:ring-2 focus:ring-primary-deep " +
    "aria-invalid:border-red-600";
</script>

<div class="flex flex-col gap-1">
  <label for={inputId} class="text-sm font-medium">
    {label}
    {#if required}
      <span aria-hidden="true" class="text-red-600">*</span>
      <span class="sr-only">(required)</span>
    {/if}
  </label>

  {#if description}
    <p id={descriptionId} class="text-sm text-secondary">{description}</p>
  {/if}

  {#if type === "textarea"}
    <!-- svelte-ignore a11y_autofocus -->
    <textarea
      id={inputId}
      {name}
      {required}
      {rows}
      {placeholder}
      {minlength}
      {maxlength}
      {autocomplete}
      {autofocus}
      bind:value
      aria-describedby={describedBy}
      aria-invalid={error ? "true" : undefined}
      class={controlClass}></textarea>
  {:else}
    <!-- svelte-ignore a11y_autofocus -->
    <input
      id={inputId}
      {type}
      {name}
      {required}
      {placeholder}
      {minlength}
      {maxlength}
      {pattern}
      {autocomplete}
      {inputmode}
      {autofocus}
      bind:value
      aria-describedby={describedBy}
      aria-invalid={error ? "true" : undefined}
      class={controlClass}
    />
  {/if}

  {#if error}
    <p id={errorId} role="alert" class="text-sm text-red-600">{error}</p>
  {/if}
</div>
