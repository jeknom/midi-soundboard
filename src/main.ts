import midi from 'midi';
import Soundboard from './Soundboard';
import { error, info } from './utils/log';
import { MIDI_STATUS_CODE_KEY_DOWN, MIDI_STATUS_CODE_KEY_UP } from './constants/MIDI_STATUS_CODE';

async function main() {
    const board = new Soundboard()
    const input = new midi.Input();
    const availableDevicesCount = input.getPortCount();
    
    if (availableDevicesCount === 0) {
        error('No MIDI devices connected, prease connect a device and run again.')
        process.exit(1)
    }

    const portName = input.getPortName(0);
    input.openPort(0);
    input.ignoreTypes(false, false, false);
    
    info(`MIDI device ${portName} detected`)

    await board.waitForReady()
    
    input.on('message', async (_, [status, key]) => {
        switch (status) {
            case MIDI_STATUS_CODE_KEY_DOWN:
                await board.handleKeyDown(key)
                break
            case MIDI_STATUS_CODE_KEY_UP:
                await board.handleKeyUp(key)
                break
        }
    });
}

main()