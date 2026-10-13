import { timingSafeEqual, createHash } from 'node:crypto'
import { teamMembers as defaultTeamMembers } from '../src/data/team.js'
import { isMemberBackup, isTeamMemberBackup } from '../src/data/teamValidation.js'

const teamFilePath = 'public/team-members.json'
const maxPayloadBytes = 3 * 1024 * 1024

class InvalidRequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function getConfiguration() {
  const repository = process.env.GITHUB_REPOSITORY?.trim()
  const [owner, name, ...extra] = repository?.split('/') || []
  const branch = process.env.GITHUB_BRANCH?.trim()
  const token = process.env.GITHUB_TOKEN?.trim()
  const editorPassword = process.env.TEAM_EDITOR_PASSWORD

  if (!owner || !name || extra.length || !branch || !token || !editorPassword || editorPassword.length < 16) {
    return null
  }

  return { owner, name, branch, token, editorPassword }
}

function respond(response, status, body) {
  response.setHeader('Cache-Control', 'no-store')
  response.status(status).json(body)
}

function isAuthorized(request, editorPassword) {
  const authorization = request.headers.authorization || ''
  if (!authorization.startsWith('Bearer ')) return false

  const suppliedHash = createHash('sha256').update(authorization.slice(7)).digest()
  const expectedHash = createHash('sha256').update(editorPassword).digest()
  return timingSafeEqual(suppliedHash, expectedHash)
}

async function readRequestBody(request) {
  if (request.body !== undefined) {
    const body = Buffer.isBuffer(request.body) ? request.body.toString('utf8') : request.body
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > maxPayloadBytes) {
        throw new InvalidRequestError('The profile backup is too large (maximum 3 MB).', 413)
      }
      try {
        return JSON.parse(body)
      } catch {
        throw new InvalidRequestError('The request body is not valid JSON.')
      }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new InvalidRequestError('The request must contain a JSON object.')
    }
    if (Buffer.byteLength(JSON.stringify(body)) > maxPayloadBytes) {
      throw new InvalidRequestError('The profile backup is too large (maximum 3 MB).', 413)
    }
    return body
  }

  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxPayloadBytes) {
      throw new InvalidRequestError('The profile backup is too large (maximum 3 MB).', 413)
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new InvalidRequestError('The request body is not valid JSON.')
  }
}

function githubFileUrl(configuration) {
  const path = teamFilePath.split('/').map(encodeURIComponent).join('/')
  return `https://api.github.com/repos/${encodeURIComponent(configuration.owner)}/${encodeURIComponent(configuration.name)}/contents/${path}?ref=${encodeURIComponent(configuration.branch)}`
}

async function getCurrentProfiles(configuration) {
  const response = await fetch(githubFileUrl(configuration), {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${configuration.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub could not read the team profile file (HTTP ${response.status}).`)
  }

  const file = await response.json()
  if (typeof file.content !== 'string' || typeof file.sha !== 'string') {
    throw new Error('GitHub returned an invalid team profile file.')
  }

  const members = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'))
  if (!isMemberBackup(members, defaultTeamMembers)) {
    throw new Error('The saved team profile file does not match the current team.')
  }

  return { members, sha: file.sha }
}

async function saveProfiles(configuration, members, sha) {
  const content = `${JSON.stringify(members, null, 2)}\n`
  const response = await fetch(githubFileUrl(configuration).split('?')[0], {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${configuration.token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: 'Update VYROX team profiles',
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
      branch: configuration.branch,
    }),
  })

  if (response.status === 409 || response.status === 422) {
    return false
  }
  if (!response.ok) {
    throw new Error(`GitHub could not save the team profile file (HTTP ${response.status}).`)
  }
  return true
}

export default async function handler(request, response) {
  const configuration = getConfiguration()

  if (request.method === 'GET') {
    return respond(response, 200, { backendReady: Boolean(configuration) })
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    return respond(response, 405, { error: 'Method not allowed.' })
  }
  if (!configuration) {
    return respond(response, 503, { error: 'The shared profile backend is not configured on the host.' })
  }
  if (!isAuthorized(request, configuration.editorPassword)) {
    return respond(response, 401, { error: 'The editor password is incorrect or has expired.' })
  }

  try {
    const body = await readRequestBody(request)
    if (body.action === 'authenticate') {
      return respond(response, 200, { authenticated: true })
    }

    const current = await getCurrentProfiles(configuration)
    let updatedMembers

    if (body.action === 'save-member' && isTeamMemberBackup(body.member)
      && typeof body.baseHash === 'string' && /^[a-f0-9]{64}$/.test(body.baseHash)) {
      const index = current.members.findIndex((member) => member.slug === body.member.slug)
      if (index === -1) {
        return respond(response, 400, { error: 'This profile does not belong to a current team member.' })
      }
      const currentHash = createHash('sha256').update(JSON.stringify(current.members[index])).digest('hex')
      if (currentHash !== body.baseHash) {
        return respond(response, 409, { error: 'This profile changed after you opened it. Reload the page and apply your changes to the latest profile.' })
      }
      updatedMembers = current.members.map((member, memberIndex) => memberIndex === index ? body.member : member)
    } else if (body.action === 'replace-team' && isMemberBackup(body.members, defaultTeamMembers)) {
      updatedMembers = body.members
    } else {
      return respond(response, 400, { error: 'The submitted team profile data is invalid.' })
    }

    if (Buffer.byteLength(JSON.stringify(updatedMembers)) > maxPayloadBytes) {
      return respond(response, 413, { error: 'The team profiles exceed the 3 MB limit. Remove or resize some images.' })
    }

    const saved = await saveProfiles(configuration, updatedMembers, current.sha)
    if (!saved) {
      return respond(response, 409, { error: 'Profiles changed during this save. Reload the page and try again.' })
    }

    return respond(response, 200, { members: updatedMembers, redeploying: true })
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return respond(response, error.status, { error: error.message })
    }
    console.error('Could not update VYROX team profiles.', error)
    return respond(response, 502, { error: 'Could not save the shared profiles. Check the GitHub/Vercel backend configuration and try again.' })
  }
}
