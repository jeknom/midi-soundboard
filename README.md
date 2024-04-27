# MIDI Soundboard

So you have a MIDI board and would like to use it as a soundboard? Well, this is just the thing for you.

<img src="./logo.webp" alt='Logo with cartoony MIDI keyboard in it' width="300" />

## Setup

1. Download repo
2. Go to repo dir
3. Run `yarn install`
5. Create folder with sound files in it
6. Create `.env` file in the repo folder and fill in the following:

```.env
# Path to the folder you just created with all the sound files in it
ASSETS_PATH=/Your/Path/To/Sound/Files

# Adjust volume 0 - 1 (this only works on OSX at the moment 😅)
VOLUME = 0.1

# How often you can play sounds in milliseconds
RETRIGGER_DELAY_MS = 200

# How long you need to press to bind a key
REBIND_KEY_PRESS_AFTER_SECONDS = 3

# How many sounds can be played simultaneously, oldest will cease to play
MAX_PROCESS_HISTORY = 5
```

## Usage

1. Open terminal and run `yarn start`
2. Wait for the app to signal that it's ready for input
3. Click a key on your MIDI board for 3 seconds, release, bind a sound (works for rebind too)
4. Click the key again to play the sound

## Good to know

- You can cancel binding by hitting ESC
- The app saves your bindings in `save.json`
- I've only tested the app with .mp3 files, others could work as well