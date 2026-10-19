'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Save, Upload, ArrowUp, ArrowDown, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'

// Same locales the website serves (fretiko-web src/i18n/config.ts)
const LOCALE_CODES = ['en', 'fr', 'ha', 'yo', 'ig', 'sw', 'am'] as const
type LocaleCode = (typeof LOCALE_CODES)[number]
type L10n = Partial<Record<LocaleCode, string>>

interface SlideForm {
  imageUrl: string
  category: L10n
  title: L10n
  quote: L10n
  author: L10n
}

interface RowForm {
  imageUrl: string
  title: L10n
  description: L10n
  quote: L10n
}

const emptySlide = (): SlideForm => ({ imageUrl: '', category: {}, title: {}, quote: {}, author: {} })
const emptyRow = (): RowForm => ({ imageUrl: '', title: {}, description: {}, quote: {} })

const ROW_SECTIONS = ['row1', 'row2', 'row3'] as const
type RowSection = (typeof ROW_SECTIONS)[number]

// ── Locale-aware text input ──────────────────────────────────────────────
// Text fields store { en: 'x', fr: 'y', ... } — a locale left empty falls
// back to English, then to the website's built-in translation.
function LocaleField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string
  value: L10n
  onChange: (v: L10n) => void
  multiline?: boolean
  placeholder?: string
}) {
  const [loc, setLoc] = useState<LocaleCode>('en')

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs">{label}</Label>
        <div className="flex gap-0.5">
          {LOCALE_CODES.map((c) => {
            const hasValue = !!value[c]?.trim()
            return (
              <button
                key={c}
                type="button"
                onClick={() => setLoc(c)}
                title={hasValue ? `${c.toUpperCase()}: has text` : `${c.toUpperCase()}: empty (falls back)`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase transition-colors ${
                  loc === c
                    ? 'bg-primary text-primary-foreground'
                    : hasValue
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>
      {multiline ? (
        <Textarea
          value={value[loc] || ''}
          onChange={(e) => onChange({ ...value, [loc]: e.target.value })}
          placeholder={placeholder}
          rows={2}
        />
      ) : (
        <Input
          value={value[loc] || ''}
          onChange={(e) => onChange({ ...value, [loc]: e.target.value })}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

// ── Image picker (upload → website-content bucket) ───────────────────────
function ImagePicker({
  value,
  onChange,
  uploading,
  setUploading,
}: {
  value: string
  onChange: (url: string) => void
  uploading: boolean
  setUploading: (v: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be under 10MB', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const result: any = await apiClient.uploadLandingImage(file)
      onChange(result.url || result.publicUrl)
      toast({ title: 'Success', description: 'Image uploaded' })
    } catch (error) {
      console.error('Landing image upload failed:', error)
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Image</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt="Landing content"
            className="w-32 h-20 object-cover rounded-md border"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-32 h-20 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            {value ? 'Replace' : 'Upload'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>
      {!value && <p className="text-xs text-muted-foreground">No image — the website keeps its built-in image.</p>}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────
export default function LandingTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [heroActive, setHeroActive] = useState(true)
  const [slides, setSlides] = useState<SlideForm[]>([])
  const [rows, setRows] = useState<Record<RowSection, { active: boolean; form: RowForm }>>({
    row1: { active: true, form: emptyRow() },
    row2: { active: true, form: emptyRow() },
    row3: { active: true, form: emptyRow() },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await apiClient.getLandingContent()
        const sections: any[] = res?.data || []
        const byKey: Record<string, any> = {}
        for (const s of sections) byKey[s.section] = s

        const hero = byKey.hero
        if (hero) {
          setHeroActive(hero.is_active !== false)
          const stored = Array.isArray(hero.content?.slides) ? hero.content.slides : []
          setSlides(stored.map((s: any) => ({
            imageUrl: s.imageUrl || '',
            category: s.category || {},
            title: s.title || {},
            quote: s.quote || {},
            author: s.author || {},
          })))
        }

        setRows((prev) => {
          const next = { ...prev }
          for (const key of ROW_SECTIONS) {
            const row = byKey[key]
            if (row) {
              next[key] = {
                active: row.is_active !== false,
                form: {
                  imageUrl: row.content?.imageUrl || '',
                  title: row.content?.title || {},
                  description: row.content?.description || {},
                  quote: row.content?.quote || {},
                },
              }
            }
          }
          return next
        })
      } catch (error) {
        console.error('Failed to load landing content:', error)
        toast({ title: 'Error', description: 'Failed to load landing content', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveHero = async () => {
    setSaving('hero')
    try {
      await apiClient.updateLandingSection('hero', {
        isActive: heroActive,
        content: {
          slides: slides.map((s, i) => ({
            imageUrl: s.imageUrl,
            category: s.category,
            title: s.title,
            quote: s.quote,
            author: s.author,
            sortOrder: i,
          })),
        },
      })
      toast({ title: 'Success', description: 'Hero slides saved' })
    } catch (error) {
      console.error('Failed to save hero:', error)
      toast({ title: 'Error', description: 'Failed to save hero slides', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const saveRow = async (key: RowSection) => {
    const row = rows[key]
    setSaving(key)
    try {
      await apiClient.updateLandingSection(key, {
        isActive: row.active,
        content: {
          imageUrl: row.form.imageUrl,
          title: row.form.title,
          description: row.form.description,
          quote: row.form.quote,
        },
      })
      toast({ title: 'Success', description: `Content ${key} saved` })
    } catch (error) {
      console.error(`Failed to save ${key}:`, error)
      toast({ title: 'Error', description: `Failed to save ${key}`, variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const resetSection = async (key: 'hero' | RowSection) => {
    setSaving(key)
    try {
      await apiClient.updateLandingSection(key, { isActive: false, content: {} })
      if (key === 'hero') {
        setSlides([])
        setHeroActive(true)
      } else {
        setRows((prev) => ({ ...prev, [key]: { active: true, form: emptyRow() } }))
      }
      toast({ title: 'Success', description: 'Section reset — website shows its built-in content' })
    } catch (error) {
      console.error(`Failed to reset ${key}:`, error)
      toast({ title: 'Error', description: 'Failed to reset section', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const moveSlide = (index: number, dir: -1 | 1) => {
    setSlides((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const updateSlide = (index: number, patch: Partial<SlideForm>) =>
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const updateRow = (key: RowSection, patch: Partial<RowForm>) =>
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], form: { ...prev[key].form, ...patch } } }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading landing content...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Hero banner ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hero Banner Slides</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => resetSection('hero')} disabled={saving === 'hero'}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset to default
              </Button>
              <Button size="sm" onClick={saveHero} disabled={saving === 'hero'}>
                <Save className="w-4 h-4 mr-1" /> {saving === 'hero' ? 'Saving...' : 'Save Hero'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Overrides the homepage hero carousel. When inactive — or with no slides saved — the website
            shows its built-in slides. A slide needs an image; text fields are optional and can be set
            per language (empty locales fall back to English).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={heroActive}
              onChange={(e) => setHeroActive(e.target.checked)}
              className="rounded"
            />
            Active — use these slides on the website
          </label>

          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              No custom slides — the built-in hero carousel is shown.
            </p>
          )}

          {slides.map((slide, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Slide {i + 1}</Badge>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => moveSlide(i, -1)} disabled={i === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSlides((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ImagePicker
                value={slide.imageUrl}
                onChange={(url) => updateSlide(i, { imageUrl: url })}
                uploading={uploading}
                setUploading={setUploading}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LocaleField
                  label="Category badge"
                  value={slide.category}
                  onChange={(v) => updateSlide(i, { category: v })}
                  placeholder="e.g. DIGITAL"
                />
                <LocaleField
                  label="Author line"
                  value={slide.author}
                  onChange={(v) => updateSlide(i, { author: v })}
                  placeholder="e.g. fretiko philosophy"
                />
                <div className="md:col-span-2">
                  <LocaleField
                    label="Title"
                    value={slide.title}
                    onChange={(v) => updateSlide(i, { title: v })}
                    placeholder="Slide headline"
                  />
                </div>
                <div className="md:col-span-2">
                  <LocaleField
                    label="Quote"
                    value={slide.quote}
                    onChange={(v) => updateSlide(i, { quote: v })}
                    placeholder="Slide quote text"
                    multiline
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={() => setSlides((prev) => [...prev, emptySlide()])}>
            <Plus className="w-4 h-4 mr-1" /> Add Slide
          </Button>
        </CardContent>
      </Card>

      {/* ── Content rows ── */}
      {ROW_SECTIONS.map((key, i) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Content Row {i + 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => resetSection(key)} disabled={saving === key}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset to default
                </Button>
                <Button size="sm" onClick={() => saveRow(key)} disabled={saving === key}>
                  <Save className="w-4 h-4 mr-1" /> {saving === key ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              The alternating image + text block #{i + 1} on the homepage. Empty fields fall back to the
              built-in copy and image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={rows[key].active}
                onChange={(e) => setRows((prev) => ({ ...prev, [key]: { ...prev[key], active: e.target.checked } }))}
                className="rounded"
              />
              Active — apply these overrides on the website
            </label>

            <ImagePicker
              value={rows[key].form.imageUrl}
              onChange={(url) => updateRow(key, { imageUrl: url })}
              uploading={uploading}
              setUploading={setUploading}
            />

            <LocaleField
              label="Title"
              value={rows[key].form.title}
              onChange={(v) => updateRow(key, { title: v })}
              placeholder="Row heading"
            />
            <LocaleField
              label="Description"
              value={rows[key].form.description}
              onChange={(v) => updateRow(key, { description: v })}
              placeholder="Row body text"
              multiline
            />
            <LocaleField
              label="Quote"
              value={rows[key].form.quote}
              onChange={(v) => updateRow(key, { quote: v })}
              placeholder="Blockquote text"
              multiline
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
