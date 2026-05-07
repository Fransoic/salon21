export type SoundCue =
    | 'chip'
    | 'deal'
    | 'hit'
    | 'stand'
    | 'double'
    | 'split'
    | 'insurance'
    | 'declineInsurance'
    | 'surrender'
    | 'nextRound'
    | 'reset'
    | 'win'
    | 'loss'
    | 'push'
    | 'blackjack'

type ToneConfig = {
    frequency: number
    duration: number
    volume?: number
    delay?: number
    type?: OscillatorType
    detune?: number
    endFrequency?: number
}

let audioContext: AudioContext | null = null
let masterVolume = 0.7

function clampVolume(value: number) {
    return Math.max(0, Math.min(1, value))
}

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
        return null
    }

    audioContext ??= new window.AudioContext()
    return audioContext
}

function scheduleTone(context: AudioContext, config: ToneConfig) {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const start = context.currentTime + (config.delay ?? 0)
    const volume = (config.volume ?? 0.045) * masterVolume
    const type = config.type ?? 'triangle'

    oscillator.type = type
    oscillator.frequency.setValueAtTime(config.frequency, start)
    oscillator.detune.setValueAtTime(config.detune ?? 0, start)

    if (config.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, start + config.duration)
    }

    gainNode.gain.setValueAtTime(0.0001, start)
    gainNode.gain.linearRampToValueAtTime(volume, start + Math.min(0.02, config.duration / 3))
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + config.duration)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(start)
    oscillator.stop(start + config.duration + 0.02)
}

function scheduleCue(context: AudioContext, cue: SoundCue, delay = 0) {
    switch (cue) {
        case 'chip':
            scheduleTone(context, { frequency: 820, endFrequency: 620, duration: 0.06, volume: 0.03, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 1080, endFrequency: 900, duration: 0.03, volume: 0.018, delay: delay + 0.012, type: 'sine' })
            return
        case 'deal':
            scheduleTone(context, { frequency: 480, endFrequency: 620, duration: 0.08, volume: 0.035, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 560, endFrequency: 740, duration: 0.08, volume: 0.028, delay: delay + 0.06, type: 'triangle' })
            return
        case 'hit':
            scheduleTone(context, { frequency: 620, endFrequency: 760, duration: 0.07, volume: 0.032, delay, type: 'square' })
            return
        case 'stand':
            scheduleTone(context, { frequency: 440, endFrequency: 320, duration: 0.09, volume: 0.028, delay, type: 'triangle' })
            return
        case 'double':
            scheduleTone(context, { frequency: 460, endFrequency: 620, duration: 0.09, volume: 0.038, delay, type: 'square' })
            scheduleTone(context, { frequency: 690, endFrequency: 880, duration: 0.11, volume: 0.026, delay: delay + 0.04, type: 'triangle' })
            return
        case 'split':
            scheduleTone(context, { frequency: 560, endFrequency: 660, duration: 0.06, volume: 0.03, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 700, endFrequency: 820, duration: 0.06, volume: 0.025, delay: delay + 0.05, type: 'triangle' })
            return
        case 'insurance':
            scheduleTone(context, { frequency: 380, endFrequency: 520, duration: 0.12, volume: 0.03, delay, type: 'sine' })
            return
        case 'declineInsurance':
            scheduleTone(context, { frequency: 300, endFrequency: 260, duration: 0.07, volume: 0.02, delay, type: 'triangle' })
            return
        case 'surrender':
            scheduleTone(context, { frequency: 360, endFrequency: 180, duration: 0.16, volume: 0.03, delay, type: 'sawtooth' })
            return
        case 'nextRound':
            scheduleTone(context, { frequency: 420, endFrequency: 560, duration: 0.08, volume: 0.03, delay, type: 'triangle' })
            return
        case 'reset':
            scheduleTone(context, { frequency: 300, endFrequency: 200, duration: 0.12, volume: 0.025, delay, type: 'triangle' })
            return
        case 'win':
            scheduleTone(context, { frequency: 520, endFrequency: 660, duration: 0.12, volume: 0.032, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 660, endFrequency: 860, duration: 0.14, volume: 0.028, delay: delay + 0.09, type: 'triangle' })
            return
        case 'loss':
            scheduleTone(context, { frequency: 380, endFrequency: 240, duration: 0.16, volume: 0.032, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 260, endFrequency: 180, duration: 0.12, volume: 0.022, delay: delay + 0.08, type: 'sine' })
            return
        case 'push':
            scheduleTone(context, { frequency: 420, endFrequency: 420, duration: 0.08, volume: 0.022, delay, type: 'sine' })
            scheduleTone(context, { frequency: 520, endFrequency: 520, duration: 0.08, volume: 0.016, delay: delay + 0.05, type: 'sine' })
            return
        case 'blackjack':
            scheduleTone(context, { frequency: 520, endFrequency: 660, duration: 0.1, volume: 0.034, delay, type: 'triangle' })
            scheduleTone(context, { frequency: 660, endFrequency: 920, duration: 0.13, volume: 0.03, delay: delay + 0.08, type: 'triangle' })
            scheduleTone(context, { frequency: 880, endFrequency: 1180, duration: 0.18, volume: 0.024, delay: delay + 0.18, type: 'sine' })
    }
}

export function playSound(cue: SoundCue, delay = 0) {
    if (masterVolume <= 0) {
        return
    }

    const context = getAudioContext()

    if (!context) {
        return
    }

    const startPlayback = () => scheduleCue(context, cue, delay)

    if (context.state === 'suspended') {
        void context.resume().then(startPlayback).catch(() => undefined)
        return
    }

    startPlayback()
}

export function setSoundVolume(volume: number) {
    masterVolume = clampVolume(volume)
}

export function getSoundVolume() {
    return masterVolume
}