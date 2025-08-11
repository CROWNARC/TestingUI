"use client"

import { useEffect, useState } from "react"
import {
  getAnimeDetails,
  getImageUrl,
  getSeasonDetails,
  type TmdbTvShow,
  type TmdbEpisode,
  type TmdbSeasonDetails,
} from "@/lib/tmdb"
import Image from "next/image"
import Link from "next/link"
import { ShareButton } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnimeDetailPageProps {
  params: {
    id: string
  }
}

export default function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const animeId = Number.parseInt(params.id)
  const [anime, setAnime] = useState<TmdbTvShow | null>(null)
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<string | null>(null)
  const [selectedSeasonEpisodes, setSelectedSeasonEpisodes] = useState<TmdbEpisode[]>([])
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true)

  useEffect(() => {
    const fetchAnime = async () => {
      const fetchedAnime = await getAnimeDetails(animeId)
      setAnime(fetchedAnime)

      if (fetchedAnime && fetchedAnime.seasons.length > 0) {
        // Filter out "Specials" or Season 0 and sort
        const validSeasons = fetchedAnime.seasons
          .filter((s) => s.season_number > 0)
          .sort((a, b) => a.season_number - b.season_number)

        if (validSeasons.length > 0) {
          // Set the first valid season as default
          setSelectedSeasonNumber(validSeasons[0].season_number.toString())
        }
      }
    }
    fetchAnime()
  }, [animeId])

  useEffect(() => {
    const fetchEpisodesForSelectedSeason = async () => {
      if (anime && selectedSeasonNumber) {
        setIsLoadingEpisodes(true)
        const seasonDetails: TmdbSeasonDetails | null = await getSeasonDetails(
          anime.id,
          Number.parseInt(selectedSeasonNumber),
        )
        setSelectedSeasonEpisodes(seasonDetails?.episodes || [])
        setIsLoadingEpisodes(false)
      }
    }
    fetchEpisodesForSelectedSeason()
  }, [anime, selectedSeasonNumber])

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <p className="text-xl">Loading anime details...</p>
      </div>
    )
  }

  const sortedSeasons = anime.seasons
    .filter((season) => season.season_number > 0) // Filter out "Specials" or Season 0
    .sort((a, b) => a.season_number - b.season_number)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero/Banner Section */}
      <section
        className="relative w-full h-[40vh] md:h-[50vh] bg-cover bg-center flex items-end p-8 md:p-12"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%), url(${getImageUrl(anime.backdrop_path, "original")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-4xl text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{anime.name}</h1>
          <p className="text-lg text-muted-foreground mb-4 drop-shadow-md">
            {anime.genres.map((g) => g.name).join(" • ")}
          </p>
          <div className="flex items-center gap-4">
            {selectedSeasonNumber && selectedSeasonEpisodes.length > 0 && (
              <Link
                href={`/anime/${anime.id}/season/${selectedSeasonNumber}/episode/${selectedSeasonEpisodes[0].episode_number}`}
              >
                <Button className="glass-effect text-lg px-6 py-3">Watch First Episode</Button>
              </Link>
            )}
            <ShareButton link={typeof window !== "undefined" ? window.location.href : ""} title={anime.name} />
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Anime Details */}
        <section className="mb-12 grid md:grid-cols-[300px_1fr] gap-8">
          <div className="relative w-full h-auto aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
            <Image
              src={getImageUrl(anime.poster_path, "w780") || "/placeholder.svg"}
              alt={anime.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Overview</h2>
            <p className="text-muted-foreground mb-4">{anime.overview || "No overview available."}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Rating:</span> {anime.vote_average.toFixed(1)} / 10
              </div>
              <div>
                <span className="font-semibold text-foreground">Seasons:</span> {anime.number_of_seasons}
              </div>
              <div>
                <span className="font-semibold text-foreground">Episodes:</span> {anime.number_of_episodes}
              </div>
            </div>
          </div>
        </section>

        {/* Episodes Section with Season Selector */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-foreground">Episodes</h2>
            {sortedSeasons.length > 0 && (
              <Select value={selectedSeasonNumber || ""} onValueChange={setSelectedSeasonNumber}>
                <SelectTrigger className="w-[180px] glass-effect">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  {sortedSeasons.map((season) => (
                    <SelectItem key={season.id} value={season.season_number.toString()}>
                      Season {season.season_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoadingEpisodes ? (
            <div className="text-center text-muted-foreground">Loading episodes...</div>
          ) : selectedSeasonEpisodes.length === 0 ? (
            <p className="text-muted-foreground">No episodes available for this season.</p>
          ) : (
            <div className="glass-effect p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4 text-foreground">Season {selectedSeasonNumber} Episodes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSeasonEpisodes.map((episode) => (
                  <Link
                    key={episode.id}
                    href={`/anime/${anime.id}/season/${episode.season_number}/episode/${episode.episode_number}`}
                    className="glass-effect p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                  >
                    <Image
                      src={
                        getImageUrl(episode.still_path, "w300") ||
                        "/placeholder.svg?height=45&width=80&query=episode-thumbnail"
                      }
                      alt={episode.name || `Episode ${episode.episode_number}`}
                      width={80}
                      height={45}
                      className="rounded-md object-cover aspect-video"
                    />
                    <div>
                      <div className="font-medium text-foreground line-clamp-1">
                        E{episode.episode_number}: {episode.name || `Episode ${episode.episode_number}`}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {episode.overview || "No description available."}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="py-6 text-center text-muted-foreground border-t border-border glass-effect">
        <p>&copy; {new Date().getFullYear()} Anime Stream. All rights reserved.</p>
      </footer>
    </div>
  )
}
