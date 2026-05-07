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
    attack?: number
    release?: number
    filterFrequency?: number
    filterQ?: number
    filterType?: BiquadFilterType
}

type NoiseConfig = {
    duration: number
    volume?: number
    delay?: number
    playbackRate?: number
    filterFrequency: number
    filterQ?: number
    filterType?: BiquadFilterType
    attack?: number
    release?: number
}

let audioContext: AudioContext | null = null
let masterVolume = 0.7
let outputNode: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function makeDriveCurve(amount: number) {
    const samples = 44_100
    const curve = new Float32Array(samples)

    for (let index = 0; index < samples; index += 1) {
        const input = (index * 2) / samples - 1
        curve[index] = ((Math.PI + amount) * input) / (Math.PI + amount * Math.abs(input))
    }

    return curve
}

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

function getOutputNode(context: AudioContext) {
    if (outputNode && outputNode.context === context) {
        return outputNode
    }

    const gainNode = context.createGain()
    const sparkle = context.createBiquadFilter()
    const drive = context.createWaveShaper()
    const compressor = context.createDynamicsCompressor()

    gainNode.gain.value = 1.08
    sparkle.type = 'highshelf'
    sparkle.frequency.value = 1800
    sparkle.gain.value = 4.5
    drive.curve = makeDriveCurve(18)
    drive.oversample = '4x'
    compressor.threshold.value = -24
    compressor.knee.value = 18
    compressor.ratio.value = 3.1
    compressor.attack.value = 0.002
    compressor.release.value = 0.16

    gainNode.connect(sparkle)
    sparkle.connect(drive)
    drive.connect(compressor)
    compressor.connect(context.destination)

    outputNode = gainNode
    return gainNode
}

function getNoiseBuffer(context: AudioContext) {
    if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
        return noiseBuffer
    }

    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const channel = buffer.getChannelData(0)

    for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1
    }

    noiseBuffer = buffer
    return buffer
}

function connectVoice(context: AudioContext, gainNode: GainNode, filterFrequency?: number, filterType: BiquadFilterType = 'lowpass', filterQ = 0.9) {
    if (!filterFrequency) {
        gainNode.connect(getOutputNode(context))
        return null
    }

    const filter = context.createBiquadFilter()
    filter.type = filterType
    filter.frequency.setValueAtTime(filterFrequency, context.currentTime)
    filter.Q.setValueAtTime(filterQ, context.currentTime)

    gainNode.connect(filter)
    filter.connect(getOutputNode(context))

    return filter
}

function shapeEnvelope(gainNode: GainNode, start: number, duration: number, peakVolume: number, attack = 0.008, release = 0.05) {
    const attackTime = Math.min(attack, Math.max(0.002, duration * 0.4))
    const releaseTime = Math.min(release, Math.max(0.02, duration * 0.75))
    const releaseStart = Math.max(start + attackTime, start + duration - releaseTime)
    const sustainLevel = peakVolume * 0.72

    gainNode.gain.cancelScheduledValues(start)
    gainNode.gain.setValueAtTime(0.0001, start)
    gainNode.gain.linearRampToValueAtTime(peakVolume, start + attackTime)
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustainLevel), releaseStart)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration)
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

    shapeEnvelope(gainNode, start, config.duration, volume, config.attack, config.release)
    connectVoice(context, gainNode, config.filterFrequency, config.filterType, config.filterQ)

    oscillator.connect(gainNode)

    oscillator.start(start)
    oscillator.stop(start + config.duration + 0.02)
}

function scheduleNoise(context: AudioContext, config: NoiseConfig) {
    const source = context.createBufferSource()
    const gainNode = context.createGain()
    const start = context.currentTime + (config.delay ?? 0)
    const volume = (config.volume ?? 0.02) * masterVolume

    source.buffer = getNoiseBuffer(context)
    source.playbackRate.setValueAtTime(config.playbackRate ?? 1, start)

    shapeEnvelope(gainNode, start, config.duration, volume, config.attack ?? 0.002, config.release ?? 0.03)
    connectVoice(context, gainNode, config.filterFrequency, config.filterType ?? 'bandpass', config.filterQ ?? 1.1)

    source.connect(gainNode)
    source.start(start)
    source.stop(start + config.duration + 0.02)
}

