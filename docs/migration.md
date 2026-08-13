# Content migration

Technical reference for importing client-provided content into a Prismic repository — CMS exports, URL lists, documents, spreadsheets, or any other format the client hands off. Inventory, audit, redirects, and DNS cutover are out of scope for this doc.

## Prerequisites

- A Prismic repository on a plan that exposes a **Write Token** (paid feature). Free repos can author via the UI but cannot accept programmatic migrations.
- Custom Types and Slice schemas defined in [customtypes/](../customtypes) and [src/lib/slices/](../src/lib/slices). These are the target shapes.
- Environment variables:
  - `PRISMIC_REPOSITORY_NAME` — target repository
  - `PRISMIC_WRITE_TOKEN` — permanent write token, do not commit

## Modeling

Translate the source content into Prismic Custom Types and Slice variations. Decide:

- Which source content types collapse into a single Prismic type
- Which patterns become typed Slices
- How taxonomies map (categories/tags → Prismic relationship fields or repeatable groups)

Check the schemas into [customtypes/](../customtypes) so the model is reproducible.

## Migrate

Author a Node migration script using `@prismicio/client`'s Migration API (`createMigration` + `writeClient.migrate`) and `@prismicio/migrate`'s `htmlAsRichText` helper. See [scripts/import/migrate.example.ts](../scripts/import/migrate.example.ts) for the shape.

The script:

1. Reads source content (XML / JSON / CSV / etc.)
2. Normalizes each row into a Custom-Type-shaped document
3. Converts HTML bodies into Slice variations (`htmlAsRichText` for prose; custom mappers for typed Slices)
4. Uploads referenced media via `migration.createAsset()` (auto-deduped by source file)
5. Submits via `writeClient.migrate(migration, { reporter })`

**Constraints:**

- Prismic rate-limits the Migration API to **1 document/second per repository**. Plan accordingly for large imports.
- For new content models or large imports, run against a staging Prismic repository first; diff the output, confirm Slice shapes render correctly in Slice Simulator, then promote.
- Preserve authorship and original publish dates by setting them on each document.

## This repository's seed scripts

Three scripts stage the Beachfront rebuild into a single unpublished Migration
release. They share [scripts/lib/prismic-migration.mjs](../scripts/lib/prismic-migration.mjs).

| script                                                                | writes                                      | payload                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| [scripts/seed-pages.mjs](../scripts/seed-pages.mjs)                   | the 5 `page` docs' slice assemblies         | [src/lib/beachfront-pages.js](../src/lib/beachfront-pages.js)                          |
| [scripts/seed-entity-content.mjs](../scripts/seed-entity-content.mjs) | `person`, `news_article`, `collection_item` | [src/lib/beachfront-entities.js](../src/lib/beachfront-entities.js) + `PERSON_BEACHES` |
| [scripts/seed-settings.mjs](../scripts/seed-settings.mjs)             | the `settings` singleton                    | four photographs, imported once from `static/images/`                                  |

Run `node scripts/seed-entity-content.mjs --dry-run` first — it prints every
document it would stage and writes nothing.

**One script per document type — this is a correctness rule, not a style
preference.** The Migration API's `PUT /documents/{id}` **replaces** a
document; it does not merge. And the staged version cannot be read back —
`GET https://migration.prismic.io/documents` is rejected at the gateway (403)
with the write-token credentials, so there is no way to rebuild a payload from
"whatever is already in the release". A second script that assembles its payload
from the **master** document therefore silently drops every field the first one
staged, and which fields survive depends on the order the two were run. Add a
field to an existing type by extending that type's existing script, never by
adding a new one beside it.

Push custom-type changes to Prismic **before** running a script that fills new
fields, or the values land on documents whose model has no home for them.

### A staged document cannot be read back by anything

The Migration API refuses to read itself (`GET /documents` → 403 at the
gateway), and — unlike an ordinary Prismic release — the migration release is
**not published as a ref** either. Measured immediately after a successful
`POST /documents` and on two retries after that, `/api/v2` listed exactly one
ref: `master`.

So between staging and publishing, a document is invisible to every reader
available to these scripts. For a type with a uid that is survivable, because a
re-POST collides on the uid and the script can fall back to `PUT`. For a
**singleton** there is no uid to collide on, so a blind re-run would create a
second document and `getSingle` would start returning a coin flip.
`seed-settings.mjs` therefore prints the id it created and takes it back as
`--doc-id=<id>` for any re-run inside that window. Once the release is
published the document is on `master` and the script resolves it on its own.
