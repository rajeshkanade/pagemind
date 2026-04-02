const chromeRuntime = globalThis.chrome

export const isChromeExt = typeof chromeRuntime !== 'undefined' && chromeRuntime?.runtime?.id

const chromeMock = {
  tabs: {
    query: async () => [],
    sendMessage: async () => {
      throw new Error('Chrome extension APIs are unavailable. Load this app as an unpacked Chrome extension.')
    },
  },
  scripting: {
    executeScript: async () => {
      throw new Error('Chrome scripting API is unavailable. Load this app as an unpacked Chrome extension.')
    },
  },
  runtime: {
    sendMessage: async () => {
      throw new Error('Chrome runtime API is unavailable. Load this app as an unpacked Chrome extension.')
    },
  },
}

export const chromeAPI = isChromeExt ? chromeRuntime : chromeMock
