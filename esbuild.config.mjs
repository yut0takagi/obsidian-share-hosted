import esbuild from 'esbuild'
const prod = process.argv[2] === 'production'
const ctx = await esbuild.context({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  target: 'es2020',
  outfile: 'main.js',
  sourcemap: prod ? false : 'inline',
  minify: prod,
  treeShaking: true,
  platform: 'browser',
})
if (prod) { await ctx.rebuild(); await ctx.dispose() } else { await ctx.watch() }
