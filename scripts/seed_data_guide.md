# Raithan — Seed Data Guide

> **Audience:** LLMs generating or editing `seed_data.json`.  
> Read this fully before producing any seed data. Do not guess field values; every constraint is listed here.

---

## Top-level structure

```json
{
  "users":        [ ...provider objects ],
  "seekers":      [ ...seeker objects ],
  "ratings":      [ ...rating objects ],
  "call_history": [ ...call objects ]
}
```

All four keys are **optional** — the seeder skips missing keys safely.  
You may add `"_comment"` keys anywhere; the seeder ignores them.

---

## `users[]` — Provider accounts

Each object creates one auth user + role + profile + business + products.

```jsonc
{
  "email":            "string — unique, must be valid email format",
  "role":             "string — see Role enum below",
  "provider_profile": { ... },
  "business":         { ... },
  "products":         [ ... ]
}
```

### Role enum (`user_roles.role`)

This is a PostgreSQL USER-DEFINED enum. Use only values your database actually defines.  
Common values (confirm against your schema):

| Value | Meaning |
|---|---|
| `"provider"` | Service provider (tractor, labour, equipment owner) |
| `"seeker"`   | Customer looking for services |
| `"admin"`    | Platform admin |

**Do not use any value not in your enum** — Postgres will reject it with  
`invalid input value for enum`.

---

### `provider_profile` object

Maps to the `provider_profiles` table. Upserted on `user_id`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `first_name` | string | no | Nullable column |
| `last_name` | string | no | Nullable column |
| `year_of_birth` | integer | no | e.g. `1985`. Not a date, just the year. |
| `gender` | string | no | Must be exactly `"Male"`, `"Female"`, or `"Other"`. Any other value will violate the database CHECK constraint. |
| `profile_image_url` | string or null | no | Full URL or `null` |
| `status` | string | **yes** | NOT NULL. Must be one of the values below. |

### Valid `status` values

```text
profile_pending
business_pending
verification_required
verified
modification_required
re_verification_required
rejected
blocked
```

Do not use any other value—the database enforces this with a CHECK constraint.

---

### `business` object

Maps to the `businesses` table. Upserted on `user_id` (one business per provider).

| Field | Type | Required | Notes |
|---|---|---|---|
| `business_name` | string | no | Nullable in DB. Omit or set `null` if unknown. |
| `business_type` | string | **yes** | NOT NULL column. e.g. `"transport"`, `"labour"`, `"equipment"` |
| `pincode` | string | **yes** | Must contain exactly **6 digits** (`^\d{6}$`). Stored as text, not integer. Example: `"500001"` |
| `block_number` | string | **yes** | e.g. `"12A"` |
| `street` | string | **yes** | |
| `area` | string | **yes** | Neighbourhood / colony name |
| `landmark` | string or null | no | Nullable column |
| `city` | string | **yes** | |
| `state` | string | **yes** | |
| `mobile_number` | string | **yes** | Text, not integer. Include STD code if needed. |
| `working_days` | object | **yes** | See format below |
| `working_time` | object | **yes** | See format below |
| `categories` | array of strings | no | Defaults to `[]` |
| `location` | object or null | no | See format below — the seeder converts this to PostGIS WKT |

**`working_days` format** — all seven days must be present, values are booleans:
```json
{
  "Monday": true,
  "Tuesday": true,
  "Wednesday": true,
  "Thursday": true,
  "Friday": true,
  "Saturday": false,
  "Sunday": false
}
```
Missing days will not be defaulted by the seeder — always include all seven.

**`working_time` format:**
```json
{ "start": "09:00 AM", "end": "06:00 PM" }
```
Use 12-hour format with a space before AM/PM. Both keys required.

**`location` format** — provide as a plain object; the seeder converts it to `POINT(lng lat)` WKT:
```json
{ "longitude": 78.4867, "latitude": 17.3850 }
```
- `longitude` comes first (this is PostGIS convention — longitude is X, latitude is Y)
- Use decimal degrees, not DMS
- Set to `null` to store no location

---

### `products[]` array

Maps to the `products` table. Products are **deleted and re-inserted** on each seed run (for idempotency). Do not rely on product IDs being stable across runs.

