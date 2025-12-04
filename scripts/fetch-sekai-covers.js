const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve).catch(reject)
        return
      }
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
  })
}

function abs(base, url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const u = new URL(base)
  if (url.startsWith('/')) return `${u.protocol}//${u.host}${url}`
  const prefix = base.replace(/\/[^/]*$/, '/')
  return prefix + url
}

function extractImages(html, base) {
  const set = new Set()
  const imgRe = /<img[^>]*src=["']([^"'>]+)["']/gi
  let m
  while ((m = imgRe.exec(html))) set.add(abs(base, m[1]))
  const ogRe = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"'>]+)["']/gi
  while ((m = ogRe.exec(html))) set.add(abs(base, m[1]))
  const arr = Array.from(set)
  return arr.filter(s => /card|thumb|chara|cover|large|banner|png|jpg|webp/i.test(s))
}

function writeYamlArray(file, arr) {
  const dir = path.dirname(file)
  fs.mkdirSync(dir, { recursive: true })
  const content = yaml.dump(arr, { lineWidth: -1 })
  fs.writeFileSync(file, content, 'utf8')
}

function updateThemeConfig(themeConfigPath, covers) {
  const raw = fs.readFileSync(themeConfigPath, 'utf8')
  const doc = yaml.load(raw)
  doc.homeConfig = doc.homeConfig || {}
  doc.homeConfig.fixedCover = covers[0]
  doc.image_list = covers.slice(0, Math.max(6, covers.length))
  doc.index_images = covers.slice(0, Math.max(6, covers.length))
  const out = yaml.dump(doc, { lineWidth: -1 })
  fs.writeFileSync(themeConfigPath, out, 'utf8')
}

async function main() {
  const srcArg = process.argv[2] || ''
  const limit = parseInt(process.argv[3] || '12', 10)
  if (!srcArg) {
    console.error('Usage: node scripts/fetch-sekai-covers.js <page_or_json_urls_comma_separated> [limit]')
    process.exit(1)
  }
  const urls = srcArg.split(',').map(s => s.trim()).filter(Boolean)
  let covers = []
  for (const u of urls) {
    try {
      const body = await fetch(u)
      let list = []
      try {
        const parsed = JSON.parse(body)
        if (Array.isArray(parsed)) list = parsed
        else if (Array.isArray(parsed.images)) list = parsed.images
      } catch (_) {
        list = extractImages(body, u)
      }
      covers.push(...list)
    } catch (err) {}
  }
  covers = Array.from(new Set(covers)).slice(0, limit)
  if (covers.length < 1) {
    console.error('No images found')
    process.exit(2)
  }
  const root = process.cwd()
  writeYamlArray(path.join(root, 'source', '_data', 'images.yml'), covers)
  writeYamlArray(path.join(root, 'source', '_data', 'index_images.yml'), covers)
  updateThemeConfig(path.join(root, 'themes', 'shokax', '_config.yml'), covers)
  console.log('Fetched', covers.length, 'images')
}

if (require.main === module) {
  main()
}
