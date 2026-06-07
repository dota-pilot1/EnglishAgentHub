import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-10 w-10 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        이 페이지를 보려면 관리자 권한이 필요합니다.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
