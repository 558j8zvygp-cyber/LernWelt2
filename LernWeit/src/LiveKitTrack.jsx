import { useEffect, useRef } from 'react'

export default function LiveKitTrack({ track, video = false, onPlaybackBlocked }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!track || !containerRef.current) return undefined
    const element = track.attach()
    element.autoplay = true
    element.playsInline = true
    element.muted = false
    containerRef.current.appendChild(element)
    const playback = element.play()
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => onPlaybackBlocked?.(true))
    } else {
      onPlaybackBlocked?.(false)
    }
    return () => {
      track.detach(element)
      element.remove()
    }
  }, [onPlaybackBlocked, track])

  return <div ref={containerRef} className={video ? 'livekit-video-track' : 'livekit-audio-track'} />
}
