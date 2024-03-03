import { terminal } from "terminal-kit"

export function info(message: string) {
    terminal.cyan(`💡 ${message}\n`)
}

export function warning(message: string) {
    terminal.yellow(`😬 ${message}\n`)
}

export function error(message: string) {
    terminal.red(`🤬 ${message}\n`)
}