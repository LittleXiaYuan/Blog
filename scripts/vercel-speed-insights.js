/**
 * Vercel Speed Insights Integration for Hexo
 * 
 * This script injects the Vercel Speed Insights tracking script into the theme
 * using the ShokaX theme's inject system.
 */

hexo.extend.filter.register('theme_inject', function(injects) {
  // Inject Speed Insights script at the end of the body
  // This ensures the script loads after the page content
  injects.bodyEnd.raw('vercel-speed-insights', `script(src="/_vercel/speed-insights/script.js" defer)`, {}, {}, 999);
});
