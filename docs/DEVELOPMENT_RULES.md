# Development Rules

These rules apply to every contribution to Chiritsumo.

## Required reading and documentation

- Read `docs/PRODUCT_RULES.md` and this file before modifying product behavior or persistence.
- `docs/PRODUCT_RULES.md` is the functional and business source of truth.
- Update `docs/PRODUCT_RULES.md` in the same change whenever behavior, validation, navigation, display semantics, or persistence meaning changes.
- Update this file when a new implementation constraint or regression-prevention rule is introduced.
- When a repository does not contain these files, create them before making functional changes.
- In DEVELOPMENT_RULES.md add only generic rules for development, not specific to the product, and ask confirmation to the user for modifications.

## Versioning

- Every user-visible or functional change must update the application version displayed by the product.
- Versions use exactly three numeric parts: `MAJOR.MINOR.REVISION`.
- While working on the same pull request, each new requested change increments `REVISION` by one and keeps `MAJOR` and `MINOR` unchanged.
- When starting a new pull request, increment `MINOR` by one and reset `REVISION` to `0`.
- Increment `MAJOR` only when the user explicitly requests a major version change; when `MAJOR` changes, reset `MINOR` and `REVISION` to `0` unless the user specifies otherwise.
- The product must display the current version discreetly at the very bottom of its main page.
- Keep one canonical version value that the UI reads rather than duplicating independently maintained version strings.

## Change discipline

- Do not remove or weaken an existing feature, validation, confirmation, navigation route, backup field, or setting without explicit approval.
- Keep unrelated behavior unchanged.
- Prefer one canonical implementation for shared domain logic instead of duplicating slightly different rules in UI and persistence layers.
- When records must stay attached to the same meaning across renumbering, insertion, reordering or migration, anchor their relationship to a stable semantic or source identity rather than to a mutable display position.
- A renumbering, insertion, reordering or migration is incomplete until automated regression checks verify every dependent relationship still resolves from its stable semantic or source identity to the correct current record.
- Do not apply the same remapping or migration implicitly and explicitly in the same runtime. A transformation that is not deliberately idempotent must have one authoritative loading/execution path and must run exactly once.
- UI validation improves feedback; repository validation is authoritative.
- Cross-record validation and the write it protects must execute in one database transaction.
- Editing validation must exclude the record being edited.
- Perform a regression review before completion, including flows adjacent to the requested change.

## UI and accessibility rules

- Preserve approved flows and visual hierarchy unless a change is explicitly requested.

## Review checklist

Before declaring work complete:

- Compare the changed behavior with `docs/PRODUCT_RULES.md`.
- Review the diff for accidental feature deletion, especially dialogs, validation, navigation state, and backup fields.
- After any renumbering, insertion, reordering or migration, verify semantic relationships against their stable source identities rather than checking only the new numeric positions.
- Verify every UI restriction also has a persistence-side guard when it represents a business invariant.
- Verify the application version follows the versioning rules for the current pull request and is visible at the bottom of the main page.
