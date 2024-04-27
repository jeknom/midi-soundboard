import { terminal } from "terminal-kit"
import { DEFAULT_CONFIG, DEFAULT_SAVE } from "./constants/DEFAULT"
import { USER_SAVE_FILE_PATH } from "./constants/FILE"
import { UserSave, UserSaveSchema } from "./types/bindings"
import { isExistingFile } from "./utils/isExistingFile"
import { readJsonFile } from "./utils/readJsonFile"
import { writeJsonFile } from "./utils/writeJsonFile"
import { Config, ConfigSchema } from "./types/config"
import os from 'os'
import { exec } from 'child_process'
import { listFiles } from "./utils/listFiles"
import { KeyPressMeta } from "./types/KeyPressMeta"
import { secondsDifference } from "./utils/secondsDifference"
import dotenv from 'dotenv'
import { error, info, warning } from "./utils/log"

const MEMORY_SAVE_FILE_UNAVAILABLE_ERROR = 'In memory save was unexpectedly not available'
const REBIND_KEY_PRESS_AFTER_SECONDS = 5

class Soundboard {
    private save: UserSave | null = null
    private config: Config = DEFAULT_CONFIG
    
    private lastKeyPressMeta: KeyPressMeta | null = null
    private donotplay = false

    constructor() {
        dotenv.config()

        const config = ConfigSchema.safeParse({
            ...process.env,
            VOLUME: parseFloat(process.env.VOLUME as string),
            RETRIGGER_DELAY_MS: parseInt(process.env.RETRIGGER_DELAY_MS as string)
        })

        if (config.success) {
            this.config = config.data
        } else {
            this.expectedExit('Invalid configuration, please check your .env file!')
        }
        
        this.loadSave()
    }

    public async waitForReady() {
        let ready = false
        
        while (!ready) {
            await new Promise<void>(resolve => {
                info('Waiting for the Soundboard to get ready...')
                if (this.save !== null) {
                    ready = true
                    resolve()
                } else {
                    setTimeout(resolve, 1000)
                }
            })
        }

        info('Soundboard is ready to receive input')
    }

    public async handleKeyDown(key: number) {
        this.lastKeyPressMeta = {
            key,
            time: new Date()
        }

        if (this.donotplay) {
            return
        }

        if (this.save === null) {
            this.unexpectedExit(MEMORY_SAVE_FILE_UNAVAILABLE_ERROR)
        }

        const pressedKey = key.toString()
        const matchingBind = this.save?.bindings.find(b => b.key === pressedKey)
        
        if (matchingBind) {
            this.donotplay = true
            
            setTimeout(() => this.donotplay = false, this.config.RETRIGGER_DELAY_MS)
            
            const filePath = matchingBind.filePath
            const filename = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length)
            
            info(`Key ${pressedKey} pressed, playing ${filename}.`)
            
            let command = ''
            switch (os.platform()) {
                case 'darwin': // OSX
                    command = `afplay -v ${this.config.VOLUME} "${matchingBind.filePath}"`
                    break
                case 'win32': // Windows
                    command = `powershell -c (New-Object Media.SoundPlayer "${filePath}").PlaySync();`;
                    break
                case 'linux': // Linux
                    command = `mpg123 "${filePath}"`;
                    break
                default:
                    console.error('Unsupported OS.');
                    process.exit(1);
            }

            exec(command, (error) => {
                if (error) {
                console.error(`exec error: ${error}`);
                return;
                }
            })
        } else {
            info(`No matching bind for key ${pressedKey}, select a clip for it.`)
    
            await this.bindKey(pressedKey)
        }
    }

    public async handleKeyUp(key: number) {
        if (this.lastKeyPressMeta === null) {
            return
        }

        const isSameKey = key === this.lastKeyPressMeta.key
        const timeSinceLastPressSeconds = secondsDifference(this.lastKeyPressMeta.time, new Date())

        if (isSameKey && timeSinceLastPressSeconds >= REBIND_KEY_PRESS_AFTER_SECONDS) {
            await this.bindKey(key.toString())
        } else {
            info(`You pressed the key for ${timeSinceLastPressSeconds} seconds, press for ${REBIND_KEY_PRESS_AFTER_SECONDS} seconds to rebind.`)
        }
    }

    private async bindKey(key: string) {
        this.donotplay = true
        const filenames = await listFiles(this.config.ASSETS_PATH)
        
        try {
            const selected = await new Promise((resolve, reject) => {
                console.log('Hit escape, to cancel binding')
                terminal.gridMenu(filenames, { exitOnUnexpectedKey: true }, (err, res) => {
                    if (err || res.selectedIndex === undefined) {
                        reject(err)
                    }
        
                    resolve(filenames[res.selectedIndex])
                })
            })

            const newClip = { key, filePath: `${this.config.ASSETS_PATH}/${selected}` }
            const bindings = this.save?.bindings ?? []
            
            let keyIndex = bindings.findIndex(b => b.key === key)
            if (keyIndex !== -1) {
                bindings[keyIndex] = newClip
            } else {
                bindings.push(newClip)
            }
        
            const newUserSave: UserSave = {
                ...this.save,
                bindings,
            }
        
            await this.updateSave(newUserSave)
        } catch (error) {
            info('Binding got cancelled')
        }

        this.donotplay = false
    }

    private async loadSave() {
        const userSaveExists = await isExistingFile(USER_SAVE_FILE_PATH)
        
        if (!userSaveExists) {
            info('Looks like you have no save file, creating a new one...')
            writeJsonFile(USER_SAVE_FILE_PATH, DEFAULT_SAVE)
        } else {
            info('Loading save file from your disk...')
        }

        const savedFile = await readJsonFile(USER_SAVE_FILE_PATH)
        const parsed = UserSaveSchema.safeParse(savedFile)
        
        if (!parsed.success) {
            error('Your save file seems to be corrupt, either delete it or fix it')
            throw new Error(parsed.error.message)
        }

        this.save = parsed.data
    }

    private async updateSave(save: UserSave) {
        await writeJsonFile(USER_SAVE_FILE_PATH, save)
        info('Your save file has been saved on disk')
        await this.loadSave()
    }

    private expectedExit(reason: string) {
        warning(reason)
        process.exit(0)
    }

    private unexpectedExit(reason: string) {
        error(`There seems to be a bug: ${reason}`)
        process.exit(1)
    }
}

export default Soundboard