import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { generateStudentHolisticReportWithLLM } from "../lib/llm.js";
import { z } from "zod";

export const gradebookRouter = router({
  record: publicProcedure
    .input(
      z.object({
        teacherId: z.string().uuid(),
        studentName: z.string().min(1),
        sourceType: z.enum(["KUIS", "ESAI", "UNJUK_KERJA", "P5"]),
        title: z.string().min(1),
        score: z.number().min(0).max(100),
        maxScore: z.number().default(100),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      // Ensure teacher profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", input.teacherId).single();
      if (!existingProfile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(input.teacherId);
        const email = authUser?.user?.email || `guru_${input.teacherId.slice(0, 6)}@semai.id`;
        const name = authUser?.user?.user_metadata?.name || email.split("@")[0];
        await supabase.from("profiles").upsert({
          id: input.teacherId,
          email,
          name,
          role: "teacher",
        });
      }

      const { data, error } = await supabase
        .from("student_grades")
        .insert({
          teacher_id: input.teacherId,
          student_name: input.studentName,
          source_type: input.sourceType,
          title: input.title,
          score: input.score,
          max_score: input.maxScore,
          feedback: input.feedback,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mencatat nilai terintegrasi: ${error?.message}`,
        });
      }

      return data;
    }),

  listByTeacher: publicProcedure
    .input(z.object({ teacherId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("student_grades")
        .select("*")
        .eq("teacher_id", input.teacherId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const allGrades = data || [];
      const studentMap = new Map<string, any[]>();

      for (const g of allGrades) {
        if (!studentMap.has(g.student_name)) {
          studentMap.set(g.student_name, []);
        }
        studentMap.get(g.student_name)!.push(g);
      }

      const students = Array.from(studentMap.entries()).map(([name, grades]) => {
        const totalScore = grades.reduce((acc, curr) => acc + (curr.score / curr.max_score) * 100, 0);
        const avgScore = Math.round(totalScore / grades.length);
        return {
          studentName: name,
          gradesCount: grades.length,
          avgScore,
          grades,
        };
      });

      return {
        allGrades,
        students,
      };
    }),

  generateReportDigest: publicProcedure
    .input(z.object({ teacherId: z.string().uuid(), studentName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: grades } = await supabase
        .from("student_grades")
        .select("*")
        .eq("teacher_id", input.teacherId)
        .eq("student_name", input.studentName);

      if (!grades || grades.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Belum ada catatan nilai terintegrasi untuk siswa ${input.studentName}`,
        });
      }

      try {
        const report = await generateStudentHolisticReportWithLLM({
          studentName: input.studentName,
          grades,
        });
        return report;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menyusun narasi rapor AI: ${err.message}`,
        });
      }
    }),
});
