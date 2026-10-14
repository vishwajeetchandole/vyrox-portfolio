import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { afterEach, test } from 'node:test'
import { teamMembers } from '../src/data/teamMembers.js'
import handler from './team.js'

const originalFetch = globalThis.fetch
const originalEnvironment = {
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
  GITHUB_BRANCH: process.env.GITHUB_BRANCH,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  TEAM_EDITOR_PASSWORD: process.env.TEAM_EDITOR_PASSWORD,
}

function createResponse() {
  const headers = {}
  return {
    headers,
    statusCode: 0,
    body: null,
    setHeader(name, value) {
      headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(value) {
      this.body = value
      return this
    },
  }
}

async function callHandler(body, method = 'POST') {
  const response = createResponse()
  const request = {
    method,
    headers: { authorization: `Bearer ${process.env.TEAM_EDITOR_PASSWORD}` },
    body,
  }
  const originalConsoleError = console.error
  console.error = () => {}
  try {
    await handler(request, response)
  } finally {
    console.error = originalConsoleError
  }
  return response
}

afterEach(() => {
  globalThis.fetch = originalFetch
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test('API module loads without importing frontend team modules or PNG assets', () => {
  const loader = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.png')) {
    throw new Error('API attempted to import a PNG asset.')
  }
  const resolved = await nextResolve(specifier, context)
  if (resolved.url.endsWith('/src/data/team.js')) {
    throw new Error('API attempted to import the frontend team module.')
  }
  return resolved
}`
  const result = spawnSync(process.execPath, [
    '--no-warnings',
    '--experimental-loader',
    `data:text/javascript,${encodeURIComponent(loader)}`,
    '--input-type=module',
    '--eval',
    `await import(${JSON.stringify(new URL('./team.js', import.meta.url).href)})`,
  ], { encoding: 'utf8' })

  assert.equal(result.status, 0, result.stderr)
})

function configureBackend() {
  process.env.GITHUB_REPOSITORY = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  process.env.GITHUB_TOKEN = randomBytes(32).toString('hex')
  process.env.TEAM_EDITOR_PASSWORD = randomBytes(32).toString('hex')
}

function createLargeProfiles() {
  const profiles = structuredClone(teamMembers)
  profiles[0].image = `data:image/webp;base64,${'A'.repeat(1_100_000)}`
  return profiles
}

test('GET returns shared profiles from the Git blob API when Contents omits large file content', async () => {
  configureBackend()
  const profiles = createLargeProfiles()
  const content = JSON.stringify(profiles)
  assert.ok(Buffer.byteLength(content) > 1024 * 1024)
  const encodedContent = Buffer.from(content).toString('base64')
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (calls.length === 1) {
      return new Response(JSON.stringify({
        content: '',
        encoding: 'none',
        sha: 'current-sha',
        size: Buffer.byteLength(content),
      }), { status: 200 })
    }
    return new Response(JSON.stringify({
      content: encodedContent,
      encoding: 'base64',
      sha: 'current-sha',
      size: Buffer.byteLength(content),
    }), { status: 200 })
  }

  const result = await callHandler(undefined, 'GET')

  assert.equal(result.statusCode, 200)
  assert.deepEqual(result.body, { backendReady: true, members: profiles })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/repo/contents/public/team-members.json?ref=main')
  assert.equal(calls[1].url, 'https://api.github.com/repos/owner/repo/git/blobs/current-sha')
})

test('GET returns a JSON readiness response when the shared backend is not configured', async () => {
  for (const name of Object.keys(originalEnvironment)) delete process.env[name]
  const result = await callHandler(undefined, 'GET')

  assert.equal(result.statusCode, 200)
  assert.deepEqual(result.body, { backendReady: false })
})

test('editor authentication succeeds without reading or writing profile data', async () => {
  configureBackend()
  const calls = []
  globalThis.fetch = async (...args) => {
    calls.push(args)
    throw new Error('Authentication must not call GitHub.')
  }

  const result = await callHandler({ action: 'authenticate' })

  assert.equal(result.statusCode, 200)
  assert.deepEqual(result.body, { authenticated: true })
  assert.equal(calls.length, 0)
})

test('saving a profile reads large current data through Git blobs and commits the update', async () => {
  configureBackend()
  const profiles = createLargeProfiles()
  const content = JSON.stringify(profiles)
  const encodedContent = Buffer.from(content).toString('base64')
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (calls.length === 1) {
      return new Response(JSON.stringify({
        content: '',
        encoding: 'none',
        sha: 'current-sha',
        size: Buffer.byteLength(content),
      }), { status: 200 })
    }
    if (calls.length === 2) {
      return new Response(JSON.stringify({
        content: encodedContent,
        encoding: 'base64',
        sha: 'current-sha',
      }), { status: 200 })
    }
    return new Response(JSON.stringify({ content: { sha: 'updated-sha' } }), { status: 200 })
  }
  const member = structuredClone(profiles[0])
  member.aboutMe = `${member.aboutMe} Updated`
  const baseHash = createHash('sha256').update(JSON.stringify(profiles[0])).digest('hex')
  const result = await callHandler({ action: 'save-member', member, baseHash })

  assert.equal(result.statusCode, 200)
  assert.equal(result.body.redeploying, true)
  assert.equal(result.body.members[0].aboutMe, member.aboutMe)
  assert.equal(calls.length, 3)
  assert.equal(calls[1].url, 'https://api.github.com/repos/owner/repo/git/blobs/current-sha')
  const commit = JSON.parse(calls[2].options.body)
  assert.equal(commit.sha, 'current-sha')
  assert.equal(commit.branch, 'main')
  assert.deepEqual(
    JSON.parse(Buffer.from(commit.content, 'base64').toString('utf8')),
    result.body.members,
  )
})

test('GitHub write failures return JSON diagnostics without leaking secrets or changing saved profiles', async () => {
  configureBackend()
  const token = process.env.GITHUB_TOKEN
  const editorPassword = process.env.TEAM_EDITOR_PASSWORD

  const originalProfiles = structuredClone(teamMembers)
  const savedProfiles = createLargeProfiles()
  const savedContent = JSON.stringify(savedProfiles)
  assert.ok(Buffer.byteLength(savedContent) > 1024 * 1024)
  const content = Buffer.from(savedContent).toString('base64')
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (calls.length === 1) {
      return new Response(JSON.stringify({
        content: '',
        encoding: 'none',
        sha: 'current-sha',
        size: Buffer.byteLength(savedContent),
      }), { status: 200 })
    }
    if (calls.length === 2) {
      return new Response(JSON.stringify({
        content,
        encoding: 'base64',
        sha: 'current-sha',
      }), { status: 200 })
    }
    return new Response(JSON.stringify({ message: 'Protected branch update failed' }), { status: 422 })
  }

  const submittedMembers = structuredClone(savedProfiles)
  submittedMembers[0].aboutMe = `${submittedMembers[0].aboutMe} Updated`
  const result = await callHandler({ action: 'replace-team', members: submittedMembers })

  assert.equal(result.statusCode, 502)
  assert.equal(result.headers['Cache-Control'], 'no-store')
  assert.equal(result.body.error, 'Could not save the shared profiles. GitHub could not save the team profile file (HTTP 422). Protected branch update failed')
  assert.doesNotMatch(JSON.stringify(result.body), new RegExp(token))
  assert.doesNotMatch(JSON.stringify(result.body), new RegExp(editorPassword))
  assert.equal(calls.length, 3)
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/repo/contents/public/team-members.json?ref=main')
  assert.equal(calls[1].url, 'https://api.github.com/repos/owner/repo/git/blobs/current-sha')
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${token}`)
  assert.equal(calls[2].url, 'https://api.github.com/repos/owner/repo/contents/public/team-members.json')
  assert.equal(calls[2].options.method, 'PUT')
  assert.equal(calls[2].options.headers.Authorization, `Bearer ${token}`)

  const commit = JSON.parse(calls[2].options.body)
  assert.equal(commit.sha, 'current-sha')
  assert.equal(commit.branch, 'main')
  assert.deepEqual(
    JSON.parse(Buffer.from(commit.content, 'base64').toString('utf8')),
    submittedMembers,
  )
  assert.deepEqual(originalProfiles, teamMembers)
})

test('an empty GitHub profile response produces a JSON diagnostic instead of a JSON parse exception', async () => {
  configureBackend()
  globalThis.fetch = async () => new Response('', { status: 200 })

  const result = await callHandler({ action: 'replace-team', members: teamMembers })

  assert.equal(result.statusCode, 502)
  assert.deepEqual(result.body, {
    error: 'Could not save the shared profiles. GitHub returned an empty response while trying to read the team profile file (HTTP 200).',
  })
  assert.equal(JSON.stringify(result.body).includes('Unexpected end of JSON input'), false)
})
