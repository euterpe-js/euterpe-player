export const MusicPlayer = (audio_context_i: AudioContext, audio_element_i: HTMLAudioElement, track_i: MediaElementAudioSourceNode, gain_i: GainNode, volume_i: number, current_song_path_i?: string) => {
    const audio_element: HTMLAudioElement = audio_element_i
    const audio_context: AudioContext = audio_context_i
    const track: MediaElementAudioSourceNode = track_i
    const gain: GainNode = gain_i
    let current_song_path: string | undefined = current_song_path_i
    let volume_cache: number = volume_i
    let volume: number = volume_i
    let is_playing: boolean = false
    let time = 0

    function mute_toggle() {
        if (gain.gain.value == 0) {
            volume = gain.gain.value = volume_cache
        } else {
            volume_cache = gain.gain.value
            volume = gain.gain.value = 0
        }
    }
    function mute() {
        volume_cache = gain.gain.value
        volume = gain.gain.value = 0
    }
    function unmute() {
        volume = gain.gain.value = volume_cache
    }
    function change_volume(volume_i: number) {
        volume = gain.gain.value = volume_i
    }
    /**
     * Safer seek_async. Normal seek will try to start the player even if the track hasn't started yet, or was previously suspended/closed
     */
    function try_seek_async(new_time: number) {
        return new Promise((resolve, reject) => {
            if (track.context.state == "closed" || track.context.state == "suspended") {
                is_playing = false
                reject("Can't seek - track not playing")
            }
            audio_element.currentTime = new_time
            audio_element.play().then((s) => resolve(s), (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
    * Can try to seek even if the audio context was suspended or closed. Best to use try_seek_async()
    */
    function seek_async(new_time: number) {
        return new Promise((resolve, reject) => {
            audio_element.currentTime = new_time
            audio_element.play().then((s) => resolve(s), (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
     * Unsafe, throws error if failed. Use try_seek_async or seek_async unless you don't care about the result.
     */
    function seek(new_time: number) {
        audio_element.currentTime = new_time
        audio_element.play().catch((e) => { throw e })
    }
    /**
    * Safer play_toggle_async. Normal play_toggle will try to start the player even if the track hasn't started yet, or was previously suspended/closed
    */
    function try_play_toggle_async() {
        return new Promise((resolve, reject) => {
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                reject("Context closed or suspended")
            }
            if (audio_element.paused) {
                audio_element.play().then((s) => {
                    is_playing = true
                    resolve(s)
                }, (r) => {
                    is_playing = false
                    reject(r)
                })
            } else {
                audio_element.pause()
                is_playing = false
                resolve(null)
            }
        })
    }
    /**
     * Can try to play even if the audio context was suspended or closed. Best to use try_play_toggle_async()
     */
    function play_toggle_async() {
        return new Promise((resolve, reject) => {
            if (audio_element.paused) {
                audio_element.play().then((s) => {
                    is_playing = true
                    resolve(s)
                }, (r) => {
                    is_playing = false
                    reject(r)
                })
            } else {
                audio_element.pause()
                is_playing = false
                resolve(null)
            }
        })
    }
    /**
    * Unsafe, throws error if failed. Use play_toggle_async or try_play_toggle_async unless you don't care about the result.
    */
    function play_toggle() {
        if (audio_element.paused) {
            is_playing = true
            audio_element.play().catch((r) => {
                is_playing = false
                throw r
            })
        } else {
            is_playing = false
            audio_element.pause()
        }
    }
    /**
    * Safer play_async. Normal play will try to start the player even if the track hasn't started yet, or was previously suspended/closed
    */
    function try_play_async() {
        return new Promise((resolve, reject) => {
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                reject("Context closed or suspended")
            }
            if (is_playing) resolve(null)
            audio_element.play().then((s) => {
                is_playing = true
                resolve(s)
            }, (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
     * Can try to play even if the audio context was suspended or closed. Best to use try_play_async()
     */
    function play_async() {
        return new Promise((resolve, reject) => {
            if (is_playing) resolve(null)
            audio_element.play().then((s) => {
                is_playing = true
                resolve(s)
            }, (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
    * Unsafe, throws error if failed. Use play_async or try_play_async unless you don't care about the result.
    */
    function play() {
        if (is_playing) return
        audio_element.play().catch((r) => {
            is_playing = false
            throw r
        })
    }
    /**
     * Safe technically. Even if audioContext is suspended or closed it will pretend that it paused.
    */
    function pause() {
        audio_element.pause()
        is_playing = false
    }
    /**
     * Will only load metadata of the upcoming song. Need to call try_play_async() afterwards to start the playback
     */
    function try_new_song_async(path: string) {
        return new Promise((resolve, reject) => {
            audio_element.src = current_song_path = path
            audio_element.addEventListener("canplay", function canplay_listener(s) {
                audio_element.removeEventListener("canplay", canplay_listener)
                resolve(s)
            })
            audio_element.addEventListener("error", function error_listener(e) {
                audio_element.removeEventListener("error", error_listener)
                reject(e)
            })
            audio_element.addEventListener("abort", function abort_listener(e) {
                audio_element.removeEventListener("abort", abort_listener)
                reject(e)
            })
            audio_element.addEventListener("stalled", function stalled_listener(e) {
                audio_element.removeEventListener("stalled", stalled_listener)
                reject(e)
            })
            is_playing = false
        })
    }
    /**
     * Won't tell if you if the song actually got loaded or if it failed. For a safer version use try_new_song_async() unless you don't care about the result
     */
    function new_song(path: string) {
        audio_element.src = current_song_path = path
    }
    //time_tick(callback())

    /*                  TODO: IMPLEMENT SUBSCRIBE/PUBLISH FOR TIME TICK                      */
}
/* For old browsers */
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext
    }
}
export function music_player_builder(audio_element: HTMLAudioElement) {
    let audio_context: AudioContext
    let gain: GainNode
    let track: MediaElementAudioSourceNode
    let current_song_path: string | undefined = undefined
    let time = 0
    let is_playing = false
    let volume_cache = 1
    let volume = 1

    let is_gain_connected = false
    /**
     * Creates a context and gain( Gets connected at the end )
     * will throw if audio_element is undefined (stupid vue setup amirite?)
     * will throw if user has not interacted with the page yet (Can't initiate AudioContext)
     */
    function start() {
        if (audio_element === undefined) throw Error("audio_element was undefined")
        //                                          ↓ For old browsers
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        try {
            audio_context = new AudioContext()
        } catch (error) {
            throw error
        }
        track = audio_context.createMediaElementSource(audio_element)
        gain = audio_context.createGain()
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {AnalyserNode}
     */
    function add_analyser() {
        const analyser = track.context.createAnalyser()
        track.connect(analyser)
        return analyser
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    function add_stereo_panner_node() {
        const panner = track.context.createStereoPanner()
        track.connect(panner)
        return panner
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    function add_wave_shaper_node() {
        const shaper = track.context.createWaveShaper()
        track.connect(shaper)
        return shaper
    }
    /**
     * In case you want to preload a resource as the player is constructed
     */
    function add_song_path(path: string) {
        current_song_path = path
    }
    /**
     * For additional trickery, you can connect your own node.
     */
    function connect_custom_node(node: AudioNode) {
        track.connect(node)
    }
    /**
     * Only use if you need to connect the gain before another node,
     * eg. if you want the analyser nodes output to be affected by user gain
     */
    function connect_gain() {
        track.connect(gain)
        is_gain_connected = true
    }
    /**
     * Finishes the build
     * @returns {MusicPlayer: () -> void}
     */
    function build() {
        if (!is_gain_connected) track.connect(gain)
        audio_element.preload = "metadata"
        return MusicPlayer(audio_context, audio_element, track, gain, volume, current_song_path)
    }
}