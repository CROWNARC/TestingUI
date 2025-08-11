"use client"

import { useEffect, useRef, useState } from "react"
import {
  getEpisodeDetails,
  getAnimeDetails,
  getImageUrl,
  type TmdbEpisode,
  type TmdbTvShow,
  getSeasonDetails,
  type TmdbSeasonDetails,
} from "@/lib/tmdb"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Maximize, Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ShareButton } from "@/components/share-button"

interface VideoPlayerPageProps {
  params: {
    id: string
    seasonNumber: string
    episodeNumber: string
  }
}

export default function VideoPlayerPage({ params }: VideoPlayerPageProps) {
  const animeId = Number.parseInt(params.id)
  const seasonNumber = Number.parseInt(params.seasonNumber)
  const episodeNumber = Number.parseInt(params.episodeNumber)

  const [anime, setAnime] = useState<TmdbTvShow | null>(null)
  const [episode, setEpisode] = useState<TmdbEpisode | null>(null)
  const [currentSeasonEpisodes, setCurrentSeasonEpisodes] = useState<TmdbEpisode[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock video URLs for demonstration
  const mockVideoUrls: { [key: string]: string } = {
    "123249-1-1": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // My Dress-Up Darling S1E1
    "85937-1-1": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // Demon Slayer S1E1
    "1429-1-1": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", // Attack on Titan S1E1
    // Add more mock URLs as needed for other episodes
  }

  const currentVideoUrl = mockVideoUrls[`${animeId}-${seasonNumber}-${episodeNumber}`] || null

  useEffect(() => {
    const fetchAnimeAndEpisode = async () => {
      const fetchedAnime = await getAnimeDetails(animeId)
      setAnime(fetchedAnime)

      const fetchedEpisode = await getEpisodeDetails(animeId, seasonNumber, episodeNumber)
      setEpisode(fetchedEpisode)

      const fetchedSeasonDetails: TmdbSeasonDetails | null = await getSeasonDetails(animeId, seasonNumber)
      setCurrentSeasonEpisodes(fetchedSeasonDetails?.episodes || [])
    }
    fetchAnimeAndEpisode()
  }, [animeId, seasonNumber, episodeNumber])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume
      video.muted = isMuted

      const handleTimeUpdate = () => setCurrentTime(video.currentTime)
      const handleLoadedMetadata = () => setDuration(video.duration)
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => setIsPlaying(false)

      video.addEventListener("timeupdate", handleTimeUpdate)
      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("play", handlePlay)
      video.addEventListener("pause", handlePause)
      video.addEventListener("ended", handleEnded)

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("play", handlePlay)
        video.removeEventListener("pause", handlePause)
        video.removeEventListener("ended", handleEnded)
      }
    }
  }, [volume, isMuted])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      if (newVolume > 0) setIsMuted(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        video.requestFullscreen()
      }
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const currentEpisodeTitle = episode?.name || `Episode ${episodeNumber}`
  const currentAnimeTitle = anime?.name || "Loading Anime..."

  // Determine previous and next episode links based on fetched episodes
  const currentEpisodeIndex = currentSeasonEpisodes.findIndex((ep) => ep.episode_number === episodeNumber)
  const prevEpisode = currentEpisodeIndex > 0 ? currentSeasonEpisodes[currentEpisodeIndex - 1] : null
  const nextEpisode =
    currentEpisodeIndex < currentSeasonEpisodes.length - 1 ? currentSeasonEpisodes[currentEpisodeIndex + 1] : null

  const prevEpisodeLink = prevEpisode
    ? `/anime/${animeId}/season/${prevEpisode.season_number}/episode/${prevEpisode.episode_number}`
    : null
  const nextEpisodeLink = nextEpisode
    ? `/anime/${animeId}/season/${nextEpisode.season_number}/episode/${nextEpisode.episode_number}`
    : null

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href={`/anime/${animeId}`} className="text-primary hover:underline">
            &larr; Back to {currentAnimeTitle}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-2">{currentEpisodeTitle}</h1>
          <p className="text-muted-foreground text-lg">
            {currentAnimeTitle} - Season {seasonNumber}
          </p>
        </div>

        {/* Video Player Section */}
        <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-lg aspect-video shadow-xl">
          {currentVideoUrl ? (
            <video ref={videoRef} className="w-full h-full bg-black" crossOrigin="anonymous">
              <source src={currentVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/50 text-white text-2xl">
              No video source available.
            </div>
          )}

          {currentVideoUrl && (
            <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-b from-transparent to-black/70 p-3 pt-0">
              {/* Progress Bar */}
              <Slider
                className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-primary [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-primary [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
              />
              {/* Controls */}
              <div className="flex items-center gap-3 text-white [&_svg]:text-white">
                <Button size="icon" variant="ghost" className="w-9 h-9 hover:bg-white/20" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
                </Button>
                <Button size="icon" variant="ghost" className="w-9 h-9 hover:bg-white/20" onClick={() => skip(-10)}>
                  <SkipBack className="w-6 h-6 fill-white" />
                </Button>
                <Button size="icon" variant="ghost" className="w-9 h-9 hover:bg-white/20" onClick={() => skip(10)}>
                  <SkipForward className="w-6 h-6 fill-white" />
                </Button>
                <Button size="icon" variant="ghost" className="w-9 h-9 hover:bg-white/20" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
                <Slider
                  className="w-24 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:transition-transform"
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                />
                <div className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto w-9 h-9 hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Episode Details and Navigation */}
        <section className="mt-8 grid md:grid-cols-[1fr_300px] gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Episode Overview</h2>
            <p className="text-muted-foreground mb-4">
              {episode?.overview || "No overview available for this episode."}
            </p>
            <div className="flex gap-4 mb-6">
              {prevEpisodeLink && (
                <Link href={prevEpisodeLink}>
                  <Button className="glass-effect">
                    <SkipBack className="mr-2 h-4 w-4" /> Previous Episode
                  </Button>
                </Link>
              )}
              {nextEpisodeLink && (
                <Link href={nextEpisodeLink}>
                  <Button className="glass-effect">
                    Next Episode <SkipForward className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <ShareButton
              link={typeof window !== "undefined" ? window.location.href : ""}
              title={`${currentAnimeTitle} - ${currentEpisodeTitle}`}
            />
          </div>

          {/* Episode List for current anime */}
          <div className="glass-effect p-6 rounded-lg max-h-[600px] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">More Episodes (Season {seasonNumber})</h3>
            {currentSeasonEpisodes.length === 0 ? (
              <p className="text-muted-foreground">No episodes found for this season.</p>
            ) : (
              <div className="grid gap-2">
                {currentSeasonEpisodes.map((ep) => {
                  const isActive = ep.episode_number === episodeNumber
                  return (
                    <Link
                      key={`ep-${ep.season_number}-${ep.episode_number}`}
                      href={`/anime/${animeId}/season/${ep.season_number}/episode/${ep.episode_number}`}
                      className={`flex items-center gap-3 p-3 rounded-md hover:bg-white/10 transition-colors duration-200 ${isActive ? "bg-primary/20" : ""}`}
                    >
                      <Image
                        src={
                          getImageUrl(ep.still_path, "w300") ||
                          "/placeholder.svg?height=45&width=80&query=episode-thumbnail"
                        }
                        alt={ep.name || `Episode ${ep.episode_number} thumbnail`}
                        width={80}
                        height={45}
                        className="rounded-md object-cover aspect-video"
                      />
                      <div>
                        <div className="font-medium line-clamp-1">
                          E{ep.episode_number}: {ep.name || `Episode ${ep.episode_number}`}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {ep.overview || "No description available."}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-muted-foreground border-t border-border glass-effect">
        <p>&copy; {new Date().getFullYear()} Anime Stream. All rights reserved.</p>
      </footer>
    </div>
  )
}
