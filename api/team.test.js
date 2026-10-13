import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { afterEach, test } from 'node:test'
import { teamMembers } from '../src/data/team.js'
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

async function callHandler(body) {
  const response = createResponse()
  const request = {
    method: 'POST',
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

test('GitHub write failures return JSON diagnostics without leaking secrets or changing saved profiles', async () => {
  const token = randomBytes(32).toString('hex')
  const editorPassword = randomBytes(32).toString('hex')
  process.env.GITHUB_REPOSITORY = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  process.env.GITHUB_TOKEN = token
  process.env.TEAM_EDITOR_PASSWORD = editorPassword

  const originalProfiles = structuredClone(teamMembers)
  const savedProfiles = structuredClone(originalProfiles)
  savedProfiles[0].image = `data:image/png;base64,${'A'.repeat(1_100_000)}`
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
  process.env.GITHUB_REPOSITORY = 'owner/repo'
  process.env.GITHUB_BRANCH = 'main'
  process.env.GITHUB_TOKEN = randomBytes(32).toString('hex')
  process.env.TEAM_EDITOR_PASSWORD = randomBytes(32).toString('hex')
  globalThis.fetch = async () => new Response('', { status: 200 })

  const result = await callHandler({ action: 'replace-team', members: teamMembers })

  assert.equal(result.statusCode, 502)
  assert.deepEqual(result.body, {
    error: 'Could not save the shared profiles. GitHub returned an empty response while trying to read the team profile file (HTTP 200).',
  })
  assert.equal(JSON.stringify(result.body).includes('Unexpected end of JSON input'), false)
})
