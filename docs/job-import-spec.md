# Job Tracker Import — Markdown Spec

Hand this to Cowork. The output must be a **GitHub-flavored markdown table** (preferred)
that the Mason Hub job tracker can parse and import.

## Required structure

A pipe table with a header row, a separator row, and one row per job:

```markdown
| # | Company | Role | Type | Priority | Status | Opens | Deadline | Link | Notes |
| - | - | - | - | - | - | - | - | - | - |
| 1 | PNNL | National Security Intern | Internship | High | To apply | ~Sep 2026 | 2026-09-01 | https://www.pnnl.gov/national-security-internship | WA state lab; strong WSU network; ICS focus |
| 2 | MITRE | SOC Analyst Co-op | Co-op | Medium | Researching | Aug 2026 | 2026-08-15 | https://careers.mitre.org/456 | Reach out to recruiter at career fair |
```

Rules the parser enforces:

- Every table line **must start with `|`**. Leading/trailing pipes are fine.
- First `|` line is the header. The `| - | - | ... |` separator row is required and ignored.
- A row is only imported if it has **at least a Company or a Role**. Empty rows are skipped.
- **Row order = priority order.** If you omit the `#` column, position in the table sets the
  order. If you include `#`, use it to control ordering.

## Column headers (use any alias in the same group — case-insensitive)

| Field    | Accepted header names                                  |
| -------- | ------------------------------------------------------ |
| Company  | `Company`, `Agency`, `Employer`, `Org`, `Organization` |
| Role     | `Role`, `Title`, `Position`                            |
| Type     | `Type`                                                 |
| Priority | `Priority`, `Tier`                                     |
| Status   | `Status`                                               |
| Opens    | `Opens`, `Open`, `Application opens`                    |
| Deadline | `Deadline`, `Due`, `Close`, `Closes`                   |
| Link     | `Link`, `URL`, `Apply`                                 |
| Order    | `#`, `Order`, `Rank`, `N`, `No`                        |
| Notes    | `Notes`, `Note`, `Comments`                            |

Headers are matched after stripping non-letters, so `Company / Agency`, `Deadline (UTC)`, etc.
still work. Unknown columns are silently ignored — only the fields above are stored.

## Allowed cell values

These aren't rejected if off-spec, but they only render/filter correctly in the tracker's
dropdowns if they match **exactly** (capitalization matters):

- **Type:** `Internship` · `Co-op` · `Full-time` · `Fellowship`
- **Priority:** `High` · `Medium` · `Low`
- **Status:** `Researching` · `To apply` · `Applied` · `OA/Assessment` · `Interview` · `Offer` · `Accepted` · `Rejected`
- **Opens:** free text — when applications open, e.g. `~Sep 2026`, `Aug 2026`, `Rolling`. Blank if unknown.
- **Deadline:** ISO date `YYYY-MM-DD` (e.g. `2026-09-01`). Leave blank if unknown — don't write "TBD".
- **Link:** full `https://…` URL, or blank.
- **Notes:** free text, single line (no pipes `|` inside the cell — they'll break the column split).

## Minimum viable table

Only Company + Role are strictly required; everything else can be blank:

```markdown
| Company | Role |
| - | - |
| PNNL | Cybersecurity Intern |
```

## Also accepted: a copied/tab-separated table

If a table is pasted with the `|` bars stripped out (e.g. you copied a *rendered* table from
Notion, Google Sheets, Excel, or a markdown preview), the columns come through **tab-separated**.
The importer handles that too: first row is the header, every following row is one job. Same
header names and values as above apply. You don't need to do anything special — just make sure
the columns are separated by real tab characters (which a normal table copy produces).

## Fallback: bullet list (less reliable)

If a table isn't possible, a `-`/`*`/`1.` list works but **only captures Company and Role**,
split on the first dash:

```markdown
- PNNL - Cybersecurity Intern
- MITRE - SOC Analyst Co-op
```

Everything after the first dash becomes the role; Type/Priority/Status/Opens/Deadline/Link/Notes
are lost. **Prefer the table.**

## Import behavior

- Paste into **🏛 Job Tracker → ⇪ Import from markdown**.
- **Append** adds these rows after existing ones; **Replace all** wipes the list first.
- No deduplication — re-importing the same table creates duplicates. Generate a clean, final list.
