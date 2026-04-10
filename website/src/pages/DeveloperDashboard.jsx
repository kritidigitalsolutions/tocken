import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { LogOut, Plus, Upload, Building2, CircleCheckBig } from 'lucide-react'
import { apiRequest } from '../lib/api'
import { clearDeveloperSession, getDeveloperToken, getDeveloperUser, isDeveloperLoggedIn } from '../lib/developerSession'
import './DeveloperDashboard.css'

const stepLabels = ['Step 1', 'Step 2', 'Step 3', 'Step 4']

const projectTypeOptions = ['Commercial', 'Residential']
const projectStatusOptions = ['Under Construction', 'Upcoming', 'New Launch']

const projectFeatureOptions = [
  'Entrance Lobby Design',
  'Power Backup',
  'Rainwater Harvesting System',
  'Visitor Parking',
  'Wi-Fi Enabled Common Areas',
  'Security & Safety Systems',
  'Water Supply',
  'Green Building Certification',
  'EV Charging Points',
  'Parking Covered',
  'Waste Management System',
  'Lifts (Branded / Automatic)',
  'Convenience Store',
  'EV Charging Point',
  'Firefighting System',
  'Solar Water Heating',
  'Laundry',
]

const productSpecificationOptions = [
  'High-Speed Elevators',
  'Branded CP Fittings',
  'Vitrified Tile Flooring',
  'Modular Kitchen Provision',
  'Premium Electrical Wiring',
  'Video Door Phone',
  'CCTV Surveillance',
  'Smart Access Control',
]

const amenitiesOptions = [
  'Clubhouse',
  'Swimming Pool',
  'Gymnasium',
  'Kids Play Area',
  'Jogging Track',
  'Community Hall',
  'Landscaped Garden',
  'Indoor Games Zone',
]

const nearbyOptions = [
  'Near Metro Station',
  'Near School',
  'Near Hospital',
  'Near Shopping Mall',
  'Near IT Park',
  'Near Highway',
  'Near Airport',
  'Near Railway Station',
]

const initialForm = {
  nameOfBusiness: '',
  nameOfAuthorisedPerson: '',
  designation: '',
  businessPAN: '',
  email: '',
  mobileNo: '',
  websiteLink: '',
  reraNo: '',
  gstNo: '',
  developerProfileDescription: '',
  panDocument: null,
  reraCertificate: null,
  gstCertificate: null,
  logo: null,
  nameOfProject: '',
  noOfFloor: '',
  noOfTower: '',
  projectStatus: '',
  projectType: [],
  projectConfiguration: [],
  launchDate: '',
  possessionDate: '',
  eBrochure: null,
  fullAddress: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  latitude: '',
  longitude: '',
  description: '',
  galleryFiles: [],
  projectFeature: [],
  productSpecification: [],
  amenities: [],
  connectivity: [],
  selectedPlan: '',
}

function splitCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumberOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function composeAddress(form) {
  const full = (form.fullAddress || '').trim()
  if (full) return full

  return [form.pincode, form.city, form.state, form.country]
    .map((item) => (item || '').trim())
    .filter(Boolean)
    .join(', ')
}

