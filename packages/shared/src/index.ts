import { z } from "zod";

export const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(100),
  gradeLevel: z.string().min(1).max(50),
  questions: z
    .array(
      z.object({
        text: z.string().min(1).max(500),
        options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
        correctIndex: z.number().int().min(0).max(3),
      })
    )
    .min(1)
    .max(50),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const submitAnswerSchema = z.object({
  quizCode: z.string().length(6),
  studentName: z.string().min(1).max(100),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedIndex: z.number().int().min(0).max(3),
    })
  ),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const getQuizByCodeSchema = z.object({
  code: z.string().length(6),
});

export type GetQuizByCodeInput = z.infer<typeof getQuizByCodeSchema>;
