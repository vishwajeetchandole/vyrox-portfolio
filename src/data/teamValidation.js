function isOptionalText(value) {
  return value === undefined || typeof value === 'string'
}

export function isTeamMemberBackup(member) {
  return typeof member?.name === 'string'
    && typeof member.slug === 'string'
    && typeof member.role === 'string'
    && typeof member.title === 'string'
    && typeof member.aboutMe === 'string'
    && typeof member.intro === 'string'
    && typeof member.initials === 'string'
    && (member.sectionOrder === undefined || (Array.isArray(member.sectionOrder) && member.sectionOrder.length === 2 && member.sectionOrder.every((section) => section === 'projects' || section === 'achievements')))
    && member.links
    && typeof member.links.github === 'string'
    && typeof member.links.linkedin === 'string'
    && typeof member.links.portfolio === 'string'
    && isOptionalText(member.links.email)
    && isOptionalText(member.image)
    && Array.isArray(member.strengths) && member.strengths.every((item) => typeof item === 'string')
    && Array.isArray(member.experience) && member.experience.every((item) => typeof item === 'string')
    && Array.isArray(member.projects) && member.projects.every((project) =>
      typeof project.title === 'string'
      && typeof project.description === 'string'
      && isOptionalText(project.image)
      && (project.techStack === undefined || (Array.isArray(project.techStack) && project.techStack.every((item) => typeof item === 'string')))
      && (project.tags === undefined || (Array.isArray(project.tags) && project.tags.every((item) => typeof item === 'string'))))
    && Array.isArray(member.achievements) && member.achievements.every((achievement) =>
      typeof achievement.title === 'string'
      && typeof achievement.description === 'string'
      && isOptionalText(achievement.image))
    && Array.isArray(member.certificates) && member.certificates.every((certificate) =>
      typeof certificate.title === 'string'
      && typeof certificate.description === 'string'
      && isOptionalText(certificate.image))
}

export function isMemberBackup(value, currentMembers) {
  if (!Array.isArray(value) || value.length !== currentMembers.length) return false
  const currentSlugs = new Set(currentMembers.map((member) => member.slug))
  const importedSlugs = new Set(value.map((member) => member?.slug))
  return importedSlugs.size === currentSlugs.size
    && [...currentSlugs].every((slug) => importedSlugs.has(slug))
    && value.every(isTeamMemberBackup)
}
