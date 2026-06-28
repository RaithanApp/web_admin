import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// ── Add the Credentials Here ───────────────────────────────────────────────────────────────
const supabaseUrl =
  process.env.SUPABASE_URL ||
  ""; //add the credintials here

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ""
  //add the credintials here
  
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ── Seed data ─────────────────────────────────────────────────────────────────
const seed = JSON.parse(fs.readFileSync("./seed_data.json", "utf-8"));

// ── Report ────────────────────────────────────────────────────────────────────
const report = {
  users: 0,
  provider_profiles: 0,
  businesses: 0,
  products: 0,
  seekers: 0,
  ratings: 0,
  call_history: 0,
  failed: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function logFail(step, error, ctx = {}) {
  const msg = error?.message ?? String(error);
  console.error(`  ❌ ${step}: ${msg}`);
  report.failed.push({ step, error: msg, ctx });
}

/**
 * Execute a Supabase query promise.
 * Returns data (possibly null for insert/delete with no .select()) or null on error.
 * Never throws.
 */
async function safe(label, queryPromise, ctx = {}) {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      logFail(label, error, ctx);
      return null;
    }
    // inserts/deletes without .select() return null data — that's fine, treat as success
    return data ?? "__ok";
  } catch (e) {
    logFail(label, e, ctx);
    return null;
  }
}

/**
 * Convert { latitude, longitude } → PostGIS WKT geography string.
 * If the field is already a string (WKT), pass it through.
 * If null/undefined, return null.
 */
function toWKT(loc) {
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  const { longitude, latitude } = loc;
  if (longitude == null || latitude == null) return null;
  return `POINT(${longitude} ${latitude})`;
}

/**
 * Create a new auth user, or return the existing one if the email is taken.
 * Returns the user object or null.
 */
