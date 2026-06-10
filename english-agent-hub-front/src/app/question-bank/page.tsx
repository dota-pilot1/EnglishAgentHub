"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import {
  questionApi,
  type EmbeddingStatus,
  type QuestionDifficulty,
  type QuestionListParams,
  type QuestionResponse,
  type QuestionSubject,
  type QuestionUpsertRequest,
} from "@/entities/question/api/questionApi";
import { toast, toastError } from "@/shared/lib/toast";

const subjects: { value: QuestionSubject; label: string; tone: string }[] = [
  { value: "math", label: "수학", tone: "border-sky-200 bg-sky-50 text-sky-700" },
  { value: "english", label: "영어", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "korean_history", label: "한국사", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
];

const difficulties: { value: QuestionDifficulty; label: string }[] = [
  { value: "easy", label: "쉬움" },
  { value: "medium", label: "보통" },
  { value: "hard", label: "어려움" },
];

const initialForm: QuestionUpsertRequest = {
  subject: "math",
  category: "이차방정식",
  topic: "인수분해",
  difficulty: "medium",
  question: "x² - 5x + 6 = 0의 해를 구하시오.",
  choices: [],
  answer: "x = 2, 3",
  explanation: "인수분해하면 (x-2)(x-3)=0이므로 해는 2와 3입니다.",
  keywords: ["이차방정식", "인수분해", "근"],
  embeddingText: "",
};

const subjectGroup = (value: QuestionSubject) => {
  if (value === "elementary_math" || value === "algebra") return "math";
  if (value === "common_sense") return "korean_history";
  return value;
};

const subjectLabel = (value: QuestionSubject) =>
  subjects.find((subject) => subject.value === subjectGroup(value))?.label ?? value;

const difficultyLabel = (value: QuestionDifficulty) =>
  difficulties.find((difficulty) => difficulty.value === value)?.label ?? value;

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildEmbeddingTextPreview = (
  form: QuestionUpsertRequest,
  choicesText: string,
  keywordsText: string,
) => {
  const choices = splitLines(choicesText);
  const keywords = splitCsv(keywordsText);
  const lines = [
    `과목: ${subjectLabel(form.subject)}`,
    `카테고리: ${form.category}`,
    `주제: ${form.topic}`,
    `난이도: ${difficultyLabel(form.difficulty)}`,
    `문제: ${form.question}`,
    choices.length > 0 ? `보기: ${choices.join(", ")}` : null,
    `정답: ${form.answer}`,
    `해설: ${form.explanation}`,
    keywords.length > 0 ? `키워드: ${keywords.join(", ")}` : null,
  ];

  return lines.filter(Boolean).join("\n");
};

export default function QuestionBankPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <QuestionBankContent />
    </RequireRole>
  );
}

