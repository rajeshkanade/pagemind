import axios from 'axios'

function buildUrl(baseUrl, endpoint) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${normalizedBaseUrl}${normalizedEndpoint}`
}

async function requestJson(baseUrl, endpoint, payload) {
  try {
    const response = await axios.post(buildUrl(baseUrl, endpoint), payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Request failed'

    throw new Error(errorMessage)
  }
}

export async function summarizePage(baseUrl, pagePayload) {
  return requestJson(baseUrl, '/api/v1/analyze/summarize', pagePayload)
}

export async function askPageQuestion(baseUrl, payload) {
  return requestJson(baseUrl, '/api/v1/analyze/ask', payload)
}
