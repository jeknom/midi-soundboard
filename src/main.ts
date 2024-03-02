import midi from 'midi';
import { exec } from 'child_process'
import dotenv from 'dotenv'
import { Config, ConfigSchema } from './types/config';
import { isExistingFile } from './utils/isExistingFile';
import { writeJsonFile } from './utils/writeJsonFile';
import { UserSave, UserSaveSchema } from './types/bindings';
import { readJsonFile } from './utils/readJsonFile';
import { listFiles } from './utils/listFiles';
import os from 'os'
import terminalkit from 'terminal-kit'

const term = terminalkit.terminal

const MIDI_STATUS_CODE_KEY_DOWN = 144
const USER_SAVE_FILE_NAME = 'save.json'
const USER_SAVE_FILE_PATH = `./${USER_SAVE_FILE_NAME}`

let donotplay = false
let save: UserSave | null = null

dotenv.config()

// Load data
const config = ConfigSchema.safeParse({
    ...process.env,
    VOLUME: parseFloat(process.env.VOLUME as string),
    RETRIGGER_DELAY_MS: parseInt(process.env.RETRIGGER_DELAY_MS as string)
})
if (!config.success) {
    console.error('Invalid configuration!')
    throw new Error(config.error.message)
}

const input = new midi.Input();
input.getPortCount();
input.getPortName(0);

input.on('message', async (_, [status, key]) => {
    if (donotplay || status !== MIDI_STATUS_CODE_KEY_DOWN) {
        return
    }

    if (save === null) {
        save = await loadUserSaveFile()
    }

    const pressedKey = key.toString()

    const matchingBind = save?.bindings.find(b => b.key === pressedKey)
    if (matchingBind) {
        donotplay = true
        setTimeout(() => donotplay = false, config.data.RETRIGGER_DELAY_MS)
        const filePath = matchingBind.filePath
        const filename = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length)
        term.cyan(`Key ${pressedKey} pressed, playing `)(filename)('\n')
        let command = ''
        switch (os.platform()) {
            case 'darwin': // OSX
                command = `afplay -v ${config.data.VOLUME} "${matchingBind.filePath}"`
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
        term().yellow('No matching bind for key')(` ${pressedKey} `).yellow(', select it!\n')
        await bindUnassignedKey(pressedKey, config.data)
    }
});

input.openPort(0);
input.ignoreTypes(false, false, false);

async function loadUserSaveFile() {
    const userSaveExists = await isExistingFile(USER_SAVE_FILE_PATH)
    if (!userSaveExists) {
        const emptySave: UserSave = {
            bindings: []
        }
        writeJsonFile(USER_SAVE_FILE_PATH, emptySave)
    }

    const savedFile = await readJsonFile(USER_SAVE_FILE_PATH)
    const parsed = UserSaveSchema.safeParse(savedFile)
    
    if (!parsed.success) {
        console.error('User save is corrupt!')
        throw new Error(parsed.error.message)
    }

    return parsed.data
}

async function bindUnassignedKey(key: string, config: Config) {
    donotplay = true
    const filenames = await listFiles(config.ASSETS_PATH)
    const selected = await new Promise((resolve, reject) => {
        term.gridMenu(filenames, (err, res) => {
            if (err) {
                reject(err)
            }

            resolve(filenames[res.selectedIndex])
        })
    })

    const newUserSave: UserSave = {
        ...save,
        bindings: [
            ...save?.bindings ?? [],
            { key, filePath: `${config.ASSETS_PATH}/${selected}` }
        ]
    }

    await updateSave(newUserSave)
    console.info('New key bound!')
    donotplay = false
}

async function updateSave(newSave: UserSave) {
    await writeJsonFile(USER_SAVE_FILE_PATH, newSave)
    save = await loadUserSaveFile()
}