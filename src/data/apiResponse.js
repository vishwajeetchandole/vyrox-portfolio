export async function readApiResponse(response, serviceName = 'The shared profile service') {
  let responseText
  try {
    responseText = await response.text()
  } catch {
    throw new Error(`${serviceName} returned an unreadable response (HTTP ${response.status}).`)
  }

  let payload
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    if (typeof payload?.error === 'string') {
      throw new Error(payload.error)
    }
    const responseState = responseText.trim() ? 'non-JSON' : 'empty'
    const article = responseState === 'empty' ? 'an' : 'a'
    throw new Error(`${serviceName} returned ${article} ${responseState} error response (HTTP ${response.status}).`)
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`${serviceName} returned an invalid response (HTTP ${response.status}).`)
  }

  return payload
}
