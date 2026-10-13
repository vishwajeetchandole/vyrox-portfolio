import { teamMembers as defaultTeamMembers } from './team'

const storageKey = 'vyrox-team-members'

function normalizeMembers(savedMembers) {
  if (!Array.isArray(savedMembers)) {
    throw new Error('Saved member data must be an array.')
  }

  return defaultTeamMembers.map((defaultMember) => {
    const savedMember = savedMembers.find((member) => member.slug === defaultMember.slug)
      || savedMembers.find((member) => member.name === defaultMember.name)
    const member = { ...defaultMember, ...savedMember }

    return {
      ...member,
      slug: defaultMember.slug,
      links: { ...defaultMember.links, ...member.links },
      sectionOrder: Array.isArray(member.sectionOrder) && member.sectionOrder.every((section) => section === 'projects' || section === 'achievements')
        ? member.sectionOrder
        : ['projects', 'achievements'],
      achievements: (member.achievements || []).map((achievement) => ({ image: '', ...achievement })),
      certificates: (member.certificates || []).map((certificate) => ({ image: '', description: '', ...certificate })),
      projects: (member.projects || []).map((project) => ({
        image: '',
        techStack: project.tags || [],
        ...project,
      })),
      strengths: member.strengths || [],
      experience: member.experience || [],
    }
  })
}

export function loadTeamMembers() {
  try {
    const savedMembers = localStorage.getItem(storageKey)
    return savedMembers ? normalizeMembers(JSON.parse(savedMembers)) : normalizeMembers(defaultTeamMembers)
  } catch (error) {
    console.error('Could not load saved VYROX member information.', error)
    return normalizeMembers(defaultTeamMembers)
  }
}

export function saveTeamMembers(members) {
  localStorage.setItem(storageKey, JSON.stringify(members))
}
