module.exports = {
  init
}

const compress = require('compression')
const crypto = require('crypto')
const express = require('express')
const fs = require('fs')
const path = require('path')
const session = require('express-session')

const config = require('../../config')
const secret = require('../../secret')

const routerApi = require('./router-api')
const routerLogin = require('./router-login')
const routerRender = require('./router-render')

function init (sessionStore) {
  const app = express()

  // Set up templating
  app.set('view engine', 'ejs')
  app.set('views', path.join(config.root, 'src', 'server'))

  app.set('trust proxy', true) // Trust the nginx reverse proxy
  app.set('json spaces', config.isProd ? 0 : 2) // Pretty-print JSON in development
  app.set('x-powered-by', false) // Prevent server fingerprinting

  app.use(compress()) // Compress http responses with gzip

  // Add headers
  app.use((req, res, next) => {
    // Disable browser mime-type sniffing to reduce exposure to drive-by download attacks when
    // serving user uploaded content
    res.header('X-Content-Type-Options', 'nosniff')

    // Prevent rendering of site within a frame
    res.header('X-Frame-Options', 'DENY')

    // Enable browser XSS filtering. Usually enabled by default, but this header re-enables it
    // if it was disabled by the user, and asks the the browser to prevent rendering of the
    // page if an attack is detected.
    res.header('X-XSS-Protection', '1; mode=block')

    if (config.isProd) {
      // Redirect to main site url, over https
      if (req.method === 'GET' &&
          (req.protocol !== 'https' || req.hostname !== config.host)) {
        return res.redirect(301, config.httpOrigin + req.url)
      }

      // Use HSTS (cache for 2 years, include subdomains, allow browser preload list)
      res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }

    next()
  })

  // Set up static file serving
  const staticOpts = { maxAge: config.maxAge }

  app.use(express.static(path.join(config.root, 'static'), staticOpts))

  // serve /tachyons/yachyons.min.css
  app.use(
    '/tachyons',
    express.static(path.dirname(require.resolve('tachyons')), staticOpts)
  )

  // serve /highlight/monokai-sublime.css
  app.use(
    '/highlight',
    express.static(
      path.join(path.dirname(require.resolve('highlight.js')), '..', 'styles'),
      staticOpts
    )
  )

  // serve /codemirror/codemirror.css
  app.use(
    '/codemirror',
    express.static(path.dirname(require.resolve('codemirror')), staticOpts)
  )

  // serve /codemirror/monokai.css
  app.use(
    '/codemirror',
    express.static(
      path.join(path.dirname(require.resolve('codemirror')), '..', 'theme'),
      staticOpts
    )
  )

  // Set up session handling
  app.use(session({
    store: sessionStore,
    secret: secret.cookie,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: {
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      secure: config.isProd
    }
  }))

  const bundleHash = config.isProd
    ? '?h=' + createHash(fs.readFileSync(path.join(config.root, 'static', 'bundle.js')))
    : ''

  const styleHash = config.isProd
    ? '?h=' + createHash(fs.readFileSync(path.join(config.root, 'static', 'style.css')))
    : ''

  // Add template local variables
  app.use((req, res, next) => {
    res.locals.config = config
    res.locals.hashes = {
      bundle: bundleHash,
      style: styleHash
    }
    next()
  })

  app.get('/500', (req, res, next) => {
    next(new Error('Manually visited /500'))
  })

  app.use('/api', routerApi)
  app.use('/auth', routerLogin)
  app.use(routerRender)

  return app
}

/**
 * Create a cache-busting hash for static assets like `bundle.js` and `style.css`
 */
function createHash (data) {
  return crypto.createHash('sha256')
    .update(data)
    .digest('base64')
    .slice(0, 20)
    .replace(/\+|\/|=/g, '')
}