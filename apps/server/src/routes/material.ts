import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { generateMaterialWithLLM } from "../lib/llm.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { z } from "zod";

export const materialRouter = router({
  generate: publicProcedure
    .input(z.object({ topic: z.string().min(3) }))
    .mutation(async ({ input }) => {
      try {
        const material = await generateMaterialWithLLM(input.topic);
        return material;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menyusun materi pembelajaran: ${err.message}`,
        });
      }
    }),

  save: publicProcedure
    .input(
      z.object({
        teacherId: z.string().uuid(),
        title: z.string().min(1),
        subject: z.string().min(1),
        gradeLevel: z.string().min(1),
        summary: z.string().min(1),
        keyPoints: z.array(z.string()),
        explanation: z.string().min(1),
        interactiveActivity: z.string().optional().default(""),
        accessCode: z.string().min(4).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", input.teacherId).single();
      if (!existingProfile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(input.teacherId);
        const email = authUser?.user?.email || `pengajar_${input.teacherId.slice(0, 6)}@semai.id`;
        const name = authUser?.user?.user_metadata?.name || email.split("@")[0];
        await supabase.from("profiles").upsert({ id: input.teacherId, email, name, role: "teacher" });
      }

      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = input.accessCode?.toUpperCase() || "";
      if (code.length < 4) {
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data, error } = await supabase
        .from("materials")
        .insert({
          teacher_id: input.teacherId,
          title: input.title,
          subject: input.subject,
          grade_level: input.gradeLevel,
          access_code: code,
          content: {
            summary: input.summary,
            keyPoints: input.keyPoints,
            explanation: input.explanation,
            interactiveActivity: input.interactiveActivity,
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

  getByCode: publicProcedure
    .input(z.object({ code: z.string().min(4).max(10) }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("access_code", input.code.toUpperCase())
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Materi tidak ditemukan dengan kode tersebut" });
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
