import { House, Heart, Gear, Plus, Playlist } from '@phosphor-icons/react'

interface SidebarProps {
  currentView: 'library' | 'favorites' | 'settings'
  setCurrentView: (view: 'library' | 'favorites' | 'settings') => void
  libraryFolder: string | null
  playlists: string[]
  activePlaylist: string | null
  setActivePlaylist: (name: string | null) => void
  onCreatePlaylist: () => void
}

export default function Sidebar({
  currentView,
  setCurrentView,
  libraryFolder,
  playlists,
  activePlaylist,
  setActivePlaylist,
  onCreatePlaylist
}: SidebarProps) {
  const handleNavClick = (view: 'library' | 'favorites' | 'settings') => {
    setCurrentView(view)
    setActivePlaylist(null)
  };

  const handlePlaylistClick = (name: string) => {
    setCurrentView('library') // playlists are rendered in the library view context
    setActivePlaylist(name)
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Playlist size={26} weight="light" color="var(--accent)" />
        <span>VibeVault</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'library' && !activePlaylist ? 'active' : ''}`}
          onClick={() => handleNavClick('library')}
        >
          <House size={20} weight="light" />
          <span>My Library</span>
        </button>

        <button
          className={`nav-item ${currentView === 'favorites' ? 'active' : ''}`}
          onClick={() => handleNavClick('favorites')}
        >
          <Heart size={20} weight="light" />
          <span>Liked Songs</span>
        </button>
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-playlists-header">
        <span>Playlists</span>
        <button
          className="btn-add-playlist"
          onClick={onCreatePlaylist}
          title="Create Playlist"
        >
          <Plus size={16} weight="light" />
        </button>
      </div>

      <div className="sidebar-playlists-list">
        {playlists.length === 0 ? (
          <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No playlists yet
          </div>
        ) : (
          playlists.map((name) => (
            <button
              key={name}
              className={`playlist-nav-item ${activePlaylist === name ? 'active' : ''}`}
              onClick={() => handlePlaylistClick(name)}
              style={activePlaylist === name ? { color: 'var(--accent)', fontWeight: 600 } : {}}
            >
              {name}
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <Gear size={20} weight="light" />
          <span>Settings</span>
        </button>

        {libraryFolder && (
          <div style={{ padding: '4px 12px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {libraryFolder.split('/').pop()}
          </div>
        )}
      </div>
    </aside>
  )
}
