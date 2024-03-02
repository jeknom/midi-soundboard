import { z } from "zod";

export const ConfigSchema = z.object({
    VOLUME: z.number().min(0).max(1),
    ASSETS_PATH: z.string().min(1),
    RETRIGGER_DELAY_MS: z.number().min(0)
})

export type Config = z.infer<typeof ConfigSchema>