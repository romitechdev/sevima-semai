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
  generateMaterialWithLLM: vi.fn().mockResolvedValue({
    title: "Materi: Photosynthesis",
    subject: "IPA",
    gradeLevel: "Kelas 5",
    summary: "Ringkasan fotosintesis",
    keyPoints: ["Cahaya diperlukan"],
    explanation: "Photosynthesis is the process...",
    interactiveActivity: "Amati tanaman",
  }),
  evaluateEssayWithLLM: vi.fn().mockResolvedValue({
    score: 85,
    maxScore: 100,
    feedback: "Good answer, but missing details on light-dependent reactions.",
    strengths: ["Clear explanation"],
    improvements: ["Add more specific examples"],
  }),
  generateStudentHolisticReportWithLLM: vi.fn().mockResolvedValue({
    summary: "Student shows consistent improvement.",
    strengths: ["Active participation"],
    areasForImprovement: ["Time management"],
    recommendations: ["Practice timed exercises"],
    overallAssessment: "GOOD",
  }),
  runAgentCommandWithLLM: vi.fn().mockResolvedValue({ result: "ok" }),
}));

import { appRouter } from "../src/routes/index.js";
import { getSupabaseAdmin } from "../src/lib/supabase.js";

const teacherId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const docId = "22222222-3333-4444-5555-666666666666";

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

describe("materialRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generate returns AI-generated material", async () => {
    mockFromSequence(
      createMockChain({ single: { data: { id: teacherId }, error: null } }),
      createMockChain({
        single: (async () => ({ data: { id: "mat1", title: "Materi: Photosynthesis", subject: "IPA", grade_level: "Kelas 5", content: { summary: "Ringkasan fotosintesis", keyPoints: ["Cahaya diperlukan"], explanation: "Photosynthesis is the process...", interactiveActivity: "Amati tanaman" }, teacher_id: teacherId, created_at: new Date().toISOString() }, error: null }))
      })
    );
    const caller = appRouter.createCaller({} as any);
    const res = await caller.material.generate({ teacherId, topic: "Photosynthesis" });
    expect(res.id).toBe("mat1");
    expect(res.content.explanation).toContain("Photosynthesis is the process...");
  });
});

describe("essayRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("evaluate returns essay evaluation", async () => {
    const caller = appRouter.createCaller({} as any);
    const res = await caller.essay.evaluate({
      question: "Explain photosynthesis",
      rubricOrKey: "Must mention light and dark reactions",
      studentAnswer: "Photosynthesis uses light to make energy...",
    });
    expect(res.score).toBe(85);
    expect(res.feedback).toBeDefined();
  });

  it("evaluate records grade when teacherId provided", async () => {
    const c1 = createMockChain();
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.essay.evaluate({
      question: "Explain photosynthesis",
      rubricOrKey: "Must mention light and dark reactions",
      studentAnswer: "Photosynthesis uses light to make energy...",
      studentName: "Budi",
      teacherId,
    });
    expect(res.score).toBe(85);
  });
});

describe("gradebookRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("record inserts grade into student_grades", async () => {
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: { id: "g1", score: 85, max_score: 100 }, error: null } });
    mockFromSequence(c1, c2);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.gradebook.record({
      teacherId,
      studentName: "Budi",
      sourceType: "KUIS",
      title: "Math Quiz",
      score: 85,
      maxScore: 100,
    });
    expect(res.score).toBe(85);
  });

  it("listByTeacher returns grouped grades per student", async () => {
    const gradesData = [
      { id: "g1", teacher_id: teacherId, student_name: "Budi", source_type: "KUIS", title: "Quiz 1", score: 80, max_score: 100, created_at: new Date().toISOString() },
      { id: "g2", teacher_id: teacherId, student_name: "Budi", source_type: "ESAI", title: "Essay 1", score: 90, max_score: 100, created_at: new Date().toISOString() },
      { id: "g3", teacher_id: teacherId, student_name: "Siti", source_type: "KUIS", title: "Quiz 1", score: 70, max_score: 100, created_at: new Date().toISOString() },
    ];

    const c1 = createMockChain({ order: { data: gradesData, error: null } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.gradebook.listByTeacher({ teacherId });
    expect(res.allGrades).toHaveLength(3);
    expect(res.students).toHaveLength(2);
    const budi = res.students.find((s: any) => s.studentName === "Budi");
    expect(budi.avgScore).toBe(85);
  });

  it("generateReportDigest returns AI holistic report", async () => {
    const gradesData = [
      { id: "g1", teacher_id: teacherId, student_name: "Budi", source_type: "KUIS", title: "Quiz 1", score: 80, max_score: 100, created_at: new Date().toISOString() },
    ];

    const secondEq = vi.fn().mockResolvedValue({ data: gradesData, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const c1 = createMockChain({ eq: firstEq });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.gradebook.generateReportDigest({ teacherId, studentName: "Budi" });
    expect(res.summary).toBeDefined();
    expect(res.overallAssessment).toBe("GOOD");
  });

  it("generateReportDigest throws NOT_FOUND when no grades", async () => {
    const c1 = createMockChain({ eq: { data: [], error: null } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    await expect(caller.gradebook.generateReportDigest({ teacherId, studentName: "Unknown" })).rejects.toThrow();
  });
});

describe("documentRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create inserts document", async () => {
    const c1 = createMockChain({ single: { data: { id: teacherId }, error: null } });
    const c2 = createMockChain({ single: { data: { id: docId, title: "Doc 1", type: "materi" }, error: null } });
    mockFromSequence(c1, c2);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.document.create({
      teacherId,
      title: "Doc 1",
      type: "materi",
      subject: "Biologi",
      gradeLevel: "7",
      content: "Content here",
    });
    expect(res.id).toBe(docId);
  });

  it("listByTeacher returns documents", async () => {
    const docsData = [
      { id: docId, title: "Doc 1", type: "materi", subject: "Biologi", grade_level: "7", content: "Content", created_at: new Date().toISOString() },
    ];

    const c1 = createMockChain({ order: { data: docsData, error: null } });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.document.listByTeacher({ teacherId });
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Doc 1");
  });

  it("delete removes document", async () => {
    const secondEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    const deleteFn = vi.fn().mockReturnValue({ eq: firstEq });
    const c1 = createMockChain({ delete: deleteFn });
    mockFromSequence(c1);

    const caller = appRouter.createCaller({} as any);
    const res = await caller.document.delete({ id: docId, teacherId });
    expect(res.success).toBe(true);
  });
});