async function getOrCreateAuthUser(email) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "test123456",
      email_confirm: true,
    });

    if (!error) return data.user;

    if (error.message?.includes("already been registered")) {
      const { data: list, error: listErr } =
        await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) { logFail("listUsers", listErr, { email }); return null; }
      return list.users.find((u) => u.email === email) ?? null;
    }

    logFail("auth.createUser", error, { email });
    return null;
  } catch (e) {
    logFail("auth.createUser", e, { email });
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("🌱  Starting seed…\n");

  /**
   * userMap: email → { userId: string, products: Array<{id}> }
   * Built during Pass 1, consumed in Pass 3 & 4.
   */
  const userMap = {};

  /**
   * seekerList: ordered array of seeker DB rows { id, phone_number }
   * Built in Pass 2, referenced by index in ratings / call_history.
   */
  const seekerList = [];

  // ════════════════════════════════════════════════════════════════════════════
  // PASS 1 — Auth users → roles → profiles → businesses → products
  // ════════════════════════════════════════════════════════════════════════════
  console.log("── Pass 1: users / profiles / businesses / products");

  for (const u of seed.users ?? []) {
    console.log(`\n  👤 ${u.email}`);

    // 1a. Auth user
    const authUser = await getOrCreateAuthUser(u.email);
    if (!authUser?.id) {
      console.log("     skipping (no auth user)");
      continue;
    }
    const uid = authUser.id;
    report.users++;
    userMap[u.email] = { userId: uid, products: [] };

    // 1b. provider_profile  (upsert on user_id)
    if (u.provider_profile) {
      const profile = await safe(
        "provider_profiles.upsert",
        supabase
          .from("provider_profiles")
          .upsert({ user_id: uid, ...u.provider_profile }, { onConflict: "user_id" })
          .select("id")
          .maybeSingle(),
        { email: u.email }
      );
      if (profile && profile !== "__ok") {
        console.log(`     ✔ profile`);
        report.provider_profiles++;
      }
    }

    // 1d. business  (upsert on user_id)
    if (!u.business) {
      console.log("     ⚠ no business — skipping products");
      continue;
    }

    const businessPayload = {
      user_id: uid,
      ...u.business,
      // Convert location object → PostGIS WKT; null is fine (column is nullable)
      location: toWKT(u.business.location),
    };

    const business = await safe(
      "businesses.upsert",
      supabase
        .from("businesses")
        .upsert(businessPayload, { onConflict: "user_id" })
        .select("id")
        .maybeSingle(),
      { email: u.email }
    );

    if (!business?.id) {
      console.log("     ⚠ business upsert failed — skipping products");
      continue;
    }
    console.log(`     ✔ business: ${business.id}`);
    report.businesses++;

    // 1e. products
    //     Delete existing products for this business so re-seeding is clean.
    await safe(
      "products.delete_existing",
      supabase.from("products").delete().eq("business_id", business.id),
      { business_id: business.id }
    );

    for (const p of u.products ?? []) {
      const product = await safe(
        "products.insert",
        supabase
          .from("products")
          .insert({ user_id: uid, business_id: business.id, ...p })
          .select("id")
          .maybeSingle(),
        { email: u.email, product_type: p.product_type }
      );

      if (product?.id) {
        userMap[u.email].products.push(product);
        console.log(`     ✔ product: ${p.product_type} (${product.id})`);
        report.products++;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PASS 2 — Seekers
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n── Pass 2: seekers");

  for (const s of seed.seekers ?? []) {
    const seeker = await safe(
      "seekers.upsert",
      supabase
        .from("seekers")
        .upsert(
          {
            phone_number: s.phone_number,
            location: toWKT(s.location),
          },
          { onConflict: "phone_number" }
        )
        .select("id, phone_number")
        .maybeSingle(),
      { phone: s.phone_number }
    );

    if (seeker?.id) {
      seekerList.push(seeker);
      console.log(`  ✔ seeker: ${s.phone_number}`);
      report.seekers++;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PASS 3 — Ratings
  // Ratings reference users (by email) and seekers (by index in seed.seekers).
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n── Pass 3: ratings");

  for (const r of seed.ratings ?? []) {
    const entry  = userMap[r.user_email];
    const seeker = seekerList[r.seeker_index ?? 0];
    const product = entry?.products?.[r.product_index ?? 0];

    if (!entry) {
      logFail("ratings", new Error(`user_email not found: ${r.user_email}`), r);
      continue;
    }
    if (!seeker?.id) {
      logFail("ratings", new Error(`seeker_index ${r.seeker_index} has no record`), r);
      continue;
    }
    if (!product?.id) {
      logFail("ratings", new Error(`product_index ${r.product_index} has no record`), r);
      continue;
    }

    const ok = await safe(
      "ratings.insert",
      supabase.from("ratings").insert({
        seeker_id: seeker.id,
        product_id: product.id,
        rating: r.rating,
      }),
      r
    );

    if (ok) { console.log(`  ✔ rating ${r.rating}★ — ${r.user_email}`); report.ratings++; }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PASS 4 — Call history
  // call_history.seeker_phone / provider_phone must be supplied in the seed;
  // seeker_id and provider_id are resolved from the maps.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n── Pass 4: call_history");

  for (const c of seed.call_history ?? []) {
    const entry  = userMap[c.user_email];
    const seeker = seekerList[c.seeker_index ?? 0];
    const product = entry?.products?.[c.product_index ?? 0] ?? null;

    if (!entry) {
      logFail("call_history", new Error(`user_email not found: ${c.user_email}`), c);
      continue;
    }
    if (!seeker?.id) {
      logFail("call_history", new Error(`seeker_index ${c.seeker_index} has no record`), c);
      continue;
    }

    const ok = await safe(
      "call_history.insert",
      supabase.from("call_history").insert({
        seeker_id:      seeker.id,
        provider_id:    entry.userId,
        product_id:     product?.id ?? null,
        seeker_phone:   c.seeker_phone,
        provider_phone: c.provider_phone,
      }),
      c
    );

    if (ok) { console.log(`  ✔ call — seeker ${c.seeker_phone} → ${c.user_email}`); report.call_history++; }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REPORT
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n══════════════════════════════");
  console.log("  ✅  SEED COMPLETE");
  console.log("══════════════════════════════\n");

  console.table({
    users:             report.users,
    provider_profiles: report.provider_profiles,
    businesses:        report.businesses,
    products:          report.products,
    seekers:           report.seekers,
    ratings:           report.ratings,
    call_history:      report.call_history,
    failures:          report.failed.length,
  });

  if (report.failed.length) {
    console.log("\n⚠️  Failures:");
    console.table(report.failed);
  }
}

run().catch((e) => {
  console.error("\n💥 Fatal:", e);
  process.exit(1);
});