---
title: 给Hexo接入Sekai.best:使用卡面作为文章封面
date: 2025-12-05 10:00:00
categories:
  - 技术
tags:
  - Hexo
  - ShokaX
  - Sekai
  - 博客美化
---

> “哭泣的闪光刺痛双眼、随后离别的钟声开始响起。”

嗨！大家好久不见w！最近想把我的小破站博客复活一下，从旧平台迁到了 Hexo
结果在配图的时候我就**炸毛**了！一张一张去 sekai.best 上存 **25时的卡面**作为封面？**太累了吧啊啊啊啊！**（小鸟尖叫）

于是乎！我折腾了一整晚，终于把 Sekai.best 的卡面接入流程**工程化**了！以后我的博客文章没有封面图时，就能自动从我的 **25时** 的图库里随机抽一张当占位封面了的说

全文覆盖“怎么搞到图→怎么缓存→怎么配主题→怎么让它跑得快”，辅以一些小小的**踩坑记**和本鸟的**碎碎念**！


## 效果目标
- 首页与页面顶部轮播图：统一使用25时的四星卡面
- 文章默认封面：当文章没有手动设置封面时，自动从同一卡面集合中选取


## 准备
- Node.js、Hexo、ShokaX主题
- 本次以ShokaX为例

## 原理与通用接入

接入的核心在于数据解析与资源路径映射。

- **数据源解析**：从 `cards.json` 文件中读取卡片元数据。关注的关键字段包括 `assetbundleName`（如 `res021_no010`）、`characterId`（角色身份）和 `rarity` 或 `cardRarityType`（稀有度）。该 JSON 文件可通过 Sekai-World 等镜像仓库获取。

- **URL 规则映射**：图片地址由区域、资源包名与文件名拼接：
  ```
  https://storage.sekai.best/<sekai-jp-assets|sekai-assets>/character/member/<assetbundleName>/<card_after_training.webp|card_normal.webp|card_thumbnail.webp>
  ```
  优先使用 `card_after_training.webp`，缺失时回退到 `card_normal.webp` 或 `card_thumbnail.webp`。

- **卡片选择与集合构建**：
    1.  筛选满足指定条件的卡片（例如：25時角色 `characterId=21, 22, 23, 24`；稀有度 `rarity=4`）。
    2.  将筛选后的卡片集合映射为一组可用的图片 URL 列表 (`CoverList`)。

- **缓存策略选择**：
    1.  **远程直链**：在生成阶段或运行时直接引用外部 URL。优点是部署简单，但依赖外部网络环境和稳定性。
    2.  **本地镜像**：在生成阶段将图片下载至本地静态资源目录（如 Hexo 的 `source/assets`）。优点是避免网络抖动和外部链接失效，提升稳定性。

- **模板接入逻辑（文章占位）**：
    文章默认封面的选取需要**稳定**，即同一篇文章始终获得同一张占位图。采用稳定哈希：
    ```
    idx = hash(page.slug || page.permalink) % images.length
    cover = page.cover || CoverList[idx]
    ```

- **性能与兼容性**：优先使用 WebP 格式，并确保对不支持 WebP 的浏览器有 JPG/PNG 的回退机制。

## 接入步骤（任意博客）
这个流程其实很通用，无论你用的是 Hexo、Hugo 还是 Jekyll，思路都一样啦！

- **数据文件放置**：将筛选并构建好的图片 URL 列表放置于博客的数据源管理文件内，例如 Hexo 的 `_data/images.yml`。
- **首页轮播配置**：在主题模板中对该列表进行遍历，输出 `<img>` 元素或配置为 CSS 背景图，以实现轮播效果。建议列表长度 $N \ge 6$ 张，以保证轮播效果的平滑稳定。
- **文章封面占位实现**：在文章渲染模板中，利用上文定义的**稳定哈希**逻辑，在文章未手动设置 `cover` 字段时，从列表中选取对应的图片 URL 作为占位图。
- **资源处理**：根据缓存策略，决定是引用远程 URL 还是本地镜像文件路径。
- **性能优化**：为首页首张图片添加 `<link rel="preload" as="image">` 标签，提升首屏加载速度（LCP 优化）。

## WordPress 简易接入
当然，如果用的是 WordPress 这种巨型框架，操作会更偏向 PHP 逻辑。

