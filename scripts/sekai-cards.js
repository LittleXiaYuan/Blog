const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        get(res.headers.location).then(resolve).catch(reject)
        return
      }
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
  })
}

function args() {
  const a = process.argv.slice(2)
  const opt = { json: 'https://sekai-world.github.io/sekai-master-db-diff/cards.json', region: 'jp', type: 'normal', limit: 12, download: false, bundles: [], res: [], maxNo: 300 }
  for (let i = 0; i < a.length; i++) {
    const k = a[i]
    const v = a[i + 1]
    if (k === '--json') { opt.json = v; i++ }
    else if (k === '--region') { opt.region = v; i++ }
    else if (k === '--type') { opt.type = v; i++ }
    else if (k === '--limit') { opt.limit = parseInt(v || '12', 10); i++ }
    else if (k === '--download') { opt.download = true }
    else if (k === '--character') { opt.character = v.split(',').map(s => parseInt(s.trim(), 10)); i++ }
    else if (k === '--rarity') { opt.rarity = v.split(',').map(s => parseInt(s.trim(), 10)); i++ }
    else if (k === '--bundles') { opt.bundles = v.split(',').map(s => s.trim()); i++ }
    else if (k === '--res') { opt.res = v.split(',').map(s => s.trim()); i++ }
    else if (k === '--maxNo') { opt.maxNo = parseInt(v || '300', 10); i++ }
  }
  return opt
}

function makeUrl(region, bundle, type) {
  const base = 'https://storage.sekai.best'
  const assetRoot = region === 'jp' ? 'sekai-jp-assets' : 'sekai-assets'
  const file = type === 'after' ? 'card_after_training.webp' : type === 'thumb' ? 'card_thumbnail.webp' : 'card_normal.webp'
  return `${base}/${assetRoot}/character/member/${bundle}/${file}`
}

function writeYamlArray(file, arr) {
  const dir = path.dirname(file)
  fs.mkdirSync(dir, { recursive: true })
  const content = arr.map(u => `- ${u}`).join('\n') + '\n'
  fs.writeFileSync(file, content, 'utf8')
}

function fetchToFile(url, file) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchToFile(res.headers.location, file).then(resolve).catch(reject)
        return
      }
      if (!res.statusCode || res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode))
        return
      }
      const ws = fs.createWriteStream(file)
      res.pipe(ws)
      ws.on('finish', () => ws.close(() => resolve()))
      ws.on('error', reject)
    })
    req.on('error', reject)
  })
}

async function downloadToAssets(urls) {
  const outDir = path.join(process.cwd(), 'source', '_data', 'assets', 'sekai')
  fs.mkdirSync(outDir, { recursive: true })
  const toLocal = []
  for (const u of urls) {
    const name = u.split('/').slice(-2).join('_')
    const out = path.join(outDir, name)
    try {
      await fetchToFile(u, out)
      toLocal.push(`/assets/sekai/${name}`)
    } catch (e) {}
  }
  return toLocal
}

async function fromJson(opt) {
  const sources = [
    opt.json,
    'https://sekai-world.github.io/sekai-master-db-diff/cards.json',
    'https://storage.sekai.best/sekai-master-db-diff/cards.json',
    'https://cdn.jsdelivr.net/gh/Sekai-World/sekai-master-db-diff@main/cards.json',
    'https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/main/cards.json'
  ]
  let data
  for (const src of sources) {
    try {
      if (src.startsWith('http')) {
        const body = await get(src)
        data = JSON.parse(body)
      } else {
        const body = fs.readFileSync(path.resolve(process.cwd(), src), 'utf-8')
        data = JSON.parse(body)
      }
      break
    } catch (_) {}
  }
  if (!data) {
    // local fallback
    const localPaths = [
      path.join('scripts', 'cache', 'cards.json'),
      path.join('source', '_data', 'sekai', 'cards.json')
    ]
    for (const p of localPaths) {
      try {
        const body = fs.readFileSync(path.resolve(process.cwd(), p), 'utf-8')
        data = JSON.parse(body)
        break
      } catch (_) {}
    }
  }
  if (!data) throw new Error('cards.json fetch failed')
  let list = data
  if (opt.character) list = list.filter(c => opt.character.includes(c.characterId))
  if (opt.rarity) {
    list = list.filter(c => {
      const rnum = typeof c.rarity === 'number' ? c.rarity : null
      const rstr = typeof c.cardRarityType === 'string' ? c.cardRarityType : ''
      const okNum = rnum != null && opt.rarity.includes(rnum)
      const okStr = rstr && opt.rarity.includes(parseInt(rstr.replace('rarity_', ''), 10))
      return okNum || okStr
    })
  }
  const bundles = list.map(c => c.assetbundleName)
  return bundles
}

function pad3(n) { return String(n).padStart(3, '0') }

async function scanBundles(opt) {
  const fileAfter = 'card_after_training.webp'
  const fileNormal = opt.type === 'thumb' ? 'card_thumbnail.webp' : 'card_normal.webp'
  const base = 'https://storage.sekai.best/' + (opt.region === 'jp' ? 'sekai-jp-assets' : 'sekai-assets') + '/character/member/'
  const found = []
  for (const r of opt.res) {
    for (let i = opt.maxNo; i >= 1 && found.length < opt.limit; i--) {
      const bundle = `res${r}_no${pad3(i)}`
      const urlAfter = base + bundle + '/' + fileAfter
      const urlNormal = base + bundle + '/' + fileNormal
      try {
        const tmp = path.join(process.cwd(), '.tmp_check')
        await fetchToFile(urlAfter, tmp)
        try { fs.unlinkSync(tmp) } catch {}
        found.push(bundle)
      } catch (_) {
        try {
          const tmp2 = path.join(process.cwd(), '.tmp_check2')
          await fetchToFile(urlNormal, tmp2)
          try { fs.unlinkSync(tmp2) } catch {}
          // prefer after-image bundles; if only normal exists, add but lower chance to be 4*
          found.push(bundle)
        } catch (e2) {}
      }
    }
  }
  return Array.from(new Set(found))
}

async function main() {
  const opt = args()
  let bundles = opt.bundles
  if (!bundles.length) {
    try { bundles = await fromJson(opt) } catch (e) {}
    if (!bundles.length && opt.res && opt.res.length) {
      try { bundles = await scanBundles(opt) } catch (_) {}
    }
  }
  bundles = Array.from(new Set(bundles)).slice(0, opt.limit)
  if (!bundles.length) {
    console.error('No bundles found. Use --bundles or provide a valid --json.')
    process.exit(1)
  }
  const urls = bundles.map(b => makeUrl(opt.region, b, opt.type))
  let final = urls
  if (opt.download) final = await downloadToAssets(urls)
  writeYamlArray(path.join(process.cwd(), 'source', '_data', 'images.yml'), final)
  writeYamlArray(path.join(process.cwd(), 'source', '_data', 'index_images.yml'), final)
  console.log('Prepared', final.length, 'cover images')
}

if (require.main === module) {
  main()
}
