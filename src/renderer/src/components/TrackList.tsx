import { Play, SpeakerHigh, Heart, MusicNotes } from '@phosphor-icons/react'
import { TrackMeta } from '../hooks/useAudioEngine'

interface TrackListProps {
  tracks: TrackMeta[]
  onPlayTrack: (track: TrackMeta) => void
  currentTrack: TrackMeta | null
  isPlaying: boolean
  favorites: string[]
  onToggleFavorite: (filePath: string) => void
}

export default function TrackList({
  tracks,
  onPlayTrack,
  currentTrack,
  isPlaying,
  favorites,
  onToggleFavorite
}: TrackListProps) {
  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (tracks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        No tracks found in this view.
      </div>
    )
  }

  return (
    <div className="track-list-container">
      <div className="track-list-header">
        <div>#</div>
        <div>Title</div>
        <div>Album</div>
        <div>Genre</div>
        <div style={{ textAlign: 'right' }}>Time</div>
        <div style={{ justifySelf: 'center' }}>Like</div>
      </div>

      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.filePath === track.filePath
        const isLiked = favorites.includes(track.filePath)

        return (
          <div
            key={track.filePath}
            className={`track-row ${isCurrent ? 'playing' : ''}`}
            onDoubleClick={() => onPlayTrack(track)}
          >
            <div className="track-number" style={{ display: 'flex', alignItems: 'center' }}>
              {isCurrent ? (
                isPlaying ? (
                  <SpeakerHigh size={16} weight="light" color="var(--accent)" />
                ) : (
                  <Play size={16} weight="light" color="var(--accent)" />
                )
              ) : (
                <>
                  <span className="track-number-value">{track.trackNumber || index + 1}</span>
                  <button className="track-row-play-icon" onClick={() => onPlayTrack(track)}>
                    <Play size={14} weight="fill" />
                  </button>
                </>
              )}
            </div>

            <div className="track-info-col">
              <div className="track-thumbnail">
                {track.coverArt ? (
                  <img src={track.coverArt} alt="Cover Art" />
                ) : (
                  <MusicNotes size={16} weight="light" />
                )}
              </div>
              <div className="track-details">
                <span className="track-title">{track.title}</span>
                <span className="track-artist">{track.artist}</span>
              </div>
            </div>

            <div className="track-album">{track.album}</div>
            
            <div className="track-genre">{track.genre || '—'}</div>

            <div className="track-duration" style={{ textAlign: 'right' }}>
              {formatDuration(track.duration)}
            </div>

            <div style={{ justifySelf: 'center' }}>
              <button
                className={`btn-track-favorite ${isLiked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(track.filePath)
                }}
              >
                <Heart size={16} weight={isLiked ? 'fill' : 'light'} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
