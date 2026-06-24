import { Heart, MusicNotes, Sparkle } from '@phosphor-icons/react'
import { TrackMeta } from '../hooks/useAudioEngine'

interface AlbumGroup {
  name: string
  artist: string
  coverArt: string | null
  tracks: TrackMeta[]
}

interface PlaylistGridProps {
  albums: AlbumGroup[]
  favoritesCount: number
  totalTracksCount: number
  totalArtistsCount: number
  onSelectAlbum: (albumName: string | null) => void
  onSelectFavorites: () => void
  onSelectAllSongs: () => void
}

export default function PlaylistGrid({
  albums,
  favoritesCount,
  totalTracksCount,
  totalArtistsCount,
  onSelectAlbum,
  onSelectFavorites,
  onSelectAllSongs
}: PlaylistGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 className="section-title">Explore Your Vault</h2>
      
      <div className="bento-grid">
        {/* Card 1: Favorites (Large Bento: 2 cols) */}
        <div className="double-bezel-card bento-card-large" onClick={onSelectFavorites}>
          <div className="card-inner">
            <div className="card-gradient-overlay" />
            <div className="card-overlay-content">
              <span className="card-tag">Smart Playlist</span>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={20} weight="fill" color="var(--accent)" />
                Liked Songs
              </h3>
              <p className="card-desc">
                Your curated soundtrack. {favoritesCount} tracks saved to favorites.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Library Summary (Tall Bento: 1 col, 2 rows) */}
        <div className="double-bezel-card bento-card-tall" onClick={onSelectAllSongs}>
          <div className="card-inner" style={{ padding: '24px', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
            <div>
              <span className="card-tag">Library Stats</span>
              <h3 className="card-title" style={{ marginTop: '8px', fontSize: '22px' }}>Your Vault</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  {totalTracksCount}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Tracks</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {totalArtistsCount}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Artists Indexed</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {albums.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Albums Compiled</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent)' }}>
              <Sparkle size={14} weight="light" />
              <span>Browse All Songs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Featured Album / First Album (Standard Bento) */}
        {albums.length > 0 ? (
          <div className="double-bezel-card" onClick={() => onSelectAlbum(albums[0].name)}>
            <div className="card-inner">
              {albums[0].coverArt ? (
                <img className="card-hero-image" src={albums[0].coverArt} alt={albums[0].name} />
              ) : (
                <div className="card-hero-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
                  <MusicNotes size={48} weight="light" color="var(--text-tertiary)" />
                </div>
              )}
              <div className="card-gradient-overlay" />
              <div className="card-overlay-content">
                <span className="card-tag">Featured Album</span>
                <h3 className="card-title">{albums[0].name}</h3>
                <p className="card-desc">{albums[0].artist}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="double-bezel-card">
            <div className="card-inner" style={{ padding: '20px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <MusicNotes size={32} weight="light" color="var(--text-tertiary)" />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Scan a folder to compile albums</p>
            </div>
          </div>
        )}
      </div>

      {/* Album row grid (standard card grids) */}
      {albums.length > 1 && (
        <div style={{ marginTop: '20px' }}>
          <h3 className="section-title" style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Albums
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {albums.slice(1, 7).map((album) => (
              <div
                key={album.name}
                className="double-bezel-card playlist-card-standard"
                onClick={() => onSelectAlbum(album.name)}
              >
                <div className="art-wrapper">
                  {album.coverArt ? (
                    <img src={album.coverArt} alt={album.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
                      <MusicNotes size={32} weight="light" color="var(--text-tertiary)" />
                    </div>
                  )}
                </div>
                <div className="playlist-info">
                  <span className="playlist-name">{album.name}</span>
                  <span className="playlist-meta">{album.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
