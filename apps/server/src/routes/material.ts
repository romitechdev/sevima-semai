import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { generateMaterialWithLLM } from "../lib/llm.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { z } from "zod";

function ensureProfile(supabase: ReturnType<typeof getSupabaseAdmin>, teacherId: string) {
  return (async () => {
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", teacherId).single();
    if (existingProfile) return;
    const { data: authUser } = await supabase.auth.admin.getUserById(teacherId);
    const email = authUser?.user?.email || `pengajar_${teacherId.slice(0, 6)}@semai.id`;
    const name = authUser?.user?.user_metadata?.name || email.split("@")[0];
    await supabase.from("profiles").upsert({ id: teacherId, email, name, role: "teacher" });
  })();
}

export const materialRouter = router({
  // Generates material with AI AND saves it to the teacher's library in one step.
  // The material is immediately visible to students via the landing page list.
  generate: publicProcedure
    .input(z.object({ teacherId: z.string().uuid(), topic: z.string().min(3) }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let material: Awaited<ReturnType<typeof generateMaterialWithLLM>>;
      try {
        material = await generateMaterialWithLLM(input.topic);
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menyusun materi pembelajaran: ${err.message}`,
        });
      }

      await ensureProfile(supabase, input.teacherId);

      const { data, error } = await supabase
        .from("materials")
        .insert({
          teacher_id: input.teacherId,
          title: material.title,
          subject: material.subject,
          grade_level: material.gradeLevel,
          content: {
            summary: material.summary,
            keyPoints: material.keyPoints,
            explanation: material.explanation,
            interactiveActivity: material.interactiveActivity,
          },
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal menyimpan materi: ${error?.message}` });
      }
      return data;
    }),

  listByTeacher: publicProcedure
    .input(z.object({ teacherId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("teacher_id", input.teacherId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  // Public list for the student landing page: all shared materials, newest first.
  listShared: publicProcedure.query(async () => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("materials")
      .select("id, title, subject, grade_level, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
    return data || [];
  }),

  getById: publicProcedure
    .input(z.object({ materialId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", input.materialId)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Materi tidak ditemukan" });
      }
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ materialId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase.from("materials").delete().eq("id", input.materialId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal menghapus materi: ${error.message}` });
      }
      return { deleted: true };
    }),
});