export default function DeveloperDashboard() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [customInput, setCustomInput] = useState({
    projectFeature: '',
    productSpecification: '',
    amenities: '',
    connectivity: '',
  })
  const [status, setStatus] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [myProjects, setMyProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [token] = useState(getDeveloperToken())
  const [user] = useState(getDeveloperUser())

  const selectedCount = useMemo(
    () => form.projectFeature.length + form.productSpecification.length + form.amenities.length + form.connectivity.length,
    [form.projectFeature, form.productSpecification, form.amenities, form.connectivity]
  )

  useEffect(() => {
    if (!token) return

    const fetchMine = async () => {
      try {
        setLoadingProjects(true)
        const response = await apiRequest('/api/projects/user/my', {}, token)
        setMyProjects(response?.data?.projects || [])
      } catch {
        setMyProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchMine()
  }, [token])

  if (!isDeveloperLoggedIn()) {
    return <Navigate to="/developer/login" replace />
  }

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const toggleArrayValue = (field, value) => {
    setForm((previous) => {
      const currentValues = previous[field]
      const exists = currentValues.includes(value)
      return {
        ...previous,
        [field]: exists ? currentValues.filter((item) => item !== value) : [...currentValues, value],
      }
    })
  }

  const addCustomTags = (field) => {
    const values = splitCsv(customInput[field])
    if (!values.length) return

    setForm((previous) => {
      const merged = [...previous[field]]
      values.forEach((value) => {
        if (!merged.includes(value)) merged.push(value)
      })
      return { ...previous, [field]: merged }
    })

    setCustomInput((previous) => ({ ...previous, [field]: '' }))
  }

  const removeTag = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].filter((item) => item !== value),
    }))
  }

  const addConfiguration = () => {
    setForm((previous) => ({
      ...previous,
      projectConfiguration: [
        ...previous.projectConfiguration,
        {
          id: Date.now().toString(),
          type: '',
          areaMin: '',
          areaMax: '',
          priceMin: '',
          priceMax: '',
          floorPlanFile: null,
        },
      ],
    }))
  }

  const updateConfiguration = (id, field, value) => {
    setForm((previous) => ({
      ...previous,
      projectConfiguration: previous.projectConfiguration.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const removeConfiguration = (id) => {
    setForm((previous) => ({
      ...previous,
      projectConfiguration: previous.projectConfiguration.filter((item) => item.id !== id),
    }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!form.nameOfBusiness || !form.businessPAN || !form.email || !form.mobileNo) {
        setStatus({ type: 'error', text: 'Step 1: Name of Business, PAN, Email and Mobile Number are required.' })
        return false
      }
    }

    if (step === 2) {
      if (!form.nameOfProject) {
        setStatus({ type: 'error', text: 'Step 2: Project name is required.' })
        return false
      }

      // Keep flow smooth: if status not chosen yet, auto-select default.
      if (!form.projectStatus) {
        setField('projectStatus', 'Under Construction')
      }
    }

    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setStatus({ type: '', text: '' })
    setStep((previous) => Math.min(previous + 1, 4))
  }

  const goBack = () => {
    setStatus({ type: '', text: '' })
    setStep((previous) => Math.max(previous - 1, 1))
  }

  const submitProject = async () => {
    const finalAddress = composeAddress(form)
    const finalProjectStatus = form.projectStatus || 'Under Construction'

    if (!form.nameOfBusiness || !form.businessPAN || !form.email || !form.mobileNo) {
      setStatus({ type: 'error', text: 'Developer profile fields are missing. Please complete Step 1.' })
      setStep(1)
      return
    }

    if (!form.nameOfProject || !finalAddress) {
      setStatus({ type: 'error', text: 'Project details are incomplete. Please add project name and at least one address field in Step 2.' })
      setStep(2)
      return
    }

    try {
      setSubmitting(true)
      setStatus({ type: '', text: '' })

      const profileUpload = new FormData()
      if (form.logo) profileUpload.append('logo', form.logo)
      if (form.panDocument) profileUpload.append('panDocument', form.panDocument)
      if (form.reraCertificate) profileUpload.append('reraCertificate', form.reraCertificate)
      if (form.gstCertificate) profileUpload.append('gstCertificate', form.gstCertificate)

      if ([...profileUpload.keys()].length > 0) {
        await apiRequest(
          '/api/projects/developer/me/uploads',
          {
            method: 'PATCH',
            body: profileUpload,
          },
          token
        )
      }

      const payload = {
        nameOfBusiness: form.nameOfBusiness,
        nameOfAuthorisedPerson: form.nameOfAuthorisedPerson,
        designation: form.designation,
        businessPAN: form.businessPAN,
        email: form.email,
        mobileNo: form.mobileNo,
        websiteLink: form.websiteLink,
        reraNo: form.reraNo,
        gstNo: form.gstNo,
        developerProfileDescription: form.developerProfileDescription,
        nameOfProject: form.nameOfProject,
        noOfFloor: toNumberOrUndefined(form.noOfFloor),
        noOfTower: toNumberOrUndefined(form.noOfTower),
        projectStatus: finalProjectStatus,
        projectType: form.projectType,
        projectConfiguration: form.projectConfiguration
          .filter((item) => item.type)
          .map((item) => ({
            type: item.type,
            details: {
              areaRangeSqft: {
                min: toNumberOrUndefined(item.areaMin) || 0,
                max: toNumberOrUndefined(item.areaMax) || 0,
              },
              priceRange: {
                min: toNumberOrUndefined(item.priceMin) || 0,
                max: toNumberOrUndefined(item.priceMax) || 0,
              },
            },
          })),
        launchDate: form.launchDate,
        possessionDate: form.possessionDate,
        projectLocation: {
          fullAddress: finalAddress,
          city: form.city,
          state: form.state,
          country: form.country,
          latitude: toNumberOrUndefined(form.latitude),
          longitude: toNumberOrUndefined(form.longitude),
        },
        description: form.description,
        projectFeature: form.projectFeature,
        productSpecification: form.productSpecification,
        amenities: form.amenities,
        connectivity: form.connectivity,
      }

      const formData = new FormData()
      formData.append('data', JSON.stringify(payload))

      if (form.eBrochure) {
        formData.append('brochure', form.eBrochure)
      }

      form.galleryFiles.forEach((file) => {
        formData.append('gallery', file)
      })

      form.projectConfiguration
        .filter((item) => item.floorPlanFile && item.type)
        .forEach((item) => {
          formData.append(`floorPlan_${encodeURIComponent(item.type)}`, item.floorPlanFile)
        })

      await apiRequest(
        '/api/projects',
        {
          method: 'POST',
          body: formData,
        },
        token
      )

      const updated = await apiRequest('/api/projects/user/my', {}, token)
      setMyProjects(updated?.data?.projects || [])

      setStatus({ type: 'success', text: 'Project submitted successfully. It is now pending admin approval.' })
      setStep(1)
      setForm(initialForm)
    } catch (error) {
      setStatus({ type: 'error', text: error?.message || 'Project submission failed. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dev-dash">
      <header className="dev-dash__header">
        <div>
          <h1 className="dev-dash__title">Developer Dashboard</h1>
          <p className="dev-dash__subtitle">
            Welcome{user?.name ? `, ${user.name}` : ''}. Post your project in 4 simple steps.
          </p>
        </div>

        <div className="dev-dash__headerActions">
          <Link to="/" className="dev-dash__homeLink">Go to Website</Link>
          <button
            type="button"
            className="dev-dash__logout"
            onClick={() => {
              clearDeveloperSession()
              window.location.href = '/developer/login'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="dev-dash__card">
        <div className="dev-stepper">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === step
            const isDone = stepNumber < step
            return (
              <div key={label} className={`dev-stepper__item${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}>
                {isDone ? <CircleCheckBig size={16} /> : null}
                <span>{label}</span>
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="dev-formGrid">
            <h2 className="dev-sectionTitle">Developer Profile</h2>

            <label>
              Name of Business *
              <input value={form.nameOfBusiness} onChange={(e) => setField('nameOfBusiness', e.target.value)} />
            </label>
            <label>
              Name of Authorised Person
              <input value={form.nameOfAuthorisedPerson} onChange={(e) => setField('nameOfAuthorisedPerson', e.target.value)} />
            </label>
            <label>
              Designation
              <input value={form.designation} onChange={(e) => setField('designation', e.target.value)} />
            </label>

            <label>
              Business PAN *
              <input value={form.businessPAN} onChange={(e) => setField('businessPAN', e.target.value)} />
            </label>
            <label>
              PAN Upload
              <input type="file" onChange={(e) => setField('panDocument', e.target.files?.[0] || null)} />
            </label>
            <label>
              Website Link
              <input value={form.websiteLink} onChange={(e) => setField('websiteLink', e.target.value)} />
            </label>

            <label>
              Email *
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </label>
            <label>
              Mobile No *
              <input value={form.mobileNo} onChange={(e) => setField('mobileNo', e.target.value)} />
            </label>
            <label>
              Company Logo
              <input type="file" onChange={(e) => setField('logo', e.target.files?.[0] || null)} />
            </label>

            <label>
              RERA No
              <input value={form.reraNo} onChange={(e) => setField('reraNo', e.target.value)} />
            </label>
            <label>
              RERA Certificate
              <input type="file" onChange={(e) => setField('reraCertificate', e.target.files?.[0] || null)} />
            </label>
            <label>
              GST No
              <input value={form.gstNo} onChange={(e) => setField('gstNo', e.target.value)} />
            </label>
            <label>
              GST Certificate
              <input type="file" onChange={(e) => setField('gstCertificate', e.target.files?.[0] || null)} />
            </label>

            <label className="dev-formGrid__full">
              Developer Profile
              <textarea
                rows={4}
                value={form.developerProfileDescription}
                onChange={(e) => setField('developerProfileDescription', e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="dev-formGrid">
            <h2 className="dev-sectionTitle">Project & Location Details</h2>

            <label>
              Name of Project *
              <input value={form.nameOfProject} onChange={(e) => setField('nameOfProject', e.target.value)} />
            </label>
            <label>
              No of Floor
              <input type="number" value={form.noOfFloor} onChange={(e) => setField('noOfFloor', e.target.value)} />
            </label>
            <label>
              No of Tower
              <input type="number" value={form.noOfTower} onChange={(e) => setField('noOfTower', e.target.value)} />
            </label>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Project Type</p>
              <div className="dev-checkGrid">
                {projectTypeOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="checkbox"
                      checked={form.projectType.includes(item)}
                      onChange={() => toggleArrayValue('projectType', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Project Status *</p>
              <div className="dev-checkGrid">
                {projectStatusOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="radio"
                      name="projectStatus"
                      checked={form.projectStatus === item}
                      onChange={() => setField('projectStatus', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="dev-formGrid__full dev-config">
              <div className="dev-config__head">
                <p className="dev-miniTitle">Project Configuration</p>
                <button type="button" className="dev-smallBtn" onClick={addConfiguration}>
                  <Plus size={14} /> Add Configuration
                </button>
              </div>

              {form.projectConfiguration.length === 0 && <p className="dev-muted">No categories available. Add at least one configuration.</p>}

              {form.projectConfiguration.map((item, index) => (
                <div key={item.id} className="dev-config__row">
                  <label>
                    Type (e.g. 2BHK)
                    <input value={item.type} onChange={(e) => updateConfiguration(item.id, 'type', e.target.value)} />
                  </label>
                  <label>
                    Area Min (sqft)
                    <input type="number" value={item.areaMin} onChange={(e) => updateConfiguration(item.id, 'areaMin', e.target.value)} />
                  </label>
                  <label>
                    Area Max (sqft)
                    <input type="number" value={item.areaMax} onChange={(e) => updateConfiguration(item.id, 'areaMax', e.target.value)} />
                  </label>
                  <label>
                    Price Min
                    <input type="number" value={item.priceMin} onChange={(e) => updateConfiguration(item.id, 'priceMin', e.target.value)} />
                  </label>
                  <label>
                    Price Max
                    <input type="number" value={item.priceMax} onChange={(e) => updateConfiguration(item.id, 'priceMax', e.target.value)} />
                  </label>
                  <label>
                    Floor Plan
                    <input
                      type="file"
                      onChange={(e) => updateConfiguration(item.id, 'floorPlanFile', e.target.files?.[0] || null)}
                    />
                  </label>
                  <button type="button" className="dev-config__remove" onClick={() => removeConfiguration(item.id)}>
                    Remove #{index + 1}
                  </button>
                </div>
              ))}
            </div>

            <label>
              Launch Date
              <input type="date" value={form.launchDate} onChange={(e) => setField('launchDate', e.target.value)} />
            </label>
            <label>
              Possession Date
              <input type="date" value={form.possessionDate} onChange={(e) => setField('possessionDate', e.target.value)} />
            </label>
            <label>
              E Brochure Upload (PDF)
              <input type="file" accept="application/pdf" onChange={(e) => setField('eBrochure', e.target.files?.[0] || null)} />
            </label>

            <label className="dev-formGrid__full">
              Full Address *
              <input value={form.fullAddress} onChange={(e) => setField('fullAddress', e.target.value)} />
            </label>
            <label>
              Pincode
              <input value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
            </label>
            <label>
              City
              <input value={form.city} onChange={(e) => setField('city', e.target.value)} />
            </label>
            <label>
              State
              <input value={form.state} onChange={(e) => setField('state', e.target.value)} />
            </label>
            <label>
              Country
              <input value={form.country} onChange={(e) => setField('country', e.target.value)} />
            </label>
            <label>
              Latitude
              <input value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} />
            </label>
            <label>
              Longitude
              <input value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} />
            </label>

            <label className="dev-formGrid__full">
              Gallery Images
              <input
                type="file"
                multiple
                onChange={(e) => setField('galleryFiles', Array.from(e.target.files || []))}
              />
              {form.galleryFiles.length > 0 ? <small>{form.galleryFiles.length} file(s) selected</small> : null}
            </label>

            <label className="dev-formGrid__full">
              Project Description
              <textarea rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="dev-formGrid">
            <h2 className="dev-sectionTitle">Project Feature</h2>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Project Feature</p>
              <div className="dev-checkGrid">
                {projectFeatureOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="checkbox"
                      checked={form.projectFeature.includes(item)}
                      onChange={() => toggleArrayValue('projectFeature', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="dev-tagInput">
                <input
                  placeholder="Add custom project features (comma separated)"
                  value={customInput.projectFeature}
                  onChange={(e) => setCustomInput((previous) => ({ ...previous, projectFeature: e.target.value }))}
                />
                <button type="button" onClick={() => addCustomTags('projectFeature')}>Add</button>
              </div>
            </div>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Product Specification</p>
              <div className="dev-checkGrid">
                {productSpecificationOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="checkbox"
                      checked={form.productSpecification.includes(item)}
                      onChange={() => toggleArrayValue('productSpecification', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="dev-tagInput">
                <input
                  placeholder="Add custom product specifications"
                  value={customInput.productSpecification}
                  onChange={(e) => setCustomInput((previous) => ({ ...previous, productSpecification: e.target.value }))}
                />
                <button type="button" onClick={() => addCustomTags('productSpecification')}>Add</button>
              </div>
            </div>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Amenities</p>
              <div className="dev-checkGrid">
                {amenitiesOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(item)}
                      onChange={() => toggleArrayValue('amenities', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="dev-tagInput">
                <input
                  placeholder="Add custom amenities"
                  value={customInput.amenities}
                  onChange={(e) => setCustomInput((previous) => ({ ...previous, amenities: e.target.value }))}
                />
                <button type="button" onClick={() => addCustomTags('amenities')}>Add</button>
              </div>
            </div>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Near by</p>
              <div className="dev-checkGrid">
                {nearbyOptions.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input
                      type="checkbox"
                      checked={form.connectivity.includes(item)}
                      onChange={() => toggleArrayValue('connectivity', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="dev-tagInput">
                <input
                  placeholder="Add custom nearby/connectivity points"
                  value={customInput.connectivity}
                  onChange={(e) => setCustomInput((previous) => ({ ...previous, connectivity: e.target.value }))}
                />
                <button type="button" onClick={() => addCustomTags('connectivity')}>Add</button>
              </div>
            </div>

            <div className="dev-formGrid__full">
              <p className="dev-miniTitle">Selected: {selectedCount}</p>
              <div className="dev-tags">
                {['projectFeature', 'productSpecification', 'amenities', 'connectivity'].map((field) =>
                  form[field].map((value) => (
                    <button key={`${field}-${value}`} type="button" className="dev-tag" onClick={() => removeTag(field, value)}>
                      {value} x
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="dev-planStep">
            <h2 className="dev-sectionTitle">Choose Plan</h2>

            <div className="dev-planGrid">
              {[
                { id: 'elite', title: 'Elite package', price: '₹500', cycle: '/month + 18% GST' },
                { id: 'test_subscription', title: 'test_subscription', price: '₹2000', cycle: '/month + 18% GST' },
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={`dev-planCard${form.selectedPlan === plan.id ? ' is-selected' : ''}`}
                  onClick={() => setField('selectedPlan', plan.id)}
                >
                  <div className="dev-planCard__price">{plan.price}</div>
                  <div className="dev-planCard__cycle">{plan.cycle}</div>
                  <p className="dev-planCard__title">{plan.title}</p>
                  <p className="dev-planCard__meta">Property Limit: N/A</p>
                  <p className="dev-planCard__meta">Advertisement Limit: N/A</p>
                </button>
              ))}
            </div>

            <p className="dev-muted dev-planNote">
              Plan selection is captured in UI for now. Project submission uses your existing backend post-project APIs.
            </p>
          </div>
        )}

        {status.text && <p className={`dev-status ${status.type === 'error' ? 'is-error' : 'is-success'}`}>{status.text}</p>}

        <div className="dev-actions">
          <button type="button" className="dev-btn dev-btn--ghost" onClick={goBack} disabled={step === 1 || submitting}>
            Back
          </button>

          {step < 4 ? (
            <button type="button" className="dev-btn dev-btn--primary" onClick={goNext} disabled={submitting}>
              Next
            </button>
          ) : (
            <button type="button" className="dev-btn dev-btn--primary" onClick={submitProject} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          )}
        </div>
      </section>

      <section className="dev-dash__card">
        <div className="dev-listHead">
          <h2 className="dev-sectionTitle">My Posted Projects</h2>
          {loadingProjects ? <p className="dev-muted">Loading...</p> : null}
        </div>

        {!loadingProjects && myProjects.length === 0 ? (
          <p className="dev-muted">No projects posted yet.</p>
        ) : (
          <div className="dev-projectList">
            {myProjects.map((project) => (
              <article key={project._id} className="dev-projectCard">
                <div className="dev-projectCard__top">
                  <Building2 size={18} />
                  <strong>{project.nameOfProject}</strong>
                </div>
                <p>{project.projectLocation?.city || '-'} | {project.projectStatus || '-'}</p>
                <p>Status: <span className={`dev-chip status-${(project.adminStatus || '').toLowerCase()}`}>{project.adminStatus}</span></p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="dev-footer">© {new Date().getFullYear()} Tocken. Developer console.</footer>
    </div>
  )
}
