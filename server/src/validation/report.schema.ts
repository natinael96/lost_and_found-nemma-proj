import { z } from "zod";

export const CreateReportSchema = z.object({
  type: z.enum(["lost", "found"], {
    errorMap: () => ({ message: "Type must be either 'lost' or 'found'" }),
  }),
  title: z.string().min(1, "Item name is required").max(120).trim(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  color: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  location: z.string().min(1, "Location is required"),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),
  event_time: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  brand: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  distinguishing_features: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  status: z.enum(["open", "claimed", "closed"]).optional().default("open"),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(["open", "claimed", "closed"], {
    errorMap: () => ({ message: "Status must be open, claimed, or closed" }),
  }),
});

export const DismissMatchSchema = z.object({
  lost_report_id: z.number().int().positive(),
  found_report_id: z.number().int().positive(),
});

export const ConfirmMatchSchema = DismissMatchSchema;

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type DismissMatchInput = z.infer<typeof DismissMatchSchema>;
export type ConfirmMatchInput = z.infer<typeof ConfirmMatchSchema>;
