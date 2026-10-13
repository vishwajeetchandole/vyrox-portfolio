import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readApiResponse } from './apiResponse.js'

test('empty error responses report the HTTP status without leaking JSON parser errors', async () => {
  const response = new Response('', { status: 502 })

  await assert.rejects(
    readApiResponse(response),
    {
      message: 'The shared profile service returned an empty error response (HTTP 502).',
    },
  )
})

test('non-JSON error responses report the HTTP status without exposing response contents', async () => {
  const response = new Response('<html>private upstream details</html>', { status: 502 })

  await assert.rejects(
    readApiResponse(response),
    {
      message: 'The shared profile service returned a non-JSON error response (HTTP 502).',
    },
  )
})

test('JSON error responses preserve the server diagnostic', async () => {
  const response = new Response(JSON.stringify({ error: 'GitHub rejected the profile write (HTTP 403).' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(readApiResponse(response), {
    message: 'GitHub rejected the profile write (HTTP 403).',
  })
})

test('valid JSON success responses are returned', async () => {
  const expected = { backendReady: true }
  const response = new Response(JSON.stringify(expected), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  assert.deepEqual(await readApiResponse(response), expected)
})
