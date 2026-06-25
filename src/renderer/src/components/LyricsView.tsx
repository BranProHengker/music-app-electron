import { useEffect, useRef, useState, useMemo, memo, forwardRef } from 'react'
import { MusicNotes, X } from '@phosphor-icons/react'
import { TrackMeta } from '../hooks/useAudioEngine'

interface LyricLine {
  time: number // in seconds
  text: string
}

interface LyricsViewProps {
  currentTrack: TrackMeta | null
  currentTime: number
  seek: (time: number) => void
  onClose: () => void
}

interface LyricLineItemProps {
  text: string
  time: number
  isActive: boolean
  isPast: boolean
  onClick: () => void
}

const LyricLineItem = forwardRef<HTMLDivElement, LyricLineItemProps>(
  ({ text, time, isActive, isPast, onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={`lyric-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${time === -1 ? 'no-sync' : ''}`}
        onClick={onClick}
      >
        {text}
      </div>
    )
  }
)

LyricLineItem.displayName = 'LyricLineItem'
const MemoizedLyricLineItem = memo(LyricLineItem)

export default function LyricsView({
  currentTrack,
  currentTime,
  seek,
  onClose
}: LyricsViewProps): React.JSX.Element {
  const [rawLyrics, setRawLyrics] = useState<string | null>(null)
  const [lyricsList, setLyricsList] = useState<LyricLine[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // Fetch lyrics when track changes
  useEffect(() => {
    async function fetchLyrics() {
      if (!currentTrack) {
        setRawLyrics(null)
        setLyricsList([])
        return
      }
      try {
        const lyrics = await window.api.getLyrics(currentTrack.filePath)
        setRawLyrics(lyrics)
      } catch (err) {
        console.warn('Error loading lyrics:', err)
        setRawLyrics(null)
      }
    }
    fetchLyrics()
  }, [currentTrack])

  // Parse raw LRC lyrics
  useEffect(() => {
    if (!rawLyrics) {
      setLyricsList([])
      return
    }

    const lines = rawLyrics.split(/\r?\n/)
    const parsed: LyricLine[] = []

    lines.forEach((line) => {
      // Matches standard [mm:ss.xx] or [mm:ss:xx] or [mm:ss]
      const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const msStr = match[3] || ''
        const ms = msStr ? parseInt(msStr, 10) : 0
        
        // Convert time to total seconds
        const time = minutes * 60 + seconds + (msStr ? ms / (msStr.length === 3 ? 1000 : 100) : 0)
        const text = match[4].trim()
        
        // Add only non-empty lines or timestamps intended as instrumental break separators
        parsed.push({ time, text: text || '♩' })
      } else {
        // Fallback for plain text lyrics without timestamps (render them but time = 0)
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('[')) {
          parsed.push({ time: -1, text: trimmed })
        }
      }
    })

    // Sort parsed lyrics by timestamp
    setLyricsList(parsed.sort((a, b) => a.time - b.time))
  }, [rawLyrics])

  // Determine current active lyric line
  const activeIndex = useMemo(() => {
    if (lyricsList.length === 0) return -1
    const firstTimedLine = lyricsList.find((l) => l.time >= 0)
    if (!firstTimedLine) return -1
    
    if (currentTime < firstTimedLine.time) return -1

    // Find the latest lyric line whose time is less than or equal to current playing time
    for (let i = lyricsList.length - 1; i >= 0; i--) {
      if (lyricsList[i].time >= 0 && currentTime >= lyricsList[i].time) {
        return i
      }
    }
    return -1
  }, [lyricsList, currentTime])

  // Smooth scroll active lyric line into center of container or reset to top if activeIndex is -1
  useEffect(() => {
    if (activeIndex === -1) {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    } else if (activeLineRef.current && containerRef.current) {
      const activeLine = activeLineRef.current
      const container = containerRef.current
      
      const activeTop = activeLine.offsetTop
      const activeHeight = activeLine.offsetHeight
      const containerHeight = container.offsetHeight
      
      // Calculate target scroll position to center the active line
      const targetScrollTop = activeTop - (containerHeight / 2) + (activeHeight / 2)
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
    }
  }, [activeIndex])

  const handleLineClick = (time: number) => {
    if (time >= 0) {
      seek(time)
    }
  }

  // Fallback covers
  const coverArtSrc = currentTrack?.coverArt || ''

  return (
    <div className="lyrics-view-overlay">
      {/* Blurred background cover art */}
      <div 
        className="lyrics-bg-blur"
        style={{ backgroundImage: coverArtSrc ? `url(${coverArtSrc})` : 'none' }}
      />
      <div className="lyrics-darkener" />

      {/* Close button */}
      <button className="lyrics-close-btn" onClick={onClose} title="Close Lyrics">
        <X size={20} weight="bold" />
      </button>

      <div className="lyrics-content-container">
        {/* Left column: Big cover art and info */}
        <div className="lyrics-left-info">
          <div className="lyrics-cover-wrapper">
            {coverArtSrc ? (
              <img src={coverArtSrc} alt={currentTrack?.title} className="lyrics-big-cover" />
            ) : (
              <div className="lyrics-big-cover-placeholder">
                <MusicNotes size={64} weight="thin" color="rgba(255,255,255,0.2)" />
              </div>
            )}
          </div>
          <div className="lyrics-track-meta">
            <h1 className="lyrics-track-title">{currentTrack?.title || 'Unknown Title'}</h1>
            <p className="lyrics-track-artist">{currentTrack?.artist || 'Unknown Artist'}</p>
            <p className="lyrics-track-album">{currentTrack?.album || 'Unknown Album'}</p>
          </div>
        </div>

        {/* Right column: Synced Lyrics list */}
        <div className="lyrics-right-list" ref={containerRef}>
          {lyricsList.length === 0 ? (
            <div className="lyrics-empty-state">
              <MusicNotes size={32} weight="light" style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p>No lyrics found for this track</p>
              <span className="lyrics-empty-subtitle">
                Put a `.lrc` or `.txt` file with the same name next to the audio file to load lyrics automatically.
              </span>
            </div>
          ) : (
            <div className="lyrics-scroller">
              {lyricsList.map((line, idx) => {
                const isActive = idx === activeIndex
                const isPast = idx < activeIndex
                
                return (
                  <MemoizedLyricLineItem
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    text={line.text}
                    time={line.time}
                    isActive={isActive}
                    isPast={isPast}
                    onClick={() => handleLineClick(line.time)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
