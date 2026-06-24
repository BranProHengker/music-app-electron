import { useState, useEffect, useMemo } from 'react'
import {
  MagnifyingGlass,
  FolderOpen,
  ArrowLeft,
  ArrowClockwise,
  Heart,
  Folder,
  Info
} from '@phosphor-icons/react'

import Sidebar from './components/Sidebar'
import TrackList from './components/TrackList'
import PlaylistGrid from './components/PlaylistGrid'
import PlayerBar from './components/PlayerBar'
import { useAudioEngine, TrackMeta } from './hooks/useAudioEngine'

interface AlbumGroup {
  name: string
  artist: string
  coverArt: string | null
  tracks: TrackMeta[]
}

export default function App(): React.JSX.Element {
  const { playTrack, currentTrack, isPlaying } = useAudioEngine()

  // ─── State ──────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<'library' | 'favorites' | 'settings'>('library')
  const [libraryFolder, setLibraryFolder] = useState<string | null>(null)
  const [tracks, setTracks] = useState<TrackMeta[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [playlists, setPlaylists] = useState<string[]>([])
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, string[]>>({})
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null)
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // ─── Load Library and Settings ──────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const settings = await window.api.loadSettings()
      if (settings) {
        if (typeof settings.libraryFolder === 'string') {
          setLibraryFolder(settings.libraryFolder)
        }
        if (Array.isArray(settings.favorites)) {
          setFavorites(settings.favorites as string[])
        }
        if (Array.isArray(settings.playlists)) {
          setPlaylists(settings.playlists as string[])
        }
        if (settings.playlistTracks && typeof settings.playlistTracks === 'object') {
          setPlaylistTracks(settings.playlistTracks as Record<string, string[]>)
        }
      }

      const lib = await window.api.loadLibrary()
      if (lib && Array.isArray(lib)) {
        setTracks(lib as TrackMeta[])
      }
    }
    loadData()
  }, [])

  // ─── Save Settings Helper ───────────────────────────────────────────
  const persistSettings = async (updates: Record<string, unknown>) => {
    const settings = await window.api.loadSettings()
    const updatedSettings = {
      ...settings,
      ...updates
    }
    await window.api.saveSettings(updatedSettings)
  }

  // ─── Folder Selection & Scanning ────────────────────────────────────
  const handleSelectFolder = async () => {
    const folder = await window.api.selectFolder()
    if (folder) {
      setLibraryFolder(folder)
      handleScanFolder(folder)
    }
  }

  const handleScanFolder = async (path: string) => {
    if (isScanning) return
    setIsScanning(true)
    try {
      const scannedTracks = await window.api.scanFolder(path)
      if (scannedTracks && Array.isArray(scannedTracks)) {
        setTracks(scannedTracks as TrackMeta[])
      }
    } catch (err) {
      console.error('Scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }

  // ─── Playlists Management ──────────────────────────────────────────
  const handleCreatePlaylist = async () => {
    const name = prompt('Enter playlist name:')
    if (!name) return
    const trimmed = name.trim()
    if (trimmed && !playlists.includes(trimmed)) {
      const nextPlaylists = [...playlists, trimmed]
      setPlaylists(nextPlaylists)
      await persistSettings({ playlists: nextPlaylists })
    }
  }

  const handleToggleFavorite = async (filePath: string) => {
    const nextFavorites = favorites.includes(filePath)
      ? favorites.filter((path) => path !== filePath)
      : [...favorites, filePath]
    
    setFavorites(nextFavorites)
    await persistSettings({ favorites: nextFavorites })
  }

  // ─── Computed Properties ───────────────────────────────────────────
  const albums = useMemo((): AlbumGroup[] => {
    const groups: Record<string, TrackMeta[]> = {}
    tracks.forEach((track) => {
      const key = track.album || 'Unknown Album'
      if (!groups[key]) groups[key] = []
      groups[key].push(track)
    })

    return Object.entries(groups).map(([name, albumTracks]) => {
      // Find first non-null cover art
      const coverArt = albumTracks.find((t) => t.coverArt !== null)?.coverArt || null
      // Get artists
      const uniqueArtists = Array.from(new Set(albumTracks.map((t) => t.artist)))
      const artist = uniqueArtists.length > 1 ? 'Various Artists' : uniqueArtists[0] || 'Unknown Artist'

      return {
        name,
        artist,
        coverArt,
        tracks: albumTracks
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [tracks])

  const totalArtistsCount = useMemo(() => {
    return new Set(tracks.map((t) => t.artist)).size
  }, [tracks])

  // Filtered tracks based on view, playlist, album, and search query
  const displayedTracks = useMemo(() => {
    let result = [...tracks]

    // 1. Filter by Main View
    if (currentView === 'favorites') {
      result = result.filter((t) => favorites.includes(t.filePath))
    } else if (currentView === 'library') {
      if (activePlaylist) {
        const pFilePaths = playlistTracks[activePlaylist] || []
        result = result.filter((t) => pFilePaths.includes(t.filePath))
      } else if (activeAlbum) {
        result = result.filter((t) => t.album === activeAlbum)
      }
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      )
    }

    return result
  }, [tracks, currentView, activePlaylist, activeAlbum, favorites, playlistTracks, searchQuery])

  // ─── Handlers ───────────────────────────────────────────────────────
  const handlePlayTrack = (track: TrackMeta) => {
    // Provide queue context so next/prev can advance sequentially within current filtered list
    playTrack(track, displayedTracks)
  }

  // Go back to full library view when browsing specific album or playlist
  const handleClearFilters = () => {
    setActivePlaylist(null)
    setActiveAlbum(null)
    setSearchQuery('')
  }

  return (
    <div className="app-container">
      {/* Draggable header bar */}
      <header className="app-header">
        <div className="app-title">Vault Audio Player</div>
      </header>

      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view)
          setActiveAlbum(null)
          setActivePlaylist(null)
        }}
        libraryFolder={libraryFolder}
        playlists={playlists}
        activePlaylist={activePlaylist}
        setActivePlaylist={(playlistName) => {
          setActivePlaylist(playlistName)
          setActiveAlbum(null)
          setCurrentView('library')
        }}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Main Panel */}
      <main className="main-content">
        {/* Search Bar / Action Bar */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <MagnifyingGlass size={18} weight="light" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tracks, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {libraryFolder && (
            <button
              className="btn-secondary"
              onClick={() => handleScanFolder(libraryFolder)}
              disabled={isScanning}
            >
              <span>{isScanning ? 'Syncing...' : 'Sync Folder'}</span>
              <div className="btn-icon-circle">
                <ArrowClockwise size={14} weight="light" className={isScanning ? 'animate-spin' : ''} />
              </div>
            </button>
          )}
        </div>

        {/* View Routing */}
        {currentView === 'settings' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="section-title">Settings</h2>
            
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-label">
                  <span className="settings-title">Music Library Folder</span>
                  <span className="settings-subtitle">Select where your local audio files are located</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {libraryFolder && <span className="settings-value">{libraryFolder}</span>}
                  <button className="btn-primary" onClick={handleSelectFolder}>
                    <FolderOpen size={16} weight="light" />
                    <span>Choose Folder</span>
                  </button>
                </div>
              </div>

              {libraryFolder && (
                <div className="settings-row">
                  <div className="settings-label">
                    <span className="settings-title">Recompile Metadata Cache</span>
                    <span className="settings-subtitle">Scans library for new tracks and updates metadata tags</span>
                  </div>
                  <button className="btn-secondary" onClick={() => handleScanFolder(libraryFolder)} disabled={isScanning}>
                    <span>{isScanning ? 'Scanning...' : 'Rescan Library'}</span>
                    <div className="btn-icon-circle">
                      <ArrowClockwise size={14} weight="light" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="settings-section" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.01)', boxShadow: 'none', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <Info size={16} weight="light" color="var(--accent)" />
                <span>Supports MP3, FLAC, WAV, M4A, OGG, AAC, WMA audio formats.</span>
              </div>
            </div>
          </div>
        ) : !libraryFolder ? (
          /* Empty Library / Init State */
          <div className="empty-state">
            <div className="empty-state-icon">
              <Folder size={28} weight="light" />
            </div>
            <h2>Setup Your Library</h2>
            <p>
              To get started, select the folder on your computer where your local music files are stored. We'll automatically index your tracks.
            </p>
            <button className="btn-primary" onClick={handleSelectFolder} style={{ marginTop: '8px' }}>
              <FolderOpen size={18} weight="light" />
              <span>Select Music Folder</span>
            </button>
          </div>
        ) : (
          /* Dashboard or Track List Views */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header section with back button if active filter is set */}
            {(activeAlbum || activePlaylist || searchQuery) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  className="btn-control"
                  onClick={handleClearFilters}
                  style={{ border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <ArrowLeft size={16} weight="light" />
                </button>
                <div>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>
                    {activeAlbum ? `Album: ${activeAlbum}` : activePlaylist ? `Playlist: ${activePlaylist}` : 'Search Results'}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {displayedTracks.length} tracks found
                  </span>
                </div>
              </div>
            )}

            {/* Render Bento compilation grid only on root My Library page */}
            {currentView === 'library' && !activeAlbum && !activePlaylist && !searchQuery && (
              <PlaylistGrid
                albums={albums}
                favoritesCount={favorites.length}
                totalTracksCount={tracks.length}
                totalArtistsCount={totalArtistsCount}
                onSelectAlbum={(name) => setActiveAlbum(name)}
                onSelectFavorites={() => setCurrentView('favorites')}
                onSelectAllSongs={() => setSearchQuery(' ')} // triggers displaying list view with space filter (resets to lists)
              />
            )}

            {/* Track rows (rendered when browsing an album, playlist, searching, or favorited) */}
            {(currentView === 'favorites' || activeAlbum || activePlaylist || searchQuery) && (
              <div>
                {currentView === 'favorites' && !searchQuery && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Heart size={20} weight="fill" color="var(--accent)" />
                      Liked Songs
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {displayedTracks.length} tracks saved
                    </span>
                  </div>
                )}

                <TrackList
                  tracks={displayedTracks}
                  onPlayTrack={handlePlayTrack}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom fixed Player Control Bar */}
      <PlayerBar />
    </div>
  )
}
