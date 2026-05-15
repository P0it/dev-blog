// post-images 버킷을 1회성으로 만든다. (이미 있으면 그냥 통과)
// 실행: npm run setup:storage

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const BUCKET = "post-images";

async function run() {
  const { data: buckets, error: listErr } = await sb.storage.listBuckets();
  if (listErr) throw listErr;
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`✓ bucket "${BUCKET}" already exists`);
  } else {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
    });
    if (error) throw error;
    console.log(`✓ created bucket "${BUCKET}" (public)`);
  }
  console.log("✅ done");
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
