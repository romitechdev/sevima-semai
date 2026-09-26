import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/lib/supabase.js", () => {
  const mockFrom = vi.fn();
  const mockAuth = {
    admin: {
      getUserById: vi.fn().mockResolvedValue({ data: { user: { email: "test@school.id", user_metadata: { name: "Test Teacher" } } } }),
    },
  };
  return {
    getSupabaseAdmin: vi.fn().mockReturnValue({ from: mockFrom, auth: mockAuth }),
  };
});

vi.mock("../src/lib/llm.js", () => ({
  generateQuizWithLLM: vi.fn(),
  generateMaterialWithLLM: vi.fn(),
  evaluateEssayWithLLM: vi.fn(),
  runAgentCommandWithLLM: vi.fn(),
  generateStudentHolisticReportWithLLM: vi.fn(),
}));

import { appRouter } from "../src/routes/index.js";
import { getSupabaseAdmin } from "../src/lib/supabase.js";
import * as llm from "../src/lib/llm.js";

const teacherId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function createMockChain(overrides: Record<string, any> = {}) {
  const chain: Record<string, any> = {};
  const methods = ["eq", "single", "order", "select", "insert", "upsert", "delete", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (typeof v === "function") {
      chain[k] = v;
    } else {
      (chain[k] as any).mockResolvedValue(v);
    }
  }
  return chain;
}

function mockFromSequence(...chains: any[]) {
  const mockFrom = (getSupabaseAdmin() as any).from;
  mockFrom.mockReset();
  chains.forEach((c) => mockFrom.mockReturnValueOnce(c));
}

