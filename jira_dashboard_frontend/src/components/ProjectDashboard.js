import React, { useState, useMemo } from 'react';
import ProjectCard from './ProjectCard';

// PUBLIC_INTERFACE
function ProjectDashboard({ projects }) {
  /**
   * Displays a sidebar for filtering and a responsive grid of ProjectCard components.
   * Sidebar allows filtering by project name or key.
   */

  const [filterText, setFilterText] = useState('');

  // Memoize filtered projects for efficiency
  const filteredProjects = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return projects;
    return projects.filter(
      (project) =>
        project.name?.toLowerCase().includes(text) ||
        project.key?.toLowerCase().includes(text)
    );
  }, [projects, filterText]);

  return (
    <div className="project-dashboard-container">
      <aside className="project-sidebar">
        <div className="sidebar-title">Projects</div>
        <input
          className="sidebar-filter-input"
          type="text"
          placeholder="Filter by name or key"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          aria-label="Filter projects"
        />
        <div className="sidebar-count">
          Showing <b>{filteredProjects.length}</b> of <b>{projects.length}</b>
        </div>
      </aside>
      <main className="project-main">
        <div className="project-grid">
          {filteredProjects.length === 0 ? (
            <div style={{
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              marginTop: 48,
              textAlign: "center"
            }}>
              No projects match this filter.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default ProjectDashboard;
