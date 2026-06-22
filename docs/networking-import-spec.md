# Networking Import — Markdown Spec

Hand this to Cowork. The output must be a **GitHub-flavored markdown table** (preferred)
that the Mason Hub Networking tab can parse and import.

> Use this to import the people who **added me back / accepted** — not everyone I messaged.

## Required structure

A pipe table with a header row, a separator row, and one row per contact:

```markdown
| Name | Org | Role | Status | Channel | Last contact | Notes |
| - | - | - | - | - | - | - |
| Jane Doe | PNNL | Recruiter | Connected | LinkedIn | 2026-06-20 | Accepted my request; mentioned summer reqs |
| John Smith | MITRE | Security Engineer | Applied | LinkedIn | 2026-06-21 | Connected, then applied to SOC role |
```

Rules the parser enforces:

- Every table line **must start with `|`**. Leading/trailing pipes are fine.
- First `|` line is the header. The `| - | - | ... |` separator row is required and ignored.
- A row is only imported if it has **at least a Name or an Org**. Empty rows are skipped.
- Blank **Status** defaults to `Connected`. Blank **Channel** defaults to `LinkedIn`.

## Column headers (use any alias in the same group — case-insensitive)

| Field        | Accepted header names                                            |
| ------------ | --------------------------------------------------------------- |
| Name         | `Name`, `Contact`, `Person`, `Full name`                        |
| Org          | `Org`, `Organization`, `Company`, `Agency`, `Employer`          |
| Role         | `Role`, `Title`, `Position`                                      |
| Status       | `Status`, `Stage`                                               |
| Channel      | `Channel`, `Source`, `Via`, `Platform`                          |
| Last contact | `Last contact`, `Last`, `Date`, `Contacted`, `Last reached`     |
| Notes        | `Notes`, `Note`, `Comments`                                      |

Headers are matched after stripping non-letters, so `Last contact`, `Org / Company`, etc.
still work. Unknown columns are silently ignored — only the fields above are stored.

## Allowed cell values

These aren't rejected if off-spec, but they only render/filter correctly in the dropdowns if
they match **exactly** (capitalization matters):

- **Status:** `To reach out` · `Contacted` · `Connected` · `Applied` · `Interviewing` · `Offer` · `Accepted` · `Rejected`
- **Channel:** `LinkedIn` · `Email` · `Referral` · `Event` · `Other`
- **Last contact:** ISO date `YYYY-MM-DD` (e.g. `2026-06-20`). Leave blank if unknown.
- **Notes:** free text, single line (no pipes `|` inside the cell — they break the column split).

Since this list is "people who added me back," a sensible default Status is `Connected`,
then bump individuals to `Applied` / `Interviewing` / `Offer` / `Accepted` / `Rejected` as the
relationship turns into a job outcome.

## Minimum viable table

Only Name (or Org) is strictly required; everything else can be blank:

```markdown
| Name | Org |
| - | - |
| Jane Doe | PNNL |
```

## Also accepted: a copied/tab-separated table

If a table is pasted with the `|` bars stripped out (e.g. you copied a *rendered* table from
Notion, Google Sheets, Excel, or a markdown preview), the columns come through **tab-separated**.
The importer handles that too: first row is the header, every following row is one contact. Same
header names and values as above apply. Just make sure the columns are separated by real tab
characters (which a normal table copy produces).

## Fallback: bullet list (less reliable)

If a table isn't possible, a `-`/`*`/`1.` list works but **only captures Name and Org**,
split on the first dash:

```markdown
- Jane Doe - PNNL
- John Smith - MITRE
```

Everything else (Role/Status/Channel/Last contact/Notes) is lost. **Prefer the table.**

## Import behavior

- Paste into **🤝 Networking → ⇪ Import from markdown**.
- **Append** adds these rows after existing ones; **Replace all** wipes the list first.
- No deduplication on the markdown path — re-importing the same table creates duplicates.
  Generate a clean, final list. (The separate "Import 6/20 roster" button does de-dupe.)
