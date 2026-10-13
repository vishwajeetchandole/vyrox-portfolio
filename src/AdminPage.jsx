import { useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Download, ImagePlus, Plus, Save, Trash2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { isMemberBackup, isTeamMemberBackup } from './data/teamValidation'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#090611] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#716a80] focus:border-violet-300/50'
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition hover:border-violet-300/40 hover:bg-violet-500/10'

function linesFrom(value) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function tagsFrom(value) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.readAsDataURL(blob)
  })
}

async function prepareImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.')
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 15 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const compressedImage = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The selected image could not be processed.'))
    }, 'image/webp', 0.84)
  })

  if (compressedImage.size > 1.5 * 1024 * 1024) {
    throw new Error('This image is still too large after compression. Choose a smaller image.')
  }
  return readAsDataUrl(compressedImage)
}

function Field({ label, value, onChange, multiline = false, rows = 3, placeholder = '' }) {
  const Element = multiline ? 'textarea' : 'input'
  return (
    <label className="block text-xs font-medium text-[#D9D4ED]">
      {label}
      <Element
        className={`${inputClass} ${multiline ? 'resize-y leading-6' : ''}`}
        rows={multiline ? rows : undefined}
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function ImageField({ label, image, onChange, onError }) {
  async function handleFileChange(event) {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) return

    try {
      onChange(await prepareImage(file))
      onError('')
    } catch (error) {
      onError(error.message || 'Could not process this image.')
    }
  }

  return (
    <div>
      <span className="text-xs font-medium text-[#D9D4ED]">{label}</span>
      {image ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <img src={image} alt={`${label} preview`} className="max-h-64 w-full object-contain" />
        </div>
      ) : (
        <div className="mt-2 flex h-28 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/10 text-xs text-[#8C849B]">
          No image selected
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className={`${buttonClass} cursor-pointer`}>
          <ImagePlus size={14} /> Choose image
          <input className="sr-only" type="file" accept="image/*" onChange={handleFileChange} />
        </label>
        {image ? (
          <button type="button" className={buttonClass} onClick={() => onChange('')}>
            <Trash2 size={14} /> Remove image
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Section({ title, description, action, children }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[#100B18]/80 p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-2 text-sm text-[#A6A0B5]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function emptyProject() {
  return { title: '', description: '', image: '', techStack: [] }
}

function emptyAchievement() {
  return { title: '', description: '', image: '' }
}

function emptyCertificate() {
  return { title: '', description: '', image: '' }
}

export default function AdminPage({
  members,
  onSave,
  theme,
  onToggleTheme,
  backendReady,
  editorToken,
  onAuthenticate,
  onLogout,
}) {
  const [selectedSlug, setSelectedSlug] = useState(members[0]?.slug || '')
  const selectedMember = members.find((member) => member.slug === selectedSlug)
  const [draft, setDraft] = useState(selectedMember)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState('member')
  const [password, setPassword] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name'
        ? { initials: value.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() }
        : {}),
    }))
    setIsDirty(true)
    setNotice('')
  }

  function updateLink(field, value) {
    setDraft((current) => ({
      ...current,
      links: { ...current.links, [field]: value },
    }))
    setIsDirty(true)
    setNotice('')
  }

  function updateItem(field, index, key, value) {
    setDraft((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
    setIsDirty(true)
    setNotice('')
  }

  function addItem(field, item) {
    setDraft((current) => ({ ...current, [field]: [...current[field], item] }))
    setIsDirty(true)
    setNotice('')
  }

  function removeItem(field, index) {
    setDraft((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }))
    setIsDirty(true)
    setNotice('')
  }

  function moveItem(field, index, direction) {
    const offset = direction === 'up' ? -1 : 1
    const nextIndex = index + offset

    if (nextIndex < 0 || nextIndex >= (draft[field] || []).length) {
      return
    }

    setDraft((current) => {
      const items = [...current[field]]
      const [movedItem] = items.splice(index, 1)
      items.splice(nextIndex, 0, movedItem)

      return {
        ...current,
        [field]: items,
      }
    })
    setIsDirty(true)
    setNotice('')
  }

  function updateRecognitionItem(kind, index, key, value) {
    const field = kind === 'achievement' ? 'achievements' : 'certificates'
    updateItem(field, index, key, value)
  }

  function addRecognitionItem(kind, item) {
    const field = kind === 'achievement' ? 'achievements' : 'certificates'
    addItem(field, item)
  }

  function removeRecognitionItem(kind, index) {
    const field = kind === 'achievement' ? 'achievements' : 'certificates'
    removeItem(field, index)
  }

  function moveRecognitionItem(kind, index, direction) {
    const field = kind === 'achievement' ? 'achievements' : 'certificates'
    moveItem(field, index, direction)
  }

  function selectMember(event) {
    if (isSaving) return
    const nextSlug = event.target.value
    if (isDirty && !window.confirm('Discard unsaved changes for this member?')) return
    setDraft(members.find((member) => member.slug === nextSlug))
    setSelectedSlug(nextSlug)
    setIsDirty(false)
    setError('')
    setNotice('')
  }

  async function saveMember(event) {
    event.preventDefault()
    if (!draft || isSaving) return

    const updatedMembers = members.map((member) => member.slug === draft.slug ? draft : member)
    setIsSaving(true)
    try {
      const result = await onSave(updatedMembers, {
        memberSlug: draft.slug,
        baseMember: members.find((member) => member.slug === draft.slug),
      })
      setIsDirty(false)
      setNotice(result.remote
        ? 'Profile saved to the shared repository. The hosted site will update when its deployment finishes.'
        : 'Profile saved in this browser only. Configure the hosted backend to share it and update the live site.')
      setError('')
    } catch (saveError) {
      console.error('Could not save VYROX member information.', saveError)
      setError(saveError.message || 'Could not save the profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function authenticate(event) {
    event.preventDefault()
    setIsAuthenticating(true)
    setError('')
    try {
      await onAuthenticate(username, password)
      setPassword('')
    } catch (authError) {
      setError(authError.message || 'Could not sign in to the shared profile editor.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  function downloadBackup() {
    if (isDirty) {
      setError('Save your changes before downloading the full-team backup.')
      return
    }

    const file = new Blob([JSON.stringify(members, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'vyrox-team-members.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function downloadMemberBackup() {
    if (isDirty) {
      setError('Save your changes before exporting this member profile.')
      return
    }

    const member = members.find((item) => item.slug === selectedSlug)
    if (!member) {
      setError('Could not find the selected member profile.')
      return
    }

    const file = new Blob([JSON.stringify(member, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `vyrox-${member.slug}-profile.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function importBackup(event, singleMemberOnly = false) {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file || isSaving) return
    if (isDirty && !window.confirm('Discard unsaved changes and load this backup?')) return

    try {
      const importedData = JSON.parse(await file.text())
      let updatedMembers
      let successMessage
      let saveOptions

      if (Array.isArray(importedData)) {
        if (singleMemberOnly) {
          throw new Error('Choose a profile file for the selected member, not a full-team backup.')
        }
        if (!isMemberBackup(importedData, members)) {
          throw new Error('This backup does not contain valid information for the current team.')
        }
        updatedMembers = importedData
        saveOptions = { replaceAll: true }
        successMessage = 'Full-team backup imported and saved in this browser.'
      } else {
        if (singleMemberOnly && importedData?.slug !== selectedSlug) {
          throw new Error('This profile file is not for the selected member.')
        }
        const existingMember = members.find((member) => member.slug === importedData?.slug)
        if (!existingMember || !isTeamMemberBackup(importedData)) {
          throw new Error('This file does not contain a valid profile for a current team member.')
        }
        updatedMembers = members.map((member) => member.slug === importedData.slug ? importedData : member)
        saveOptions = { memberSlug: importedData.slug, baseMember: existingMember }
        successMessage = `${importedData.name}'s profile imported and saved in this browser.`
      }

      const result = await onSave(updatedMembers, saveOptions)
      const savedMembers = result.members || updatedMembers
      setDraft(savedMembers.find((member) => member.slug === selectedSlug))
      setIsDirty(false)
      setError('')
      setNotice(result.remote
        ? 'Profile backup saved to the shared repository. The hosted site will update when its deployment finishes.'
        : successMessage)
    } catch (importError) {
      console.error('Could not import VYROX member backup.', importError)
      setError(importError.message || 'Could not import this backup file.')
    }
  }

  if (!editorToken) {
    return (
      <main className="min-h-screen bg-[#07060B] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-[1.5rem] border border-white/10 bg-[#100B18]/80 p-6 sm:p-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-violet-200">
            <ArrowLeft size={14} /> Back to website
          </Link>
          <p className="text-[10px] uppercase tracking-[0.32em] text-violet-200/80">VYROX team admin</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">Sign in to edit profiles</h1>
          <p className="mt-3 text-sm leading-6 text-[#A6A0B5]">
            Use the site admin credentials to manage the shared team profiles.
          </p>
          <form className="mt-6 space-y-4" onSubmit={authenticate}>
            <label className="block text-xs font-medium text-[#D9D4ED]">
              Username
              <input
                autoComplete="username"
                className={inputClass}
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block text-xs font-medium text-[#D9D4ED]">
              Password
              <input
                autoComplete="current-password"
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
            <button type="submit" disabled={isAuthenticating} className={`${buttonClass} w-full disabled:cursor-wait disabled:opacity-60`}>
              {isAuthenticating ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (!draft) {
    return <main className="min-h-screen bg-[#07060B] p-8 text-white">No team members are available to edit.</main>
  }

  return (
    <main className="min-h-screen bg-[#07060B] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-violet-200">
              <ArrowLeft size={14} /> Back to website
            </Link>
            <p className="text-[10px] uppercase tracking-[0.32em] text-violet-200/80">VYROX team admin</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Member profile editor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A6A0B5]">
              Add each member’s profile details, project work, achievements, certificates, and images.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <label className={`${buttonClass} cursor-pointer`}>
              <Upload size={14} /> Import backup
              <input className="sr-only" type="file" accept="application/json,.json" onChange={importBackup} />
            </label>
            <button type="button" className={buttonClass} onClick={downloadBackup}>
              <Download size={14} /> Download backup
            </button>
            <button type="button" className={buttonClass} onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-violet-300/15 bg-violet-500/5 p-4 text-sm leading-6 text-[#D9D4ED]">
          {backendReady
            ? 'Save your profile to commit it to the connected GitHub repository. Vercel will redeploy the site automatically; each member update is merged with the latest saved profiles.'
            : 'The shared backend is unavailable, so saves on this page stay in this browser only. Configure the Vercel/GitHub settings described in README.md to share edits and update the hosted site.'}
          {' '}Images are compressed before saving. Shared profile data is limited to 3 MB total.
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-[1.5rem] border border-white/10 bg-[#100B18]/80 p-5">
          <label className="min-w-56 flex-1 text-xs font-medium text-[#D9D4ED]">
            Select member
            <select className={inputClass} value={selectedSlug} onChange={selectMember} disabled={isSaving}>
              {members.map((member) => <option key={member.slug} value={member.slug}>{member.name}</option>)}
            </select>
          </label>
          <span className="text-xs text-[#A6A0B5]">{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <button type="button" className={buttonClass} onClick={downloadMemberBackup}>
            <Download size={14} /> Export this member
          </button>
          <label className={`${buttonClass} cursor-pointer`}>
            <Upload size={14} /> Import this member
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => importBackup(event, true)}
            />
          </label>
        </div>

        <form className="space-y-6" onSubmit={saveMember}>
          <fieldset disabled={isSaving} className="space-y-6 disabled:opacity-80">
          <Section title="Member details" description="Name, role, short profile, and portrait.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Member name" value={draft.name} onChange={(value) => updateField('name', value)} />
              <Field label="Role" value={draft.role} onChange={(value) => updateField('role', value)} />
              <Field label="Profile headline" value={draft.title} onChange={(value) => updateField('title', value)} />
              <Field label="About me" value={draft.aboutMe} onChange={(value) => updateField('aboutMe', value)} multiline rows={4} />
              <Field label="Profile introduction" value={draft.intro} onChange={(value) => updateField('intro', value)} multiline rows={4} />
              <Field label="Gmail address" value={draft.links.email} onChange={(value) => updateLink('email', value)} placeholder="name@example.com" />
              <Field label="LinkedIn URL" value={draft.links.linkedin} onChange={(value) => updateLink('linkedin', value)} placeholder="https://www.linkedin.com/in/..." />
              <Field label="GitHub URL" value={draft.links.github} onChange={(value) => updateLink('github', value)} placeholder="https://github.com/..." />
              <Field label="Portfolio URL (optional)" value={draft.links.portfolio} onChange={(value) => updateLink('portfolio', value)} placeholder="https://..." />
              <ImageField label="Member photo" image={draft.image} onChange={(value) => updateField('image', value)} onError={setError} />
            </div>
          </Section>

          <Section title="Strengths" description="Enter one strength per line.">
            <Field label="Strengths" value={(draft.strengths || []).join('\n')} onChange={(value) => updateField('strengths', linesFrom(value))} multiline rows={5} placeholder="e.g. Product design" />
          </Section>

          <Section
            title="Projects"
            description="Add a project cover image, title, description, and technology stack for this member."
            action={<button type="button" className={buttonClass} onClick={() => addItem('projects', emptyProject())}><Plus size={14} /> Add project</button>}
          >
            <div className="space-y-5">
              {draft.projects.map((project, index) => (
                <div key={`project-${index}`} className="grid gap-5 rounded-2xl border border-white/10 bg-black/10 p-4 md:grid-cols-2">
                  <Field label="Project title" value={project.title} onChange={(value) => updateItem('projects', index, 'title', value)} />
                  <Field label="Technology stack (comma-separated)" value={(project.techStack || project.tags || []).join(', ')} onChange={(value) => updateItem('projects', index, 'techStack', tagsFrom(value))} />
                  <Field label="Project description" value={project.description} onChange={(value) => updateItem('projects', index, 'description', value)} multiline rows={4} />
                  <ImageField label="Project header image" image={project.image} onChange={(value) => updateItem('projects', index, 'image', value)} onError={setError} />
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${buttonClass} ${index === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => moveItem('projects', index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp size={14} /> Move up
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} ${index === draft.projects.length - 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => moveItem('projects', index, 'down')}
                        disabled={index === draft.projects.length - 1}
                      >
                        <ArrowDown size={14} /> Move down
                      </button>
                    </div>
                    <button type="button" className={buttonClass} onClick={() => removeItem('projects', index)}><Trash2 size={14} /> Remove project</button>
                  </div>
                </div>
              ))}
              {!draft.projects.length ? <p className="text-sm text-[#A6A0B5]">No projects added yet.</p> : null}
            </div>
          </Section>

          <Section
            title="Achievements & Certificates"
            description="Add an achievement or certificate, including optional images and descriptions."
            action={(
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} onClick={() => addRecognitionItem('achievement', emptyAchievement())}><Plus size={14} /> Add achievement</button>
                <button type="button" className={buttonClass} onClick={() => addRecognitionItem('certificate', emptyCertificate())}><Plus size={14} /> Add certificate</button>
              </div>
            )}
          >
            <div className="space-y-5">
              {[
                ...(draft.achievements || []).map((achievement, index) => ({ ...achievement, type: 'achievement', index })),
                ...(draft.certificates || []).map((certificate, index) => ({ ...certificate, type: 'certificate', index })),
              ].map((item) => (
                <div key={`${item.type}-${item.index}`} className="grid gap-5 rounded-2xl border border-white/10 bg-black/10 p-4 md:grid-cols-2">
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-100">
                      {item.type === 'achievement' ? 'Achievement' : 'Certificate'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${buttonClass} ${item.index === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => moveRecognitionItem(item.type, item.index, 'up')}
                        disabled={item.index === 0}
                      >
                        <ArrowUp size={14} /> Move up
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} ${((item.type === 'achievement' ? (draft.achievements || []).length : (draft.certificates || []).length) - 1 === item.index) ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => moveRecognitionItem(item.type, item.index, 'down')}
                        disabled={((item.type === 'achievement' ? (draft.achievements || []).length : (draft.certificates || []).length) - 1 === item.index)}
                      >
                        <ArrowDown size={14} /> Move down
                      </button>
                      <button type="button" className={buttonClass} onClick={() => removeRecognitionItem(item.type, item.index)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                  <Field
                    label={`${item.type === 'achievement' ? 'Achievement' : 'Certificate'} title`}
                    value={item.title}
                    onChange={(value) => updateRecognitionItem(item.type, item.index, 'title', value)}
                  />
                  <Field
                    label={item.type === 'achievement' ? 'Description' : 'Description (optional)'}
                    value={item.description}
                    onChange={(value) => updateRecognitionItem(item.type, item.index, 'description', value)}
                    multiline rows={item.type === 'achievement' ? 4 : 3}
                  />
                  <div className="md:col-span-2">
                    <ImageField
                      label={`${item.type === 'achievement' ? 'Achievement' : 'Certificate'} image`}
                      image={item.image}
                      onChange={(value) => updateRecognitionItem(item.type, item.index, 'image', value)}
                      onError={setError}
                    />
                  </div>
                </div>
              ))}
              {!((draft.achievements || []).length + (draft.certificates || []).length) ? <p className="text-sm text-[#A6A0B5]">No achievements or certificates added yet.</p> : null}
            </div>
          </Section>

          <Section title="Experience" description="Enter one experience item per line.">
            <Field label="Experience" value={(draft.experience || []).join('\n')} onChange={(value) => updateField('experience', linesFrom(value))} multiline rows={6} placeholder="Role, contribution, or relevant experience" />
          </Section>

          {error ? <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
          {notice ? <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{notice}</p> : null}
          <div className="sticky bottom-4 flex justify-end rounded-2xl border border-white/10 bg-[#100B18]/95 p-3 shadow-2xl backdrop-blur">
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">
              <Save size={15} /> {isSaving ? 'Saving…' : 'Save member details'}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </main>
  )
}
