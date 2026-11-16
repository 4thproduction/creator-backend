import { useEffect, useState } from 'react'
import axios from '../utils/api'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Alert, Snackbar } from '@mui/material'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const categories = ['Travel', 'Food', 'Fashion', 'Luxury Lifestyle', 'Beauty', 'Wellness', 'Parenting', 'Hospitality', 'Business', 'Technology', 'Entertainment', 'Photography', 'Other']
const collaborations = ['Barter Collaborations', 'Paid Collaborations', 'Affiliate Collaborations', 'Event Invitations', 'Brand Ambassadorships', 'Long-Term Partnerships']
const capabilities = ['Reels', 'Static Posts', 'Stories', 'Carousels', 'YouTube Shorts', 'Long-form Videos', 'Blog Articles', 'Photography', 'Drone Videos', 'Product Reviews', 'UGC Content']
const field = (label, key, options = {}) => ({ label, key, ...options })
const sections = [
  { title: 'Basic Details', fields: [field('Full name', 'fullName', { required: true }), field('Email', 'email', { type: 'email', required: true }), field('Mobile', 'mobile', { required: true }), field('City', 'city', { required: true }), field('State', 'state'), field('Age group', 'ageGroup', { choices: ['18-24', '25-34', '35-44', '45+'], multiple: true })] },
  { title: 'Creator Profile', fields: [field('Category', 'category', { choices: categories, multiple: true, required: true }), field('Introduction', 'intro', { type: 'textarea' }), field('Unique content', 'unique', { type: 'textarea' })] },
  { title: 'Platform Details', fields: [field('Instagram profile', 'igLink', { groupedRequired: true }), field('Instagram followers', 'igFollowers'), field('Average reel views', 'avgReel'), field('Average story views', 'avgStory'), field('Highest reel views', 'highestReel'), field('YouTube channel', 'ytLink', { groupedRequired: true }), field('YouTube subscribers', 'ytSubs'), field('YouTube average views', 'ytAvgViews'), field('Facebook page', 'fbLink', { groupedRequired: true }), field('Facebook followers', 'fbFollowers'), field('Facebook average views', 'fbAvgViews'), field('LinkedIn profile', 'liLink', { groupedRequired: true }), field('LinkedIn followers', 'liFollowers'), field('LinkedIn average views', 'liAvgViews'), field('Website or blog', 'webLink'), field('Other profile', 'otherLink')] },
  { title: 'Audience Details', fields: [field('Primary audience location', 'audLocation'), field('Gender split', 'gender', { choices: ['Mostly Female', 'Mostly Male', 'Balanced'] }), field('Audience age group', 'audAge', { choices: ['13-17', '18-24', '25-34', '35-44', '45+'] }), field('Engagement rate %', 'engagement')] },
  { title: 'Collaboration Preferences', fields: [field('Collaboration types', 'collabTypes', { choices: collaborations, multiple: true }), field('Reel fee', 'reelFee'), field('Story package fee', 'storyFee'), field('YouTube video fee', 'ytFee'), field('UGC content fee', 'ugcFee'), field('Monthly retainer', 'retainer')] },
  { title: 'Content Capabilities', fields: [field('Formats created', 'capabilities', { choices: capabilities, multiple: true }), field('Shoots and edits self', 'selfEdit', { choices: ['Yes', 'No'] }), field('Professional equipment', 'proGear', { choices: ['Yes', 'No'] })] },
  { title: 'Previous Collaborations', fields: [field('Worked with brands', 'workedBefore', { choices: ['Yes', 'No'] }), field('Notable brands', 'brands'), field('Collaboration links', 'collabLinks', { type: 'textarea' })] },
  { title: 'Hospitality & Fashion Fit', fields: [field('Open to travel', 'openTravel', { choices: ['Yes', 'No'] }), field('Open to hospitality', 'openHospitality', { choices: ['Yes', 'No'] }), field('Open to fashion', 'openFashion', { choices: ['Yes', 'No'] }), field('Apparel size', 'apparelSize', { choices: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }), field('Accepts gifted products', 'gifted', { choices: ['Yes', 'No'] })] },
]
const uploads = [['Instagram insights', 'file_insights'], ['Audience demographics', 'file_demo'], ['Last 30 days reach', 'file_reach']]
const steps = [
  { title: 'Profile & Platforms', description: 'Basic details, creator profile, and social channels', sectionIndexes: [0, 1, 2] },
  { title: 'Audience & Work', description: 'Audience, collaboration preferences, capabilities, and experience', sectionIndexes: [3, 4, 5, 6] },
  { title: 'Fit & Consent', description: 'Hospitality and fashion fit, analytics uploads, and consent', sectionIndexes: [7] },
]
const initial = { ageGroup: [], category: [], collabTypes: [], capabilities: [], consent1: false, consent2: false, consent3: false }
const DRAFT_KEY = 'creator-manual-entry-draft'
const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-200'
const requiredBasicFields = [['Full name', 'fullName'], ['Email', 'email'], ['Mobile', 'mobile'], ['City', 'city']]
const joinLabels = (labels) => labels.length < 2 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({ name: file.name, type: file.type, data: String(reader.result).split(',')[1] })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const CreatorCreateScreen = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { userInfo } = useSelector((state) => state.auth)
  const [values, setValues] = useState(() => {
    try { return { ...initial, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}').values } } catch { return initial }
  })
  const [files, setFiles] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')
  const [step, setStep] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}').step || 1 } catch { return 1 }
  })
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const toggle = (key, choice) => setValues((current) => ({
    ...current,
    [key]: current[key].includes(choice) ? current[key].filter((item) => item !== choice) : [...current[key], choice],
  }))

  useEffect(() => {
    if (!isEditing) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }))
  }, [values, step, isEditing])

  useEffect(() => {
    if (!isEditing) return
    axios.get(`/api/creators/${id}`, { withCredentials: true })
      .then(({ data }) => {
        const clean = { ...data }
        for (const key of ['_id', '__v', 'createdAt', 'updatedAt', 'file_insights', 'file_demo', 'file_reach']) delete clean[key]
        setValues({ ...initial, ...clean })
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load creator.'))
      .finally(() => setLoading(false))
  }, [id, isEditing, userInfo.user._id])

  const renderField = ({ label, key, required, groupedRequired, choices, multiple, type }) => <div key={key} className={`block ${multiple || type === 'textarea' ? 'sm:col-span-2' : ''}`}>
    <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}{(required || groupedRequired) && <span className="text-red-700"> *</span>}</span>
    {multiple ? <div className="flex flex-wrap gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
      {choices.map((choice) => <label key={choice} className="inline-flex"><input type="checkbox" checked={values[key].includes(choice)} onChange={() => toggle(key, choice)} className="peer sr-only" /><span className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 peer-checked:border-stone-800 peer-checked:bg-stone-800 peer-checked:text-white">{choice}</span></label>)}
    </div> : choices ? <select className={inputClass} value={values[key] || ''} onChange={(event) => set(key, event.target.value)}><option value="">Select</option>{choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select>
      : type === 'textarea' ? <textarea rows="3" className={inputClass} value={values[key] || ''} onChange={(event) => set(key, event.target.value)} />
        : <input type={type || 'text'} required={required} className={inputClass} value={values[key] || ''} onChange={(event) => set(key, event.target.value)} />}
  </div>

  const handleFile = (key, file) => {
    if (!file) return setFiles((current) => ({ ...current, [key]: undefined }))
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Uploads must be JPEG, PNG, WebP, or PDF files up to 5 MB each.')
      return
    }
    setError('')
    setFiles((current) => ({ ...current, [key]: file }))
  }

  const goToStep = (nextStep) => {
    setError('')
    if (step === 1) {
      const missing = requiredBasicFields.filter(([, key]) => !values[key]?.trim()).map(([label]) => label)
      if (missing.length) return setError(`${joinLabels(missing)} ${missing.length === 1 ? 'is' : 'are'} required.`)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError('Email address is invalid. Enter an address such as name@example.com.')
      if (!values.category.length) return setError('Select at least one category before continuing.')
      if (![values.igLink, values.ytLink, values.fbLink, values.liLink].some((value) => value?.trim())) {
        return setError('Enter at least one Instagram, YouTube, Facebook, or LinkedIn profile.')
      }
    }
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!values.category.length) return setError('Select at least one category.')
    if (![values.igLink, values.ytLink, values.fbLink, values.liLink].some((value) => value?.trim())) return setError('Enter at least one Instagram, YouTube, Facebook, or LinkedIn profile.')
    if (![values.consent1, values.consent2, values.consent3].every(Boolean)) return setError('All three creator consents must be confirmed.')
    setSaving(true)
    try {
      const payload = { ...values, sourceDomain: isEditing ? values.sourceDomain : 'portal-manual' }
      for (const [, key] of uploads) if (files[key]) payload[key] = await toBase64(files[key])
      const config = { withCredentials: true }
      const { data } = isEditing
        ? await axios.put(`/api/creators/${id}`, payload, config)
        : await axios.post(`/api/creators`, payload, config)
      if (!isEditing) sessionStorage.removeItem(DRAFT_KEY)
      navigate(`/creators/${data.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save creator. Please try again.')
    } finally { setSaving(false) }
  }

  return <div className="portal-shell flex">
    <Sidebar />
    <div className="portal-main ml-0 flex flex-1 flex-col md:ml-72">
      <Navbar title={isEditing ? 'Edit Creator' : 'Add Creator'} />
      <main className="portal-content flex-1 p-4 md:p-5">
        {loading ? <p className="p-6 text-sm text-stone-500">Loading creator...</p> :
        <form onSubmit={submit} className="space-y-4">
          <Link to="/creators" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"><ArrowLeft className="h-4 w-4" /> Back to creators</Link>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map((item, index) => {
                const number = index + 1
                const active = number === step
                const complete = number < step
                return <div key={item.title} className={`rounded-lg border p-3 ${active ? 'border-stone-800 bg-stone-50' : complete ? 'border-green-300 bg-green-50' : 'border-stone-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${active ? 'bg-stone-800 text-white' : complete ? 'bg-green-700 text-white' : 'bg-stone-200 text-stone-600'}`}>{complete ? <Check className="h-4 w-4" /> : number}</span>
                    <div><p className="text-sm font-semibold text-stone-900">Step {number}: {item.title}</p><p className="mt-0.5 hidden text-xs text-stone-500 lg:block">{item.description}</p></div>
                  </div>
                </div>
              })}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-stone-800 transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} /></div>
          </div>
          <div><h1 className="text-xl font-semibold text-stone-900">Step {step}: {steps[step - 1].title}</h1><p className="mt-1 text-sm text-stone-600">{steps[step - 1].description}. Fields marked * are required.</p></div>
          {steps[step - 1].sectionIndexes.map((sectionIndex) => {
            const { title, fields } = sections[sectionIndex]
            return <section key={title} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-stone-900">{String(sectionIndex + 1).padStart(2, '0')} · {title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map(renderField)}</div>
          </section>})}
          {step === 3 && <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-stone-900">09 · Analytics Uploads</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{uploads.map(([label, key]) => <label key={key} className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={inputClass} onChange={(event) => handleFile(key, event.target.files?.[0])} /></label>)}</div>
          </section>}
          {step === 3 && <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-stone-900">10 · Consent</h2>
            <div className="space-y-3">{[
              ['consent1', 'Creator agreed to be included in the CULTMKT creator database.'],
              ['consent2', 'Creator agreed to be contacted for future campaigns.'],
              ['consent3', 'Creator confirmed that the details are accurate.'],
            ].map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm text-stone-700"><input type="checkbox" checked={values[key]} onChange={(event) => set(key, event.target.checked)} className="mt-0.5 h-4 w-4" /><span>{label}</span></label>)}</div>
          </section>}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
            <div>{step === 1 ? <Link to="/creators" className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Cancel</Link> : <button type="button" onClick={() => goToStep(step - 1)} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"><ArrowLeft className="h-4 w-4" /> Previous</button>}</div>
            {step < 3 ? <button type="button" onClick={() => goToStep(step + 1)} className="portal-button text-sm">Next <ArrowRight className="h-4 w-4" /></button> : <button type="submit" disabled={saving} className="portal-button text-sm disabled:opacity-50">{saving ? 'Saving...' : isEditing ? 'Update Creator' : 'Save Creator'}</button>}
          </div>
        </form>}
      </main>
    </div>
    <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ width: '100%', maxWidth: 620 }}>{error}</Alert>
    </Snackbar>
  </div>
}

export default CreatorCreateScreen
