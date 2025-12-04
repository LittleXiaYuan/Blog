const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

function parseInput() {
  const arg = process.argv[2] || process.env.SEKAI_COVERS || ''
  const list = arg
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (list.length < 1) {
    console.error('No cover URLs provided. Usage: node scripts/update-sekai-covers.js "url1,url2,..."')
    process.exit(1)
  }
  return list
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

function main() {
  const covers = parseInput()
  const root = process.cwd()
  writeYamlArray(path.join(root, 'source', '_data', 'images.yml'), covers)
  writeYamlArray(path.join(root, 'source', '_data', 'index_images.yml'), covers)
  updateThemeConfig(path.join(root, 'themes', 'shokax', '_config.yml'), covers)
  console.log('Updated cover sources with', covers.length, 'URLs')
}

if (require.main === module) {
  main()
}
