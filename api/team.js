import { timingSafeEqual, createHash } from 'node:crypto'
import { teamMembers as defaultTeamMembers } from '../src/data/teamMembers.js'
import { isMemberBackup, isTeamMemberBackup } from '../src/data/teamValidation.js'

const teamFilePath = 'public/team-members.json'
const maxPayloadBytes = 3 * 1024 * 1024

class InvalidRequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

class GitHubApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GitHubApiError'
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

function githubBlobUrl(configuration, sha) {
  return `https://api.github.com/repos/${encodeURIComponent(configuration.owner)}/${encodeURIComponent(configuration.name)}/git/blobs/${encodeURIComponent(sha)}`
}

function githubHeaders(configuration) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${configuration.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function safeDiagnostic(message, configuration) {
  let diagnostic = typeof message === 'string' ? message : 'Unknown server error.'
  for (const secret of [configuration?.token, configuration?.editorPassword]) {
    if (secret) diagnostic = diagnostic.split(secret).join('[redacted]')
  }
  return diagnostic.slice(0, 500)
}

async function readGitHubResponse(response, operation, configuration) {
  let responseText
  try {
    responseText = await response.text()
  } catch (error) {
    throw new GitHubApiError(
      `Could not read GitHub's ${operation} response (HTTP ${response.status}): ${safeDiagnostic(error?.message, configuration)}`,
      response.status,
    )
  }

  let body
  try {
    body = JSON.parse(responseText)
  } catch {
    const responseState = responseText.trim() ? 'invalid JSON' : 'an empty response'
    throw new GitHubApiError(
      `GitHub returned ${responseState} while trying to ${operation} the team profile file (HTTP ${response.status}).`,
      response.status,
    )
  }

  if (!response.ok) {
    const detail = typeof body?.message === 'string'
      ? ` ${safeDiagnostic(body.message, configuration)}`
      : ''
    throw new GitHubApiError(
      `GitHub could not ${operation} the team profile file (HTTP ${response.status}).${detail}`,
      response.status,
    )
  }

  return body
}

async function getCurrentProfiles(configuration) {
  const response = await fetch(githubFileUrl(configuration), { headers: githubHeaders(configuration) })
  const file = await readGitHubResponse(response, 'read', configuration)
  if (typeof file.sha !== 'string') {
    throw new Error('GitHub returned an invalid team profile file.')
  }

  let encodedContent = file.content
  if (file.encoding === 'none' || typeof encodedContent !== 'string' || !encodedContent.trim()) {
    const blobResponse = await fetch(githubBlobUrl(configuration, file.sha), {
      headers: githubHeaders(configuration),
    })
    const blob = await readGitHubResponse(blobResponse, 'read the team profile blob', configuration)
    if (blob.sha !== file.sha || blob.encoding !== 'base64' || typeof blob.content !== 'string') {
      throw new GitHubApiError('GitHub returned an invalid team profile blob (HTTP 200).', 200)
    }
    encodedContent = blob.content
  }

  let members
  try {
    members = JSON.parse(Buffer.from(encodedContent.replace(/\s/g, ''), 'base64').toString('utf8'))
  } catch {
    throw new GitHubApiError('GitHub returned invalid JSON in the team profile file (HTTP 200).', 200)
  }
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
      ...githubHeaders(configuration),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update VYROX team profiles',
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha,
      branch: configuration.branch,
    }),
  })

  if (response.status === 409) {
    return false
  }
  await readGitHubResponse(response, 'save', configuration)
  return true
}

export default async function handler(request, response) {
  let configuration
  try {
    configuration = getConfiguration()

    if (request.method === 'GET') {
      if (!configuration) {
        return respond(response, 200, { backendReady: false })
      }
      const current = await getCurrentProfiles(configuration)
      return respond(response, 200, { backendReady: true, members: current.members })
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
    const status = error instanceof GitHubApiError ? 502 : 500
    const detail = safeDiagnostic(error?.message, configuration)
    const operation = request.method === 'GET' ? 'load' : 'update'
    console.error(`Could not ${operation} VYROX team profiles.`, detail)
    return respond(response, status, {
      error: `Could not ${operation === 'load' ? 'load' : 'save'} the shared profiles. ${detail}`,
    })
  }
}
