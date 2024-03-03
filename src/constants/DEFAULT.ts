import { UserSave } from "../types/bindings";
import { Config } from "../types/config";

export const DEFAULT_SAVE: UserSave = {
    bindings: []
}

export const DEFAULT_CONFIG: Config = {
    VOLUME: 1,
    ASSETS_PATH: '/',
    RETRIGGER_DELAY_MS: 200
}