- **资源生成**：使用命令行工具（例如 `sekai-cover-kit`）生成列表与资源：
    ```bash
    node sekai-cover-kit/bin/sekai-cover-kit.js --character 21,22,23,24 --rarity 4 --type after --limit 12 --format json --out wp-sekai --download --assets wp-content/uploads/sekai
    ```
- **文件放置**：将生成的 `wp-sekai/images.json` 移动至 WordPress 的资源目录，如 `wp-content/uploads/sekai/images.json`。
- **模板遍历与占位封面（`functions.php`）**：在主题的 `functions.php` 文件中增加以下 PHP 函数来实现数据读取、预加载和稳定占位：
    ```php
    // 读取图片列表
    function sekai_cover_list() {
      $file = WP_CONTENT_DIR . '/uploads/sekai/images.json';
      if (!file_exists($file)) return [];
      $json = file_get_contents($file);
      $list = json_decode($json, true);
      return is_array($list) ? $list : [];
    }

    // 添加预加载标签
    add_action('wp_head', function() {
      $list = sekai_cover_list();
      if ($list) {
        echo '<link rel="preload" as="image" href="' . esc_url($list[0]) . '">';
      }
    });

    // 文章封面占位逻辑
    function sekai_post_cover() {
      $list = sekai_cover_list();
      if (has_post_thumbnail()) {
        echo get_the_post_thumbnail(null, 'large');
        return;
      }
      if (!$list) return;
      // 使用 crc32 对文章 ID 进行稳定哈希
      $key = get_the_ID();
      $idx = abs(crc32((string)$key)) % count($list);
      echo '<img src="' . esc_url($list[$idx]) . '" alt="">';
    }
    ```
- **首页轮播短代码（`functions.php`）**：
    ```php
    add_shortcode('sekai_cover_slider', function() {
      $list = sekai_cover_list();
      if (!$list) return '';
      $html = '<div class="sekai-slider">';
      foreach ($list as $src) {
        $html .= '<img src="' . esc_url($src) . '" alt="">';
      }
      $html .= '</div>';
      return $html;
    });
    ```
- **调用方式**：在文章或页面中插入 `[sekai_cover_slider]`，或在主题循环内调用 `sekai_post_cover()` 作为默认封面。

### 渲染与性能（LCP 优化）
LCP（Largest Contentful Paint）性能优化至关重要，尤其对于首屏加载的大图。

- **首图预加载**：使用 `<link rel="preload" as="image">` 确保首页首张图片被浏览器尽早获取。
- **单图 vs 轮播**：固定单图的 LCP 表现通常更稳定、可预测；而多图轮播虽然能增加氛围，但可能因资源过多而略微延长 LCP。选择应基于主题氛围和性能目标进行权衡。
- **格式与回退**：优先采用高效的 WebP 格式，并在资源不存在时，应有明确的 Fallback 机制回退到 JPEG/PNG。同时，应避免过度压缩导致的图像细节损失。

> 如果你关心首页的“首屏速度”，固定单图会更稳；如果你在意“氛围”，六图轮播更有呼吸感。两条路都对，看你当天的心情。（歪头笑）

## 生成与预览
 Hexo 的调试流程很简单啦！
```bash
npx hexo g # 生成静态文件
npx hexo s # 开启本地预览服务器
# 打开浏览器访问本地预览地址
```
## 常见问题

- 没有图片或“卡住”：列表数量过低会影响轮播与随机策略，建议至少 6 张。

- 网络受限：优先使用本地镜像；为 `cards.json` 配置本地备份文件。

- 图像缺失：当 `after_training.webp` 404，回退到 `card_normal.webp` 或 `card_thumbnail.webp`。
 
### 踩坑记（简要）

- 固定 vs 轮播：首页要快速就用单图，要氛围就用 6 图轮播，两条路都对。

- 回退策略：after 图缺失时，normal/thumb 通常可用；多留一手，避免空白图。

- 列表一致性：不同页面统一使用同一套列表，视觉更稳定。
 
折腾了下挺好玩的，给有需要的人吧，代码会丢到Github仓库的

Sekai Cover Kit：https://github.com/LittleXiaYuan/sekai-cover-kit
