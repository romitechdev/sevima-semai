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
  generateQuizWithLLM: vi.fn().mockResolvedValue({
    questions: [
      { text: "Q1", options: ["A", "B", "C", "D"], correctIndex: 0 },
    ],
  }),
  runAgentCommandWithLLM: vi.fn().mockResolvedValue({ result: "ok" }),
}));

import { appRouter } from "../src/routes/index.js";
import { getSupabaseAdmin } from "../src/lib/supabase.js";

const teacherId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const quizId = "11111111-2222-3333-4444-555555555555";
const q1id = "aaaaaaaa-1111-2222-3333-444444444444";
const q2id = "aaaaaaaa-5555-6666-7777-888888888888";

function createMockChain(overrides: Record<string, any> = {}) {
  const chain: Record<string, any> = {};
  const methods = ["eq", "single", "order", "select", "insert", "upsert", "delete", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  for (const [k, v] of Object.entries(overrides)) {
    (chain[k] as any).mockResolvedValue(v);
  }
  return chain;
}

function mockFromSequence(...chains: any[]) {
  const mockFrom = (getSupabaseAdmin() as any).from;
  mockFrom.mockReset();
  chains.forEach((c) => mockFrom.mockReturnValueOnce(c));
}

describe("quizRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getByCode returns quiz with questions", async () => {
    const quizData = { id: quizId, title: "Math", subject: "Matematika", grade_level: "7", code: "ABC123", created_at: new Date().toISOString() };
    const questionsData = [{ id: q1id, text: "1+1?", options: ["1", "2", "3", "4"], order: 1 }];

    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ order: { data: questionsData, error: null } });
    mockFromSequence(c1, c2);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.getByCode({ code: "abc123" });
    expect(res.quiz.code).toBe("ABC123");
    expect(res.questions).toHaveLength(1);
  });

  it("getByCode throws NOT_FOUND for invalid code", async () => {
    const c1 = createMockChain({ single: { data: null, error: { message: "Not found" } } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    await expect(caller.quiz.getByCode({ code: "INVALID" })).rejects.toThrow();
  });

  it("submitAnswers calculates score correctly", async () => {
    const quizData = { id: quizId, teacher_id: teacherId };
    const questionsData = [
      { id: q1id, correct_index: 0 },
      { id: q2id, correct_index: 1 },
    ];
    const answersData = [
      { quiz_id: quizId, question_id: q1id, student_name: "Budi", selected_index: 0, is_correct: true },
      { quiz_id: quizId, question_id: q2id, student_name: "Budi", selected_index: 1, is_correct: true },
    ];

    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ eq: { data: questionsData, error: null } });
    const c3 = createMockChain({ select: { data: answersData, error: null } });
    const c4 = createMockChain();
    mockFromSequence(c1, c2, c3, c4);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.submitAnswers({
      quizCode: "ABC123",
      studentName: "Budi",
      answers: [
        { questionId: q1id, selectedIndex: 0 },
        { questionId: q2id, selectedIndex: 1 },
      ],
    });
    expect(res.score).toBe(100);
    expect(res.correctCount).toBe(2);
    expect(res.totalQuestions).toBe(2);
  });

  it("submitAnswers throws NOT_FOUND for invalid quiz code", async () => {
    const c1 = createMockChain({ single: { data: null, error: { message: "Not found" } } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    await expect(
      caller.quiz.submitAnswers({
        quizCode: "INVALID",
        studentName: "Budi",
        answers: [],
      })
    ).rejects.toThrow();
  });

  it("listByTeacher returns mapped quizzes", async () => {
    const quizzesData = [
      {
        id: quizId, title: "Quiz A", subject: "Matematika", grade_level: "7", code: "AAA111", created_at: new Date().toISOString(),
        questions: [{ count: 5 }],
        answers: [{ student_name: "Budi" }, { student_name: "Siti" }],
      },
    ];

    const c1 = createMockChain({ order: { data: quizzesData, error: null } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.listByTeacher({ teacherId });
    expect(res).toHaveLength(1);
    expect(res[0].totalQuestions).toBe(5);
    expect(res[0].totalStudents).toBe(2);
  });

  it("getProgress returns question statistics", async () => {
    const quizData = { id: quizId, teacher_id: teacherId, title: "Math", subject: "Matematika", grade_level: "7", code: "ABC123", created_at: new Date().toISOString() };
    const questionsData = [
      { id: q1id, text: "1+1?", options: ["1", "2", "3", "4"], correct_index: 1, order: 1 },
    ];
    const answersData = [
      { id: "a1", quiz_id: quizId, question_id: q1id, student_name: "Budi", selected_index: 1, is_correct: true },
      { id: "a2", quiz_id: quizId, question_id: q1id, student_name: "Siti", selected_index: 0, is_correct: false },
    ];

    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ order: { data: questionsData, error: null } });
    const c3 = createMockChain({ eq: { data: answersData, error: null } });
    mockFromSequence(c1, c2, c3);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.getProgress({ quizId });
    expect(res.totalStudents).toBe(2);
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].correctPercentage).toBe(50);
  });

  it("generateWithAI returns generated questions", async () => {
    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.generateWithAI({ prompt: "Generate math questions", numQuestions: 1 });
    expect(res.questions).toHaveLength(1);
  });

  it("create quiz inserts quiz and questions", async () => {
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: { id: "newquiz", title: "T", subject: "S", grade_level: "7", code: "NEW123" }, error: null } });
    const c3 = createMockChain({ select: { data: [{ id: q1id }], error: null } });
    mockFromSequence(c1, c2, c3);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.create({
      teacherId,
      title: "New Quiz",
      subject: "Matematika",
      gradeLevel: "7",
      questions: [
        { text: "1+1?", options: ["1", "2", "3", "4"], correctIndex: 1 },
      ],
    });
    expect(res.quiz.code).toBe("NEW123");
    expect(res.questions).toHaveLength(1);
  });

  it("create quiz upserts teacher profile when missing", async () => {
    const c1 = createMockChain({ single: { data: null, error: null } });
    const c2 = createMockChain({ single: { data: { id: "newquiz", title: "T", subject: "S", grade_level: "7", code: "NEW123" }, error: null } });
    const c3 = createMockChain({ select: { data: [{ id: q1id }], error: null } });
    mockFromSequence(c1, c1, c2, c3);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.create({
      teacherId,
      title: "New Quiz",
      subject: "Matematika",
      gradeLevel: "7",
      questions: [
        { text: "1+1?", options: ["1", "2", "3", "4"], correctIndex: 1 },
      ],
    });
    expect(res.quiz.code).toBe("NEW123");
  });

  it("submitAnswers handles partial correct answers", async () => {
    const quizData = { id: quizId, teacher_id: teacherId };
    const questionsData = [
      { id: q1id, correct_index: 0 },
      { id: q2id, correct_index: 1 },
    ];
    const answersData = [
      { quiz_id: quizId, question_id: q1id, student_name: "Budi", selected_index: 0, is_correct: true },
      { quiz_id: quizId, question_id: q2id, student_name: "Budi", selected_index: 2, is_correct: false },
    ];

    const c1 = createMockChain({ single: { data: quizData, error: null } });
    const c2 = createMockChain({ eq: { data: questionsData, error: null } });
    const c3 = createMockChain({ select: { data: answersData, error: null } });
    const c4 = createMockChain();
    mockFromSequence(c1, c2, c3, c4);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.quiz.submitAnswers({
      quizCode: "ABC123",
      studentName: "Budi",
      answers: [
        { questionId: q1id, selectedIndex: 0 },
        { questionId: q2id, selectedIndex: 2 },
      ],
    });
    expect(res.score).toBe(50);
    expect(res.correctCount).toBe(1);
  });
});
