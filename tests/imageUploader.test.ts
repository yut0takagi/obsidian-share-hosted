import { describe, it, expect, vi } from 'vitest'
import { TFile } from 'obsidian'
import { ImageUploader, MAX_UPLOAD_BYTES } from '../src/upload/ImageUploader'
import { markdownToHtml } from '../src/render/markdownToHtml'

function file(path: string, size = 4): TFile {
  const f = new TFile()
  f.path = path
  f.name = path.split('/').pop()!
  f.extension = f.name.split('.').pop()!.toLowerCase()
  f.stat = { size, ctime: 0, mtime: 0 }
  return f
}

function fakeApp(files: TFile[]) {
  const byName = new Map(files.map((f) => [f.name, f]))
  return {
    vault: {
      getAbstractFileByPath: (p: string) => files.find((f) => f.path === p) ?? null,
      readBinary: vi.fn(async (f: TFile) => new Uint8Array(new TextEncoder().encode(f.path)).buffer),
    },
    metadataCache: {
      getFirstLinkpathDest: (link: string) => byName.get(link) ?? files.find((f) => f.path === link) ?? null,
    },
  }
}

function fakeApi() {
  return { uploadAsset: vi.fn(async (_b: ArrayBuffer, hash: string, ext: string, _type: string) => ({ hash, ext, url: `/a/${hash}.${ext}` })) }
}

describe('ImageUploader', () => {
  it('uploads images embedded with ![[...]] and maps them to /a/ paths', async () => {
    const app = fakeApp([file('attachments/Pasted image 1.png')])
    const api = fakeApi()
    const html = markdownToHtml('![[Pasted image 1.png]]')
    const { map, skipped } = await new ImageUploader(app as any, api as any).uploadImagesIn(html, 'Note.md')
    expect(api.uploadAsset).toHaveBeenCalledTimes(1)
    const [, hash, ext, type] = api.uploadAsset.mock.calls[0]
    expect(hash).toMatch(/^[a-f0-9]{32}$/)
    expect(ext).toBe('png')
    expect(type).toBe('image/png')
    expect(map.get('Pasted%20image%201.png')).toBe(`/a/${hash}.png`)
    expect(skipped).toEqual([])
    expect(ImageUploader.rewriteImageSrcs(html, map)).toContain(`src="/a/${hash}.png"`)
  })

  it('uploads SVG files as image/svg+xml (the Worker serves them sandboxed)', async () => {
    const app = fakeApp([file('logo.svg')])
    const api = fakeApi()
    const { map, skipped } = await new ImageUploader(app as any, api as any).uploadImagesIn('<img src="logo.svg" alt="">', 'Note.md')
    expect(api.uploadAsset).toHaveBeenCalledTimes(1)
    expect(api.uploadAsset.mock.calls[0][3]).toBe('image/svg+xml')
    expect(map.size).toBe(1)
    expect(skipped).toEqual([])
  })

  it('skips types the Worker does not take', async () => {
    const app = fakeApp([file('scan.bmp')])
    const api = fakeApi()
    const { skipped } = await new ImageUploader(app as any, api as any).uploadImagesIn('<img src="scan.bmp" alt="">', 'Note.md')
    expect(api.uploadAsset).not.toHaveBeenCalled()
    expect(skipped).toEqual(['scan.bmp'])
  })

  it('skips images over the upload limit instead of failing the share', async () => {
    const app = fakeApp([file('huge.png', MAX_UPLOAD_BYTES + 1)])
    const api = fakeApi()
    const { skipped } = await new ImageUploader(app as any, api as any).uploadImagesIn('<img src="huge.png" alt="">', 'Note.md')
    expect(api.uploadAsset).not.toHaveBeenCalled()
    expect(skipped).toEqual(['huge.png'])
  })

  it('ignores remote and already-uploaded images', async () => {
    const api = fakeApi()
    await new ImageUploader(fakeApp([]) as any, api as any).uploadImagesIn('<img src="https://example.com/x.png"><img src="/a/abc.png">', 'Note.md')
    expect(api.uploadAsset).not.toHaveBeenCalled()
  })
})
