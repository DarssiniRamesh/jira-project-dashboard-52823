import React from 'react';

// PUBLIC_INTERFACE
function ProjectCard({ project }) {
  /**
   * Renders a card view of a Jira project with main details:
   * name, key, type, lead name/email, status, avatar, last updated
   */
  const {
    name, key, projectTypeKey, projectCategory,
    lead, avatarUrls, archived, updated, description,
    insight,
  } = project;

  const statusString = archived
    ? "Archived"
    : "Active"; // Jira API: only a few have "archived"; otherwise "Active"

  return (
    <div className="project-card">
      <div className="project-card-header">
        {avatarUrls && avatarUrls["48x48"] &&
          <img
            src={avatarUrls["48x48"]}
            alt="Project Avatar"
            className="project-card-avatar"
          />
        }
        <span className="project-card-title">{name || "(No Name)"}</span>
        <span className="project-card-key">{key}</span>
      </div>
      <div className="project-card-row" style={{ marginTop: 8 }}>
        Type: <span className="project-card-type">{projectTypeKey}</span>
        {projectCategory && projectCategory.name &&
          <>
            {" · "}
            <span className="project-card-category">{projectCategory.name}</span>
          </>
        }
      </div>
      <div className="project-card-row">
        {lead && (
          <>
            Lead: <b>{lead.displayName || lead.name || "?"}</b>
            {lead.emailAddress && (
              <span className="project-card-lead-email">
                {" · "}{lead.emailAddress}
              </span>
            )}
          </>
        )}
      </div>
      <div className="project-card-row">
        Status: <b className={"project-card-status" + (archived ? " archived" : " active")}>
          {statusString}
        </b>
      </div>
      {updated && (
        <div className="project-card-row small">
          Updated: {new Date(updated).toLocaleString()}
        </div>
      )}
      {description && typeof description === "string" && (
        <div className="project-card-description">
          {description}
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
