import { z } from "zod";

export const BindingSchema = z.object({
    key: z.string().min(1),
    filePath: z.string().min(1)
})

export const UserSaveSchema = z.object({
    bindings: BindingSchema.array()
})

export type UserSave = z.infer<typeof UserSaveSchema>