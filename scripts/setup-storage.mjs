// Storage 버킷을 1회성으로 만든다. (이미 있으면 그냥 통과)
// 실행: npm run setup:storage

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const BUCKETS = [
  {
    name: "post-images",
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
  },
  {
    // 실험실 프로젝트 스크린샷·스크롤 영상. 영상이 들어가므로 상한이 다르다.
    name: "project-media",
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4", "video/webm", "image/webp", "image/png", "image/svg+xml"],
  },
];

async function run() {
  const { data: existing, error: listErr } = await sb.storage.listBuckets();
  if (listErr) throw listErr;

  for (const b of BUCKETS) {
    if (existing?.some((e) => e.name === b.name)) {
      console.log(`✓ bucket "${b.name}" already exists`);
      continue;
    }
    const { error } = await sb.storage.createBucket(b.name, {
      public: true,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes,
    });
    if (error) throw error;
    console.log(`✓ created bucket "${b.name}" (public)`);
  }
  console.log("✅ done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
