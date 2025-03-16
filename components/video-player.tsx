"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoPlayerProps {
  video: {
    _id: string
    title: string
    resolutions?: {
      "360p"?: string
      "720p"?: string
      "1080p"?: string
    }
  }
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [resolution, setResolution] = useState("original")
  const [isBuffering, setIsBuffering] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Available resolutions
  const availableResolutions = [
    { value: "original", label: "Auto" },
    ...(video.resolutions?.["360p"] ? [{ value: "360p", label: "360p" }] : []),
    ...(video.resolutions?.["720p"] ? [{ value: "720p", label: "720p" }] : []),
    ...(video.resolutions?.["1080p"] ? [{ value: "1080p", label: "1080p" }] : []),
  ]

  // Video source URL
  const videoSrc = `/api/videos/${video._id}/stream${resolution !== "original" ? `?resolution=${resolution}` : ""}`

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      const seekTime = pos * duration
      videoRef.current.currentTime = seekTime
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
    }
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Show/hide controls with timeout
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    setShowControls(true)

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  // Handle resolution change
  const handleResolutionChange = (value: string) => {
    // Store current time to resume after changing resolution
    const currentTimeBeforeChange = videoRef.current?.currentTime || 0
    setResolution(value)

    // After changing source, we'll need to seek to the previous position
    // This is handled in the onLoadedData event
    if (videoRef.current) {
      videoRef.current.dataset.resumeTime = currentTimeBeforeChange.toString()
    }
  }

  // Event listeners
  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onLoadedMetadata = () => setDuration(video.duration)
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onLoadedData = () => {
      setIsBuffering(false)
      // Resume playback at the stored time if changing resolution
      const resumeTime = video.dataset.resumeTime
      if (resumeTime) {
        video.currentTime = Number.parseFloat(resumeTime)
        delete video.dataset.resumeTime
        if (isPlaying) {
          video.play()
        }
      }
    }

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("volumechange", onVolumeChange)
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("playing", onPlaying)
    video.addEventListener("loadeddata", onLoadedData)
    document.addEventListener("fullscreenchange", onFullscreenChange)

    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("volumechange", onVolumeChange)
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("loadeddata", onLoadedData)
      document.removeEventListener("fullscreenchange", onFullscreenChange)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Mouse movement to show controls
  useEffect(() => {
    resetControlsTimeout()

    const handleMouseMove = () => {
      resetControlsTimeout()
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [isPlaying])

  return (
    <div
      ref={containerRef}
      className="video-player-container relative rounded-lg overflow-hidden aspect-video bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} src={videoSrc} className="w-full h-full" onClick={togglePlay} playsInline />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
          <div className="bg-black/30 rounded-full p-4">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}

      {showControls && (
        <div className="video-controls">
          <div ref={progressRef} className="progress-bar" onClick={handleSeek}>
            <div className="progress-filled" style={{ width: `${(currentTime / duration) * 100}%` }}>
              <div className="progress-handle"></div>
            </div>
          </div>

          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white">
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white">
              <SkipForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center ml-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            <div className="text-white text-sm ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="ml-auto flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={resolution} onValueChange={handleResolutionChange}>
                    {availableResolutions.map((res) => (
                      <DropdownMenuRadioItem key={res.value} value={res.value}>
                        {res.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

