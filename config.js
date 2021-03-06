const isBrowser = typeof window !== 'undefined'

const isProd = isBrowser
  ? window.location.hostname !== 'localhost'
  : process.env.NODE_ENV === 'production'

/**
 * Is the javascript environment a browser?
 */
exports.isBrowser = isBrowser

/**
 * Is the site running in production?
 */
exports.isProd = isProd

/**
 * Title of the site
 */
exports.title = 'BitMidi'

/**
 * Description of the site
 */
exports.description = 'Wayback machine for old-school MIDI files'

/**
 * Google Analytics tracking ID
 */
exports.analyticsId = 'UA-3898076-25'

/**
 * Keywords of the site
 */
exports.keywords = [
  'midi',
  'music',
  'retro',
  'mid',
  'midi files'
]

/**
 * Website hostname + port
 */
exports.host = isProd
  ? 'bitmidi.com'
  : 'localhost:4000'

/**
 * Website origin (scheme + hostname + port)
 */
exports.httpOrigin = (isProd ? 'https' : 'http') + '://' + exports.host

/**
 * Websocket origin
 */
// exports.wsOrigin = (isProd ? 'wss' : 'ws') + '://' + exports.host

/**
 * Root path of project
 */
exports.rootPath = isBrowser ? '/' : __dirname

/**
 * Time (in milliseconds) to wait before updating page component data. Page
 * data will be reloaded at least this often.
 */
exports.loadInterval = 10 * 60 * 1000 // 10 minutes

/**
 * Time (in milliseconds) to cache static resources. This value is sent in
 * the HTTP "Cache-Control" header.
 */
exports.maxAgeStatic = isProd
  ? 7 * 24 * 60 * 60 * 1000 // 7 days
  : 0

/**
 * Time (in milliseconds) to keep cookies before deletion. This value is sent in
 * the HTTP "Set-Cookie" header as the "Expires" attribute.
 */
exports.maxAgeCookie = isProd
  ? 365 * 24 * 60 * 60 * 1000 // 1 year
  : 0

/**
 * Time (in milliseconds) to cache the HTTP "Strict-Transport-Security" (HSTS)
 * setting. This value is sent as the "max-age" attribute in the header.
 */
exports.maxAgeHSTS = 365 * 24 * 60 * 60 * 1000 // 1 year

/**
 * Time (in milliseconds) to wait before an API request is considered timed out.
 */
exports.apiTimeout = 30 * 1000

/**
 * User agent for API requests
 */
exports.apiUserAgent = `${exports.title}/1.0.0 (${exports.httpOrigin})`

/**
 * Website theme colors
 */
exports.theme = {
  mainColor: 'dark-gray',
  headerColor: 'hot-pink'
}
