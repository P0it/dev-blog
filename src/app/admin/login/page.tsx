import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin/posts");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  (await cookies()).set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
  redirect(next);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/admin/posts";
  const error = sp.error === "1";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas)",
      }}
    >
      <form
        action={login}
        style={{
          width: 360,
          padding: 28,
          background: "var(--bg-base)",
          border: "1px solid var(--line-subtle)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div className="t-overline" style={{ marginBottom: 6 }}>어드민</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
            잠금
          </div>
          <div className="meta" style={{ marginTop: 4 }}>
            비밀번호를 입력하세요.
          </div>
        </div>
        <input type="hidden" name="next" value={next} />
        <input
          name="password"
          type="password"
          autoFocus
          placeholder="ADMIN_PASSWORD"
          style={{
            padding: "10px 12px",
            background: "var(--bg-base)",
            border: "1px solid var(--line-normal)",
            borderRadius: 10,
            fontSize: 14,
            color: "var(--fg-strong)",
            outline: "none",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#d33" }}>비밀번호가 틀렸습니다.</div>
        )}
        <button
          type="submit"
          style={{
            padding: "10px 14px",
            background: "var(--fg-strong)",
            color: "var(--bg-base)",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          들어가기
        </button>
      </form>
    </div>
  );
}