| Field | Type | Required | Notes |
|---|---|---|---|
| `product_type` | string | **yes** | Must be one of the valid values listed below. |
| `hp` | string or null | no | Horsepower as text. e.g. `"45"` |
| `model_no` | string or null | no | Nullable. Make it unique across your seed if desired. |
| `type` | string or null | no | Product subtype if applicable. |
| `e_shram_card_number` | string or null | no | Primarily used for Agriculture Labor providers. |
| `ready_to_travel` | boolean | no | Default `false` |
| `is_individual` | boolean | no | Default `false` |
| `number_of_workers` | integer | no | Default `1` |
| `services` | array of strings | no | Defaults to `[]` |
| `image_front` | string or null | no | URL |
| `image_back` | string or null | no | URL |
| `image_left` | string or null | no | URL |
| `image_right` | string or null | no | URL |
| `doc_driving_license` | string or null | no | URL |
| `doc_rc_book` | string or null | no | URL |
| `doc_bill` | string or null | no | URL |
| `doc_e_shram_card` | string or null | no | URL |
| `verification_status` | string | **yes** | NOT NULL. Must be one of the values below. |

### Valid `product_type` values

```text
Harvestors
Earth Movers
Implements
Machines
Paddy Transplantors
Drones
Mechanics
Agriculture Labor
Technician
```

The database enforces these values with a CHECK constraint.

### Valid `verification_status` values

```text
unverified
verified
rejected
modification_required
re_verification_required
blocked
```

Do not use any other value.
---

## `seekers[]` — Customer accounts

Maps to the `seekers` table. Upserted on `phone_number`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `phone_number` | string | **yes** | NOT NULL, unique. Text, not integer. |
| `location` | object or null | no | Same `{ longitude, latitude }` format as business location |

Seekers are referenced in `ratings` and `call_history` by their **index** in this array (0-based).

---

## `ratings[]` — Product ratings

Maps to the `ratings` table. Always inserted (no upsert — no unique constraint exists). Re-seeding will create duplicate ratings; truncate the table if that's a problem.

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_email` | string | **yes** | Must match an email in `users[]`. Used to look up `provider_id` and the product list. |
| `product_index` | integer | **yes** | 0-based index into that user's `products[]` array. |
| `seeker_index` | integer | **yes** | 0-based index into the top-level `seekers[]` array. |
| `rating` | integer | **yes** | NOT NULL. Typically 1–5. |

If `user_email` is not found in `users[]`, or the `product_index` / `seeker_index` resolves to nothing (e.g. the product failed to insert), the rating is skipped and logged as a failure — **it does not crash the seeder**.

---

## `call_history[]` — Call log entries

Maps to the `call_history` table. Always inserted.

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_email` | string | **yes** | Resolves `provider_id` from `users[]` |
| `seeker_index` | integer | **yes** | Resolves `seeker_id` from `seekers[]` |
| `product_index` | integer or null | no | Set `null` if the call was not about a specific product. Resolves `product_id`. |
| `seeker_phone` | string | **yes** | NOT NULL in DB. Must be provided explicitly — the seeder does not copy it from the seeker row. |
| `provider_phone` | string | **yes** | NOT NULL in DB. Should match the business `mobile_number` for the referenced user. |

---

## What the seeder does (execution order)

1. **Pass 1** — For each user in `users[]`:
   - Create auth user (or find existing by email)
   - Insert role into `user_roles` (silently ignores duplicate)
   - Upsert `provider_profiles` on `user_id`
   - Upsert `businesses` on `user_id`
   - **Delete all existing products** for this business, then insert fresh ones
2. **Pass 2** — Upsert each seeker in `seekers[]` on `phone_number`
3. **Pass 3** — Insert each rating, resolving IDs from the maps built in passes 1 & 2
4. **Pass 4** — Insert each call_history record, same resolution approach

Each step is wrapped in error handling. A failure in one step does not crash the seeder; it logs the failure and continues.

---

## other stuff:
image urls from domains: ['i.pravatar.cc', 'images.unsplash.com'],
and append all of their names with "__test__"

## Common mistakes to avoid
| Mistake | Effect |
|---|---|
| Using a role string not in your Postgres enum | `invalid input value for enum` |
| Using an invalid provider profile status | Violates the `provider_profiles_status_check` constraint |
| Using an invalid gender value | Violates the `provider_profiles_gender_check` constraint |
| Using an invalid product type | Violates the `products_product_type_check` constraint |
| Using an invalid verification status | Violates the `products_verification_status_check` constraint |
| Using a pincode that is not exactly six digits | Violates `businesses_pincode_check` |
| `longitude` and `latitude` swapped | Location stored incorrectly |
| `working_days` missing one or more weekday keys | JSON is stored exactly as provided; missing days are not added automatically |
| `seeker_index` out of bounds | Rating/call skipped and logged |
| `product_index` points to a product that failed to insert | Rating/call skipped and logged |
| Rating outside your application's expected range | Database may allow it, but application validation may reject it |
| Omitting `product_type` | Insert fails (NOT NULL) |
| Omitting `verification_status` | Insert fails (NOT NULL) |
| Omitting required business fields | Insert fails (NOT NULL constraint) |