function QuestionBankContent() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<QuestionListParams>({});
  const [form, setForm] = useState<QuestionUpsertRequest>(initialForm);
  const [choicesText, setChoicesText] = useState("");
  const [keywordsText, setKeywordsText] = useState(initialForm.keywords?.join(", ") ?? "");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmEmbedKind, setConfirmEmbedKind] = useState<null | "PENDING" | "FAILED">(null);

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["questions", filters],
    queryFn: () => questionApi.list(filters),
  });

  const { data: allData = [] } = useQuery({
    queryKey: ["questions", "all"],
    queryFn: () => questionApi.list({}),
  });

  const stats = useMemo(() => {
    return subjects.map((subject) => ({
      ...subject,
      count: allData.filter((question) => subjectGroup(question.subject) === subject.value).length,
    }));
  }, [allData]);

  const tree = useMemo(() => {
    const grouped = new Map<QuestionSubject, Map<string, number>>();
    for (const question of allData) {
      const sub = subjectGroup(question.subject);
      if (!grouped.has(sub)) grouped.set(sub, new Map());
      const cats = grouped.get(sub)!;
      cats.set(question.category, (cats.get(question.category) ?? 0) + 1);
    }
    return subjects.map((subject) => {
      const categories = Array.from(grouped.get(subject.value)?.entries() ?? [])
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));
      const total = categories.reduce((sum, c) => sum + c.count, 0);
      return { ...subject, total, categories };
    });
  }, [allData]);

  const createMutation = useMutation({
    mutationFn: questionApi.create,
    onSuccess: () => {
      toast.success("문제를 저장했습니다.");
      qc.invalidateQueries({ queryKey: ["questions"] });
      setForm(initialForm);
      setChoicesText("");
      setKeywordsText(initialForm.keywords?.join(", ") ?? "");
      setFormOpen(false);
    },
    onError: (e) => toastError(e, "문제 저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: questionApi.delete,
    onSuccess: () => {
      toast.success("문제를 삭제했습니다.");
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e) => toastError(e, "문제 삭제에 실패했습니다."),
  });

  const { data: embeddingStatus } = useQuery({
    queryKey: ["questions", "embedding-status"],
    queryFn: questionApi.embeddingStatus,
    refetchInterval: 30000,
  });

  const embedMutation = useMutation({
    mutationFn: () => questionApi.embedPending(50),
    onSuccess: (result) => {
      if (result.picked === 0) {
        toast.success("임베딩 대기 중인 문제가 없습니다.");
      } else {
        toast.success(
          `임베딩 ${result.completed}건 완료${result.failed > 0 ? `, ${result.failed}건 실패` : ""}` +
            (result.stillPending > 0 ? ` (남은 대기 ${result.stillPending}건)` : ""),
        );
      }
      qc.invalidateQueries({ queryKey: ["questions"] });
      setConfirmEmbedKind(null);
    },
    onError: (e) => {
      toastError(e, "임베딩 배치에 실패했습니다.");
      setConfirmEmbedKind(null);
    },
  });

  const handleSubjectChange = (subject: QuestionSubject) => {
    const presets: Partial<Record<QuestionSubject, Pick<QuestionUpsertRequest, "category" | "topic">>> = {
      math: { category: "이차방정식", topic: "인수분해" },
      korean_history: { category: "조선시대", topic: "훈민정음" },
      english: { category: "고등 영어", topic: "빈칸추론" },
    };
    setForm((cur) => ({ ...cur, subject, ...(presets[subject] ?? {}) }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      choices: splitLines(choicesText),
      keywords: splitCsv(keywordsText),
      embeddingText: form.embeddingText?.trim() || undefined,
    });
  };

  const handleFillEmbeddingText = () => {
    setForm((cur) => ({
      ...cur,
      embeddingText: buildEmbeddingTextPreview(cur, choicesText, keywordsText),
    }));
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25 px-4 py-5">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <section className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground">
              <BookOpenCheck className="h-4 w-4" />
              Question Bank PoC
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">문제 은행</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              문제 저장, 필터 조회, embeddingText 확인을 먼저 검증합니다.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="grid grid-cols-3 gap-2">
              {stats.map((item) => (
                <div key={item.value} className={`rounded-md border px-3 py-2 ${item.tone}`}>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="mt-1 text-xl font-bold">{item.count}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              문제 등록
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
          <UnitTree
            tree={tree}
            selectedSubject={(filters.subject as QuestionSubject | undefined) ?? undefined}
            selectedCategory={filters.category}
            onSelectAll={() =>
              setFilters((cur) => ({ ...cur, subject: undefined, category: undefined }))
            }
            onSelectSubject={(subject) =>
              setFilters((cur) => ({ ...cur, subject, category: undefined }))
            }
            onSelectCategory={(subject, category) =>
              setFilters((cur) => ({ ...cur, subject, category }))
            }
          />

          {formOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/35 px-4 py-10"
            onClick={(e) => {
              if (e.target === e.currentTarget) setFormOpen(false);
            }}
          >
          <form onSubmit={handleSubmit} className="w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/35 px-5 py-4">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Question</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight">문제 등록</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">embeddingText는 비워두면 서버가 자동 생성합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <section className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 text-sm font-semibold">
                    <span>과목</span>
                    <select
                      value={form.subject}
                      onChange={(e) => handleSubjectChange(e.target.value as QuestionSubject)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {subjects.map((subject) => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-semibold">
                    <span>난이도</span>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm((cur) => ({ ...cur, difficulty: e.target.value as QuestionDifficulty }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {difficulties.map((difficulty) => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TextField label="카테고리" value={form.category} onChange={(value) => setForm((cur) => ({ ...cur, category: value }))} />
                  <TextField label="주제" value={form.topic} onChange={(value) => setForm((cur) => ({ ...cur, topic: value }))} />
                </div>

                <TextArea
                  label="문제"
                  rows={3}
                  value={form.question}
                  onChange={(value) => setForm((cur) => ({ ...cur, question: value }))}
                />
                <TextArea
                  label="보기"
                  rows={3}
                  placeholder="객관식 보기만 줄바꿈으로 입력"
                  value={choicesText}
                  onChange={setChoicesText}
                />
                <TextField label="정답" value={form.answer} onChange={(value) => setForm((cur) => ({ ...cur, answer: value }))} />
                <TextArea
                  label="해설"
                  rows={3}
                  value={form.explanation}
                  onChange={(value) => setForm((cur) => ({ ...cur, explanation: value }))}
                />
                <TextField label="키워드" value={keywordsText} onChange={setKeywordsText} placeholder="쉼표로 구분" />
              </section>

              <section className="flex min-h-[520px] flex-col rounded-lg border border-border bg-muted/20">
                <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold">embeddingText</h3>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      저장 전에 검색용 텍스트를 미리 채우고 필요하면 직접 수정합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillEmbeddingText}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-accent"
                  >
                    <Sparkles className="h-4 w-4" />
                    미리 채우기
                  </button>
                </div>
                <textarea
                  value={form.embeddingText ?? ""}
                  onChange={(e) => setForm((cur) => ({ ...cur, embeddingText: e.target.value }))}
                  placeholder="비워두면 저장 시 서버가 과목/카테고리/주제/문제/정답/해설/키워드로 자동 생성합니다."
                  className="min-h-0 flex-1 resize-none border-0 bg-transparent px-4 py-3 font-mono text-xs leading-6 outline-none"
                />
              </section>

              <div className="mt-1 flex justify-end gap-2 border-t border-border pt-4 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  저장
                </button>
              </div>
            </div>
          </form>
          </div>
          )}

          <section className="min-w-0 rounded-lg border border-border bg-background">
            <div className="space-y-3 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">문제 목록</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">총 {data.length}개</p>
                </div>
                <div className="flex items-center gap-2">
                  <EmbeddingCountCard
                    kind="PENDING"
                    count={embeddingStatus?.pending ?? 0}
                    onClick={() => setConfirmEmbedKind("PENDING")}
                  />
                  <EmbeddingCountCard
                    kind="COMPLETED"
                    count={embeddingStatus?.completed ?? 0}
                  />
                  <EmbeddingCountCard
                    kind="FAILED"
                    count={embeddingStatus?.failed ?? 0}
                    onClick={() => setConfirmEmbedKind("FAILED")}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[140px_1fr_1.4fr_auto]">
                  <FilterSelect
                    value={filters.difficulty ?? ""}
                    onChange={(value) => setFilters((cur) => ({ ...cur, difficulty: value as QuestionDifficulty | "" }))}
                    options={difficulties.map((difficulty) => ({ value: difficulty.value, label: difficulty.label }))}
                    placeholder="전체 난이도"
                  />
                  <SmallInput
                    value={filters.topic ?? ""}
                    onChange={(value) => setFilters((cur) => ({ ...cur, topic: value }))}
                    placeholder="주제"
                  />
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <SmallInput
                      value={filters.keyword ?? ""}
                      onChange={(value) => setFilters((cur) => ({ ...cur, keyword: value }))}
                      placeholder="문제/해설 검색"
                      className="pl-9"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilters({})}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-accent"
                  >
                    <RefreshCw className="h-4 w-4" />
                    필터 초기화
                  </button>
              </div>
            </div>

            <div className="min-h-[560px] p-4">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  불러오는 중
                </div>
              ) : data.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">조건에 맞는 문제가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isFetching && (
                    <div className="text-xs font-medium text-muted-foreground">목록을 갱신하는 중입니다.</div>
                  )}
                  {data.map((question) => (
                    <QuestionItem
                      key={question.id}
                      question={question}
                      expanded={expandedId === question.id}
                      onToggle={() => setExpandedId((cur) => (cur === question.id ? null : question.id))}
                      onDelete={() => {
                        if (confirm("이 문제를 삭제할까요?")) deleteMutation.mutate(question.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={confirmEmbedKind !== null}
        title={confirmEmbedKind === "FAILED" ? "실패한 임베딩을 다시 시도할까요?" : "임베딩을 진행할까요?"}
        description={
          confirmEmbedKind === "FAILED"
            ? `실패 상태인 문제 ${embeddingStatus?.failed ?? 0}건을 다시 임베딩합니다.`
            : `대기 상태인 문제 ${embeddingStatus?.pending ?? 0}건을 OpenAI로 임베딩합니다.`
        }
        confirmText="임베딩 진행"
        loading={embedMutation.isPending}
        onConfirm={() => embedMutation.mutate()}
        onCancel={() => setConfirmEmbedKind(null)}
      />
    </main>
  );
}

function QuestionItem({
  question,
  expanded,
  onToggle,
  onDelete,
}: {
  question: QuestionResponse;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const tone = subjects.find((subject) => subject.value === question.subject)?.tone ?? "border-border bg-muted text-foreground";

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-bold ${tone}`}>
              {subjectLabel(question.subject)}
            </span>
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-semibold">
              {question.category} / {question.topic}
            </span>
            <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
              {difficultyLabel(question.difficulty)}
            </span>
            <EmbeddingStatusBadge status={question.embeddingStatus} model={question.embeddingModel} />
          </div>
          <h3 className="mt-3 text-base font-bold leading-7">{question.question}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-accent"
          >
            <Sparkles className="h-4 w-4" />
            임베딩
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-white"
            aria-label="문제 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {question.choices.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {question.choices.map((choice, index) => (
            <div key={`${choice}-${index}`} className="rounded-md border border-border bg-muted/35 px-3 py-2 text-sm">
              {index + 1}. {choice}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-muted/25 p-3">
          <p className="text-xs font-bold text-muted-foreground">정답</p>
          <p className="mt-1 text-sm font-semibold">{question.answer}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/25 p-3">
          <p className="text-xs font-bold text-muted-foreground">키워드</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {question.keywords.map((keyword) => (
              <span key={keyword} className="rounded-md bg-background px-2 py-1 text-xs font-semibold">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.explanation}</p>

      {expanded && (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-neutral-950 p-3 text-xs leading-5 text-neutral-50">
          {question.embeddingText}
        </pre>
      )}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-semibold">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <label className="space-y-1.5 text-sm font-semibold">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={label !== "보기" && label !== "embeddingText 직접 입력"}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SmallInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function EmbeddingCountCard({
  kind,
  count,
  onClick,
}: {
  kind: "PENDING" | "COMPLETED" | "FAILED";
  count: number;
  onClick?: () => void;
}) {
  const meta = {
    PENDING: {
      label: "대기",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: Clock,
    },
    COMPLETED: {
      label: "완료",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: Check,
    },
    FAILED: {
      label: "실패",
      tone: "border-red-200 bg-red-50 text-red-700",
      Icon: CircleAlert,
    },
  }[kind];

  const clickable = !!onClick && count > 0;
  const Tag = clickable ? "button" : "div";
  const interactiveCls = clickable
    ? "cursor-pointer transition-colors hover:brightness-95"
    : count === 0
      ? "opacity-60"
      : "";

  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={clickable ? onClick : undefined}
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm font-semibold ${meta.tone} ${interactiveCls}`}
      title={clickable ? `${meta.label} ${count}건 임베딩` : undefined}
    >
      <meta.Icon className="h-3.5 w-3.5" />
      <span>{meta.label}</span>
      <span className="rounded bg-background/60 px-1.5 py-0.5 text-xs font-bold tabular-nums">
        {count}
      </span>
    </Tag>
  );
}

function EmbeddingStatusBadge({
  status,
  model,
}: {
  status: EmbeddingStatus;
  model: string | null;
}) {
  if (status === "COMPLETED") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
        title={model ? `임베딩됨 · ${model}` : "임베딩됨"}
      >
        <Check className="h-3 w-3" />
        임베딩됨
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
        <CircleAlert className="h-3 w-3" />
        임베딩 실패
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
      <Clock className="h-3 w-3" />
      임베딩 대기
    </span>
  );
}

function UnitTree({
  tree,
  selectedSubject,
  selectedCategory,
  onSelectAll,
  onSelectSubject,
  onSelectCategory,
}: {
  tree: { value: QuestionSubject; label: string; tone: string; total: number; categories: { name: string; count: number }[] }[];
  selectedSubject?: QuestionSubject;
  selectedCategory?: string;
  onSelectAll: () => void;
  onSelectSubject: (subject: QuestionSubject) => void;
  onSelectCategory: (subject: QuestionSubject, category: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<QuestionSubject>>(new Set());
  const isAll = !selectedSubject && !selectedCategory;
  const totalCount = tree.reduce((sum, s) => sum + s.total, 0);

  const toggle = (subject: QuestionSubject) =>
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });

  return (
    <aside className="self-start rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-bold">단원</h2>
        </div>
      </div>
      <div className="space-y-1 p-2">
        <button
          type="button"
          onClick={onSelectAll}
          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            isAll ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          <span>전체</span>
          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${isAll ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>
            {totalCount}
          </span>
        </button>

        {tree.map((subject) => {
          const isOpen = !collapsed.has(subject.value);
          const subjectSelected = selectedSubject === subject.value && !selectedCategory;
          return (
            <div key={subject.value} className="space-y-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggle(subject.value)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  aria-label={isOpen ? "접기" : "펼치기"}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubject(subject.value)}
                  className={`flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm font-bold transition-colors ${
                    subjectSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <span>{subject.label}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${subjectSelected ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>
                    {subject.total}
                  </span>
                </button>
              </div>
              {isOpen && subject.categories.length > 0 && (
                <div className="ml-7 space-y-0.5 border-l border-border pl-2">
                  {subject.categories.map((category) => {
                    const isSelected =
                      selectedSubject === subject.value && selectedCategory === category.name;
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => onSelectCategory(subject.value, category.name)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent"
                        }`}
                      >
                        <span className="truncate">{category.name}</span>
                        <span className={`ml-2 rounded-md px-1.5 py-0.5 text-xs font-bold ${isSelected ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {isOpen && subject.categories.length === 0 && (
                <p className="ml-9 py-1 text-xs text-muted-foreground">등록된 단원이 없습니다.</p>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