function scheduleCue(context: AudioContext, cue: SoundCue, delay = 0) {
    switch (cue) {
        case 'chip':
            scheduleNoise(context, { duration: 0.022, volume: 0.012, delay, filterFrequency: 1450, filterQ: 1.2, filterType: 'bandpass', attack: 0.0015, release: 0.016, playbackRate: 0.86 })
            scheduleTone(context, { frequency: 980, endFrequency: 760, duration: 0.034, volume: 0.01, delay, type: 'triangle', attack: 0.002, release: 0.022, filterFrequency: 1550, filterType: 'lowpass', filterQ: 0.9 })
            scheduleTone(context, { frequency: 640, endFrequency: 500, duration: 0.048, volume: 0.012, delay: delay + 0.002, type: 'sine', attack: 0.002, release: 0.03, filterFrequency: 1250, filterType: 'lowpass', filterQ: 0.8 })
            scheduleNoise(context, { duration: 0.016, volume: 0.007, delay: delay + 0.024, filterFrequency: 980, filterQ: 1.4, filterType: 'lowpass', attack: 0.0015, release: 0.012, playbackRate: 0.78 })
            scheduleTone(context, { frequency: 760, endFrequency: 580, duration: 0.028, volume: 0.007, delay: delay + 0.022, type: 'triangle', attack: 0.002, release: 0.018, filterFrequency: 1200, filterType: 'lowpass', filterQ: 1 })
            return
        case 'deal':
            scheduleNoise(context, { duration: 0.04, volume: 0.012, delay, filterFrequency: 1700, filterQ: 1.1, playbackRate: 0.95 })
            scheduleTone(context, { frequency: 360, endFrequency: 500, duration: 0.048, volume: 0.021, delay, type: 'triangle', attack: 0.0015, release: 0.026, filterFrequency: 2200, filterType: 'lowpass' })
            scheduleNoise(context, { duration: 0.04, volume: 0.01, delay: delay + 0.058, filterFrequency: 2100, filterQ: 1.15, playbackRate: 1.12 })
            scheduleTone(context, { frequency: 460, endFrequency: 620, duration: 0.048, volume: 0.018, delay: delay + 0.054, type: 'triangle', attack: 0.0015, release: 0.026, filterFrequency: 2400, filterType: 'lowpass' })
            return
        case 'hit':
            scheduleNoise(context, { duration: 0.024, volume: 0.011, delay, filterFrequency: 2500, filterQ: 2 })
            scheduleTone(context, { frequency: 700, endFrequency: 900, duration: 0.055, volume: 0.026, delay, type: 'square', attack: 0.0015, release: 0.022, filterFrequency: 3400, filterType: 'lowpass' })
            return
        case 'stand':
            scheduleTone(context, { frequency: 460, endFrequency: 320, duration: 0.095, volume: 0.027, delay, type: 'triangle', attack: 0.003, release: 0.05, filterFrequency: 1800, filterType: 'lowpass' })
            return
        case 'double':
            scheduleNoise(context, { duration: 0.03, volume: 0.01, delay, filterFrequency: 2800, filterQ: 1.7 })
            scheduleTone(context, { frequency: 500, endFrequency: 700, duration: 0.078, volume: 0.027, delay, type: 'square', attack: 0.002, release: 0.026, filterFrequency: 3000, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 780, endFrequency: 1060, duration: 0.11, volume: 0.022, delay: delay + 0.038, type: 'square', attack: 0.005, release: 0.04, filterFrequency: 3800, filterType: 'lowpass' })
            return
        case 'split':
            scheduleTone(context, { frequency: 560, endFrequency: 720, duration: 0.058, volume: 0.024, delay, type: 'triangle', attack: 0.002, release: 0.026, filterFrequency: 2600, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 860, endFrequency: 1120, duration: 0.058, volume: 0.02, delay: delay + 0.04, type: 'square', attack: 0.003, release: 0.026, filterFrequency: 3600, filterType: 'lowpass' })
            return
        case 'insurance':
            scheduleTone(context, { frequency: 420, endFrequency: 620, duration: 0.11, volume: 0.023, delay, type: 'sine', attack: 0.015, release: 0.05, filterFrequency: 2200, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 840, endFrequency: 1080, duration: 0.09, volume: 0.013, delay: delay + 0.028, type: 'triangle', attack: 0.01, release: 0.04, filterFrequency: 3200, filterType: 'lowpass' })
            return
        case 'declineInsurance':
            scheduleTone(context, { frequency: 340, endFrequency: 260, duration: 0.07, volume: 0.019, delay, type: 'triangle', attack: 0.003, release: 0.03, filterFrequency: 1600, filterType: 'lowpass' })
            return
        case 'surrender':
            scheduleNoise(context, { duration: 0.038, volume: 0.008, delay, filterFrequency: 1200, filterQ: 0.8, playbackRate: 0.88 })
            scheduleTone(context, { frequency: 360, endFrequency: 180, duration: 0.15, volume: 0.022, delay, type: 'sawtooth', attack: 0.006, release: 0.06, filterFrequency: 1300, filterType: 'lowpass' })
            return
        case 'nextRound':
            scheduleTone(context, { frequency: 500, endFrequency: 660, duration: 0.075, volume: 0.023, delay, type: 'triangle', attack: 0.003, release: 0.03, filterFrequency: 2400, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 760, endFrequency: 980, duration: 0.065, volume: 0.015, delay: delay + 0.04, type: 'square', attack: 0.004, release: 0.03, filterFrequency: 3600, filterType: 'lowpass' })
            return
        case 'reset':
            scheduleTone(context, { frequency: 320, endFrequency: 220, duration: 0.11, volume: 0.019, delay, type: 'triangle', attack: 0.004, release: 0.05, filterFrequency: 1500, filterType: 'lowpass' })
            return
        case 'win':
            scheduleTone(context, { frequency: 620, endFrequency: 780, duration: 0.1, volume: 0.026, delay, type: 'square', attack: 0.006, release: 0.035, filterFrequency: 3400, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 780, endFrequency: 980, duration: 0.11, volume: 0.021, delay: delay + 0.07, type: 'triangle', attack: 0.006, release: 0.04, filterFrequency: 3800, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 980, endFrequency: 1320, duration: 0.14, volume: 0.018, delay: delay + 0.14, type: 'sine', attack: 0.008, release: 0.05, filterFrequency: 4200, filterType: 'lowpass' })
            return
        case 'loss':
            scheduleTone(context, { frequency: 390, endFrequency: 250, duration: 0.15, volume: 0.024, delay, type: 'sawtooth', attack: 0.005, release: 0.06, filterFrequency: 1400, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 260, endFrequency: 180, duration: 0.12, volume: 0.015, delay: delay + 0.085, type: 'triangle', attack: 0.008, release: 0.05, filterFrequency: 1200, filterType: 'lowpass' })
            return
        case 'push':
            scheduleTone(context, { frequency: 440, endFrequency: 440, duration: 0.085, volume: 0.016, delay, type: 'triangle', attack: 0.008, release: 0.04, filterFrequency: 2200, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 560, endFrequency: 560, duration: 0.085, volume: 0.012, delay: delay + 0.04, type: 'triangle', attack: 0.008, release: 0.04, filterFrequency: 2600, filterType: 'lowpass' })
            return
        case 'blackjack':
            scheduleTone(context, { frequency: 660, endFrequency: 860, duration: 0.1, volume: 0.027, delay, type: 'square', attack: 0.006, release: 0.035, filterFrequency: 3600, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 860, endFrequency: 1140, duration: 0.11, volume: 0.023, delay: delay + 0.07, type: 'square', attack: 0.006, release: 0.04, filterFrequency: 4200, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 1140, endFrequency: 1480, duration: 0.15, volume: 0.02, delay: delay + 0.145, type: 'triangle', attack: 0.008, release: 0.05, filterFrequency: 4800, filterType: 'lowpass' })
            scheduleTone(context, { frequency: 1480, endFrequency: 1880, duration: 0.13, volume: 0.012, delay: delay + 0.235, type: 'sine', attack: 0.008, release: 0.05, filterFrequency: 5600, filterType: 'lowpass' })
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