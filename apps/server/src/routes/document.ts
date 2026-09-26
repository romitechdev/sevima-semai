import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../lib/trpc.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { z } from "zod";

export const documentRouter = router({
  create: publicProcedure
    .input(
      z.object({
        teacherId: z.string().uuid(),
        title: z.string().min(1),
        type: z.enum(["materi", "tugas"]),
        subject: z.string().min(1),
        gradeLevel: z.string().min(1),
        content: z.string().min(1),
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
        .from("documents")
        .insert({
          teacher_id: input.teacherId,
          title: input.title,
          type: input.type,
          subject: input.subject,
          grade_level: input.gradeLevel,
          content: input.content,
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menyimpan dokumentasi: ${error?.message}`,
        });
      }

      return data;
    }),

  listByTeacher: publicProcedure
    .input(z.object({ teacherId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("teacher_id", input.teacherId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data || [];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid(), teacherId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", input.id)
        .eq("teacher_id", input.teacherId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