describe("error handling branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("quiz.generateWithAI throws on LLM error", async () => {
    (llm.generateQuizWithLLM as any).mockRejectedValue(new Error("LLM timeout"));
    const caller = appRouter.createCaller({} as any);
    await expect(caller.quiz.generateWithAI({ prompt: "Generate math questions" })).rejects.toThrow("Gagal generate kuis otomatis: LLM timeout");
  });

  it("material.generate throws on LLM error", async () => {
    (llm.generateMaterialWithLLM as any).mockRejectedValue(new Error("LLM failed"));
    const caller = appRouter.createCaller({} as any);
    await expect(caller.material.generate({ topic: "Photosynthesis" })).rejects.toThrow("Gagal menyusun materi pembelajaran: LLM failed");
  });

  it("essay.evaluate throws on LLM error", async () => {
    (llm.evaluateEssayWithLLM as any).mockRejectedValue(new Error("LLM down"));
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.essay.evaluate({
        question: "Explain X",
        rubricOrKey: "Must mention Y",
        studentAnswer: "Some answer",
      })
    ).rejects.toThrow("Gagal menilai jawaban esai: LLM down");
  });

  it("agent.executeCommand throws on LLM error", async () => {
    (llm.runAgentCommandWithLLM as any).mockRejectedValue(new Error("Agent failed"));
    const caller = appRouter.createCaller({} as any);
    await expect(caller.agent.executeCommand({ command: "do something" })).rejects.toThrow("Gagal menjalankan perintah Agent OS: Agent failed");
  });

  it("gradebook.generateReportDigest throws on LLM error", async () => {
    (llm.generateStudentHolisticReportWithLLM as any).mockRejectedValue(new Error("Report failed"));
    const gradesData = [
      { id: "g1", teacher_id: teacherId, student_name: "Budi", source_type: "KUIS", title: "Quiz 1", score: 80, max_score: 100, created_at: new Date().toISOString() },
    ];
    const secondEq = vi.fn().mockResolvedValue({ data: gradesData, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const c1 = createMockChain({ eq: firstEq });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.gradebook.generateReportDigest({ teacherId, studentName: "Budi" })).rejects.toThrow("Gagal menyusun narasi rapor AI: Report failed");
  });

  it("quiz.getByCode throws when questions fetch fails", async () => {
    const quizData = { id: "11111111-2222-3333-4444-555555555555", title: "Math", subject: "Matematika", grade_level: "7", code: "ABC123", created_at: new Date().toISOString() };
    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ order: { data: null, error: { message: "DB error" } } });
    mockFromSequence(c1, c2);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.quiz.getByCode({ code: "ABC123" })).rejects.toThrow();
  });

  it("quiz.submitAnswers throws when questions fetch fails", async () => {
    const quizData = { id: "11111111-2222-3333-4444-555555555555", teacher_id: teacherId };
    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ eq: { data: null, error: { message: "DB error" } } });
    mockFromSequence(c1, c2);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.quiz.submitAnswers({
        quizCode: "ABC123",
        studentName: "Budi",
        answers: [],
      })
    ).rejects.toThrow();
  });

  it("quiz.submitAnswers throws when insert fails", async () => {
    const quizId = "11111111-2222-3333-4444-555555555555";
    const q1id = "aaaaaaaa-1111-2222-3333-444444444444";
    const quizData = { id: quizId, teacher_id: teacherId };
    const questionsData = [{ id: q1id, correct_index: 0 }];
    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ eq: { data: questionsData, error: null } });
    const c3 = createMockChain({ select: { data: null, error: { message: "Insert failed" } } });
    mockFromSequence(c1, c2, c3);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.quiz.submitAnswers({
        quizCode: "ABC123",
        studentName: "Budi",
        answers: [{ questionId: q1id, selectedIndex: 0 }],
      })
    ).rejects.toThrow("Failed to submit answers: Insert failed");
  });

  it("quiz.listByTeacher throws on error", async () => {
    const c1 = createMockChain({ order: { data: null, error: { message: "Query failed" } } });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.quiz.listByTeacher({ teacherId })).rejects.toThrow("Query failed");
  });

  it("quiz.getProgress throws NOT_FOUND when quiz missing", async () => {
    const c1 = createMockChain({ single: { data: null, error: null } });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.quiz.getProgress({ quizId: "11111111-2222-3333-4444-555555555555" })).rejects.toThrow();
  });

  it("document.listByTeacher throws on error", async () => {
    const c1 = createMockChain({ order: { data: null, error: { message: "Query failed" } } });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.document.listByTeacher({ teacherId })).rejects.toThrow("Query failed");
  });

  it("document.delete throws on error", async () => {
    const docId = "22222222-3333-4444-5555-666666666666";
    const secondEq = vi.fn().mockResolvedValue({ data: null, error: { message: "Delete failed" } });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const deleteFn = vi.fn().mockReturnValue({ eq: firstEq });
    const c1 = createMockChain({ delete: deleteFn });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.document.delete({ id: docId, teacherId })).rejects.toThrow("Delete failed");
  });

  it("gradebook.record throws when profile upsert and insert fail", async () => {
    const c1 = createMockChain({ single: { data: null, error: null } });
    const c2 = createMockChain({ single: { data: null, error: { message: "Insert failed" } } });
    mockFromSequence(c1, c1, c2);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.gradebook.record({
        teacherId,
        studentName: "Budi",
        sourceType: "KUIS",
        title: "Quiz",
        score: 80,
      })
    ).rejects.toThrow("Gagal mencatat nilai terintegrasi: Insert failed");
  });

  it("gradebook.listByTeacher throws on error", async () => {
    const c1 = createMockChain({ order: { data: null, error: { message: "Query failed" } } });
    mockFromSequence(c1);
    const caller = appRouter.createCaller({} as any);
    await expect(caller.gradebook.listByTeacher({ teacherId })).rejects.toThrow("Query failed");
  });

  it("document.create throws when insert fails", async () => {
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: null, error: { message: "Insert failed" } } });
    mockFromSequence(c1, c2);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.document.create({
        teacherId,
        title: "Doc",
        type: "materi",
        subject: "Biologi",
        gradeLevel: "7",
        content: "Content",
      })
    ).rejects.toThrow("Gagal menyimpan dokumentasi: Insert failed");
  });

  it("quiz.create throws when quiz insert fails", async () => {
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: null, error: { message: "Insert failed" } } });
    mockFromSequence(c1, c2);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.quiz.create({
        teacherId,
        title: "Quiz",
        subject: "Matematika",
        gradeLevel: "7",
        questions: [{ text: "Q", options: ["A", "B", "C", "D"], correctIndex: 0 }],
      })
    ).rejects.toThrow("Failed to create quiz: Insert failed");
  });

  it("quiz.create throws when questions insert fails", async () => {
    const quizId = "33333333-4444-5555-6666-777777777777";
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: { id: quizId, title: "T", subject: "S", grade_level: "7", code: "NEW123" }, error: null } });
    const c3 = createMockChain({ select: { data: null, error: { message: "Q insert failed" } } });
    const c4 = createMockChain();
    mockFromSequence(c1, c2, c3, c4);
    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.quiz.create({
        teacherId,
        title: "Quiz",
        subject: "Matematika",
        gradeLevel: "7",
        questions: [{ text: "Q", options: ["A", "B", "C", "D"], correctIndex: 0 }],
      })
    ).rejects.toThrow("Failed to create questions: Q insert failed");
  });
});
