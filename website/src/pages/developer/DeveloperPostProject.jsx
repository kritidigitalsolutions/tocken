import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Building2,
  User,
  Briefcase,
  FileText,
  Mail,
  Phone,
  Globe,
  CalendarDays,
  MapPin,
  Landmark,
  Home,
} from 'lucide-react'
import { getDeveloperToken, getDeveloperUser } from '../../lib/developerSession'
import {
  checkPaymentStatus,
  createPaymentOrder,
  createProject,
  fetchMyProjects,
  getAllPlans,
  getPlanStatus,
  getPlansForType,
  updateProject,
  uploadDeveloperDocs,
} from '../../lib/developerApi'

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

const ORDER_TTL_MS = 45 * 60 * 1000
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function getDraftStorageKey(userId, editProjectId) {
  return `dev-post-project-draft:${userId || 'guest'}:${editProjectId || 'new'}`
}

function toPersistableForm(form) {
  return {
    ...form,
    panDocument: null,
    reraCertificate: null,
    gstCertificate: null,
    logo: null,
    eBrochure: null,
    galleryFiles: [],
    projectConfiguration: (form.projectConfiguration || []).map((item) => ({
      ...item,
      floorPlanFile: null,
    })),
  }
}

function isPendingOrderFresh(order) {
  if (!order?.merchantOrderId || !order?.createdAt) return false
  return Date.now() - Number(order.createdAt) <= ORDER_TTL_MS
}

function getAddressComponent(components = [], type) {
  const found = components.find((item) => item.types?.includes(type))
  return found?.long_name || ''
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

function normalizeConfiguration(items = []) {
  return items.map((item, idx) => ({
    id: `${Date.now()}-${idx}`,
    type: item?.type || '',
    areaMin: item?.details?.areaRangeSqft?.min ?? '',
    areaMax: item?.details?.areaRangeSqft?.max ?? '',
    priceMin: item?.details?.priceRange?.min ?? '',
    priceMax: item?.details?.priceRange?.max ?? '',
    floorPlanFile: null,
  }))
}

export default function DeveloperPostProject() {
  const token = getDeveloperToken()
  const user = getDeveloperUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editProjectId = searchParams.get('edit')
  const paymentResult = searchParams.get('payment')
  const paymentOrderId = searchParams.get('order')
  const draftStorageKey = useMemo(() => getDraftStorageKey(user?._id, editProjectId), [user?._id, editProjectId])

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

  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [planStatus, setPlanStatus] = useState({ loading: true, hasActivePlan: false })
  const [showAllPlans, setShowAllPlans] = useState(false)

  const [pendingOrder, setPendingOrder] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [showPlanActivatedPopup, setShowPlanActivatedPopup] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [placesReady, setPlacesReady] = useState(false)

  const placesServiceRef = useRef(null)
  const geocoderRef = useRef(null)
  const addressDebounceRef = useRef(null)

  const selectedCount = useMemo(
    () => form.projectFeature.length + form.productSpecification.length + form.amenities.length + form.connectivity.length,
    [form.projectFeature, form.productSpecification, form.amenities, form.connectivity]
  )

  useEffect(() => {
    const setupPlaces = () => {
      if (!window.google?.maps?.places) return false
      placesServiceRef.current = new window.google.maps.places.AutocompleteService()
      geocoderRef.current = new window.google.maps.Geocoder()
      setPlacesReady(true)
      return true
    }

    if (setupPlaces()) return
    if (!GOOGLE_MAPS_API_KEY) return

    const existing = document.querySelector('script[data-google-places="true"]')
    if (existing) {
      existing.addEventListener('load', setupPlaces)
      return () => existing.removeEventListener('load', setupPlaces)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-places', 'true')
    script.addEventListener('load', setupPlaces)
    document.body.appendChild(script)

    return () => script.removeEventListener('load', setupPlaces)
  }, [])

  useEffect(() => {
    if (!placesReady) return
    const query = (form.fullAddress || '').trim()
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)

    addressDebounceRef.current = setTimeout(() => {
      placesServiceRef.current?.getPlacePredictions(
        {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'in' },
        },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setAddressSuggestions([])
            return
          }

          setAddressSuggestions(predictions.slice(0, 6))
        }
      )
    }, 280)

    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)
    }
  }, [form.fullAddress, placesReady])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey)
      if (!raw) {
        setDraftLoaded(true)
        return
      }

      const parsed = JSON.parse(raw)
      if (parsed?.form) {
        setForm((prev) => ({ ...prev, ...parsed.form }))
      }
      if (parsed?.step) {
        setStep(Math.min(Math.max(Number(parsed.step) || 1, 1), 4))
      }
      if (parsed?.customInput) {
        setCustomInput((prev) => ({ ...prev, ...parsed.customInput }))
      }
      if (isPendingOrderFresh(parsed?.pendingOrder)) {
        setPendingOrder(parsed.pendingOrder)
      } else {
        setPendingOrder(null)
      }
    } catch {
      // Ignore corrupted draft data.
    } finally {
      setDraftLoaded(true)
    }
  }, [draftStorageKey])

  useEffect(() => {
    if (!draftLoaded) return

    const draft = {
      step,
      form: toPersistableForm(form),
      customInput,
      pendingOrder,
      updatedAt: Date.now(),
    }

    localStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [draftLoaded, step, form, customInput, pendingOrder, draftStorageKey])

  useEffect(() => {
    if (!paymentResult && !paymentOrderId) return

    if (paymentOrderId) {
      setPendingOrder((prev) => ({
        merchantOrderId: paymentOrderId,
        redirectUrl: prev?.redirectUrl || '',
      }))
    }

    setStep(4)
    if (paymentResult === 'success') {
      const sync = async () => {
        try {
          const planRes = await getPlanStatus(token)
          const hasActivePlan = Boolean(planRes?.data?.hasActivePlan)
          setPlanStatus((prev) => ({
            ...prev,
            loading: false,
            hasActivePlan,
            userType: planRes?.data?.userType || prev?.userType,
            isExpired: Boolean(planRes?.data?.isExpired),
          }))

          if (hasActivePlan) {
            setShowPlanActivatedPopup(true)
            setPendingOrder(null)
            setStatus({ type: 'success', text: 'Plan purchase successful. You can now submit the project.' })
            return
          }

          setStatus({ type: 'error', text: 'The payment callback was received, but the plan was not activated. Please check the payment status.' })
        } catch {
          setStatus({ type: 'error', text: 'Payment callback not verified. Please Check Payment Status.' })
        }
      }

      sync()
    } else if (paymentResult === 'pending') {
      setStatus({ type: 'error', text: 'Payment is pending. Please complete payment and check status again.' })
    } else if (paymentResult === 'failed') {
      setStatus({ type: 'error', text: 'Payment failed or cancelled. Please try again.' })
    }
  }, [paymentResult, paymentOrderId])

  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setPlansLoading(true)
        setPlanStatus({ loading: true, hasActivePlan: false })

        const planRes = await getPlanStatus(token)
        const hasActivePlan = Boolean(planRes?.data?.hasActivePlan)
        const currentUserType = planRes?.data?.userType || user?.userType || 'BUILDER'

        let fetchedPlans = []
        if (showAllPlans) {
          const res = await getAllPlans(token)
          fetchedPlans = res?.plans || []
        } else {
          const preference = [currentUserType, 'BUILDER', 'DEVELOPER', 'INDIVIDUAL']
          const uniqueTypes = [...new Set(preference)]

          for (const type of uniqueTypes) {
            const res = await getPlansForType(type, token)
            const rows = res?.plans || []
            if (rows.length) {
              fetchedPlans = rows
              break
            }
          }
        }

        setPlans(fetchedPlans)
        setPlanStatus({
          loading: false,
          hasActivePlan,
          userType: currentUserType,
          isExpired: Boolean(planRes?.data?.isExpired),
        })

        if (fetchedPlans.length > 0 && !form.selectedPlan) {
          setField('selectedPlan', fetchedPlans[0]._id)
        }
      } catch {
        setPlans([])
        setPlanStatus({ loading: false, hasActivePlan: false, userType: user?.userType || '-', isExpired: false })
      } finally {
        setPlansLoading(false)
      }
    }

    loadPlanData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, showAllPlans])

  useEffect(() => {
    if (!editProjectId) return

    const loadProjectForEdit = async () => {
      try {
        localStorage.removeItem(draftStorageKey)
        const res = await fetchMyProjects(token)
        const list = res?.data?.projects || []
        const project = list.find((item) => item._id === editProjectId)
        if (!project) {
          setStatus({ type: 'error', text: 'Project not found for edit.' })
          return
        }

        if (project.adminStatus !== 'PENDING') {
          setStatus({ type: 'error', text: 'Only PENDING projects can be edited.' })
          return
        }

        setForm((prev) => ({
          ...prev,
          nameOfBusiness: project.nameOfBusiness || '',
          nameOfAuthorisedPerson: project.nameOfAuthorisedPerson || '',
          designation: project.designation || '',
          businessPAN: project.businessPAN || '',
          email: project.email || '',
          mobileNo: project.mobileNo || '',
          websiteLink: project.websiteLink || '',
          reraNo: project.reraNo || '',
          gstNo: project.gstNo || '',
          developerProfileDescription: project.developerProfileDescription || '',
          nameOfProject: project.nameOfProject || '',
          noOfFloor: project.noOfFloor ?? '',
          noOfTower: project.noOfTower ?? '',
          projectStatus: project.projectStatus || '',
          projectType: project.projectType || [],
          projectConfiguration: normalizeConfiguration(project.projectConfiguration || []),
          launchDate: project.launchDate || '',
          possessionDate: project.possessionDate || '',
          fullAddress: project.projectLocation?.fullAddress || '',
          pincode: project.projectLocation?.pincode || '',
          city: project.projectLocation?.city || '',
          state: project.projectLocation?.state || '',
          country: project.projectLocation?.country || 'India',
          latitude: project.projectLocation?.latitude ?? '',
          longitude: project.projectLocation?.longitude ?? '',
          description: project.description || '',
          projectFeature: Array.isArray(project.projectFeature) ? project.projectFeature : [],
          productSpecification: Array.isArray(project.productSpecification) ? project.productSpecification : [],
          amenities: project.amenities || [],
          connectivity: project.connectivity || [],
        }))

        setStatus({ type: 'success', text: 'Edit mode loaded. Update fields and submit.' })
      } catch {
        setStatus({ type: 'error', text: 'Unable to load project for edit.' })
      }
    }

    loadProjectForEdit()
  }, [draftStorageKey, editProjectId, token])

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const applyAddressSuggestion = (suggestion) => {
    setField('fullAddress', suggestion.description)
    setAddressSuggestions([])

    geocoderRef.current?.geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) return

      const result = results[0]
      const components = result.address_components || []

      setForm((previous) => ({
        ...previous,
        fullAddress: suggestion.description,
        city: getAddressComponent(components, 'locality') || getAddressComponent(components, 'sublocality') || previous.city,
        state: getAddressComponent(components, 'administrative_area_level_1') || previous.state,
        country: getAddressComponent(components, 'country') || previous.country,
        pincode: getAddressComponent(components, 'postal_code') || previous.pincode,
        latitude: result.geometry?.location?.lat?.() ?? previous.latitude,
        longitude: result.geometry?.location?.lng?.() ?? previous.longitude,
      }))
    })
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
      if (!form.projectStatus) setField('projectStatus', 'Under Construction')
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

  const purchaseSelectedPlan = async () => {
    if (!form.selectedPlan) {
      setStatus({ type: 'error', text: 'Please select a plan first.' })
      return
    }

    const paymentWindow = window.open('about:blank', '_blank')
    if (!paymentWindow) {
      setStatus({ type: 'error', text: 'Popup blocked. Please allow popups and click Purchase Selected Plan again.' })
      return
    }

    try {
      paymentWindow.document.write('<html><head><title>Redirecting...</title></head><body style="font-family:Arial,sans-serif;padding:24px;">Opening payment gateway...</body></html>')
      paymentWindow.document.close()
    } catch {
      // ignore write issues
    }

    try {
      setSubmitting(true)
      const redirectBaseUrl = `${window.location.origin}/payment/status`
      const res = await createPaymentOrder(form.selectedPlan, token, redirectBaseUrl)
      const nextPendingOrder = {
        merchantOrderId: res?.data?.merchantOrderId,
        redirectUrl: res?.data?.redirectUrl,
        createdAt: Date.now(),
      }

      setPendingOrder(nextPendingOrder)

      try {
        const draft = {
          step,
          form: toPersistableForm(form),
          customInput,
          pendingOrder: nextPendingOrder,
          updatedAt: Date.now(),
        }
        localStorage.setItem(draftStorageKey, JSON.stringify(draft))
      } catch {
        // Ignore storage write failures.
      }

      if (nextPendingOrder?.redirectUrl) {
        paymentWindow.location.href = nextPendingOrder.redirectUrl

        setStatus({
          type: 'success',
          text: 'The payment page has opened in a new tab. Complete the payment, then check the payment status here.',
        })
        return
      }

      try {
        paymentWindow.document.write('<html><head><title>Payment Error</title></head><body style="font-family:Arial,sans-serif;padding:24px;">Unable to open payment page. Please close this tab and try again.</body></html>')
        paymentWindow.document.close()
      } catch {
        paymentWindow.close()
      }

      setStatus({ type: 'error', text: 'Order created but redirect URL missing. Please try Purchase Selected Plan again.' })
    } catch (error) {
      try {
        paymentWindow.document.write('<html><head><title>Payment Error</title></head><body style="font-family:Arial,sans-serif;padding:24px;">Payment order could not be created. Please close this tab and retry.</body></html>')
        paymentWindow.document.close()
      } catch {
        paymentWindow.close()
      }
      setStatus({ type: 'error', text: error.message || 'Unable to create payment order.' })
    } finally {
      setSubmitting(false)
    }
  }

  const checkAndActivatePayment = async () => {
    if (!pendingOrder?.merchantOrderId || !isPendingOrderFresh(pendingOrder)) {
      setPendingOrder(null)
      setStatus({ type: 'error', text: 'No pending order found. Please create an order first.' })
      return
    }

    try {
      setCheckingPayment(true)
      const res = await checkPaymentStatus(pendingOrder.merchantOrderId, token)
      const state = res?.data?.status

      if (state === 'SUCCESS') {
        const planRes = await getPlanStatus(token)
        const hasActivePlan = Boolean(planRes?.data?.hasActivePlan)

        setPlanStatus((prev) => ({
          ...prev,
          loading: false,
          hasActivePlan,
          userType: planRes?.data?.userType || prev?.userType,
          isExpired: Boolean(planRes?.data?.isExpired),
        }))

        if (hasActivePlan) {
          setPendingOrder(null)
          setShowPlanActivatedPopup(true)
          setStatus({ type: 'success', text: 'Plan purchase successful. You can now submit the project.' })
        } else {
          setStatus({ type: 'error', text: 'Payment succeeded, but the plan was not activated. Please try again.' })
        }
      } else if (state === 'PENDING') {
        setStatus({ type: 'error', text: 'Payment is still pending. Complete payment and check again.' })
      } else {
        setStatus({ type: 'error', text: 'Payment not successful yet.' })
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Could not verify payment status.' })
    } finally {
      setCheckingPayment(false)
    }
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
      setStatus({ type: 'error', text: 'Project details are incomplete. Please add project name and address in Step 2.' })
      setStep(2)
      return
    }

    if (!planStatus.hasActivePlan) {
      setStep(4)
      setStatus({ type: 'error', text: 'Active plan required. Purchase a plan first in Step 4.' })
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
        await uploadDeveloperDocs(profileUpload, token)
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

      if (form.eBrochure) formData.append('brochure', form.eBrochure)
      form.galleryFiles.forEach((file) => formData.append('gallery', file))

      form.projectConfiguration
        .filter((item) => item.floorPlanFile && item.type)
        .forEach((item) => formData.append(`floorPlan_${encodeURIComponent(item.type)}`, item.floorPlanFile))

      if (editProjectId) {
        await updateProject(editProjectId, formData, token)
      } else {
        await createProject(formData, token)
      }

      setStatus({ type: 'success', text: editProjectId ? 'Project updated successfully.' : 'Project submitted successfully.' })
      if (!editProjectId) {
        setForm(initialForm)
        setCustomInput({
          projectFeature: '',
          productSpecification: '',
          amenities: '',
          connectivity: '',
        })
        setPendingOrder(null)
        setStep(1)
        localStorage.removeItem(draftStorageKey)
        navigate('/developer/post-project', { replace: true })
      }
    } catch (error) {
      setStatus({ type: 'error', text: error?.message || 'Project submission failed. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="dev-page">
      <header className="dev-page__header">
        <h1>{editProjectId ? 'Edit Project' : 'Post Project'}</h1>
        <p>Complete all 4 steps and submit your project.</p>
      </header>

      <div className="dev-stepper">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === step
          const isDone = stepNumber < step
          return (
            <div key={label} className={`dev-stepper__item${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}>
              <span>{label}</span>
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="dev-formGrid">
          <h2 className="dev-sectionTitle">Developer Profile</h2>
          <label><span className="dev-label"><Building2 size={14} /> Name of Business *</span><input value={form.nameOfBusiness} onChange={(e) => setField('nameOfBusiness', e.target.value)} /></label>
          <label><span className="dev-label"><User size={14} /> Name of Authorised Person</span><input value={form.nameOfAuthorisedPerson} onChange={(e) => setField('nameOfAuthorisedPerson', e.target.value)} /></label>
          <label><span className="dev-label"><Briefcase size={14} /> Designation</span><input value={form.designation} onChange={(e) => setField('designation', e.target.value)} /></label>
          <label><span className="dev-label"><FileText size={14} /> Business PAN *</span><input value={form.businessPAN} onChange={(e) => setField('businessPAN', e.target.value)} /></label>
          <label><span className="dev-label"><FileText size={14} /> PAN Upload</span><input type="file" onChange={(e) => setField('panDocument', e.target.files?.[0] || null)} /></label>
          <label><span className="dev-label"><Globe size={14} /> Website Link</span><input value={form.websiteLink} onChange={(e) => setField('websiteLink', e.target.value)} /></label>
          <label><span className="dev-label"><Mail size={14} /> Email *</span><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></label>
          <label><span className="dev-label"><Phone size={14} /> Mobile No *</span><input value={form.mobileNo} onChange={(e) => setField('mobileNo', e.target.value)} /></label>
          <label><span className="dev-label"><Building2 size={14} /> Company Logo</span><input type="file" onChange={(e) => setField('logo', e.target.files?.[0] || null)} /></label>
          <label><span className="dev-label"><Landmark size={14} /> RERA No</span><input value={form.reraNo} onChange={(e) => setField('reraNo', e.target.value)} /></label>
          <label>RERA Certificate<input type="file" onChange={(e) => setField('reraCertificate', e.target.files?.[0] || null)} /></label>
          <label><span className="dev-label"><Landmark size={14} /> GST No</span><input value={form.gstNo} onChange={(e) => setField('gstNo', e.target.value)} /></label>
          <label>GST Certificate<input type="file" onChange={(e) => setField('gstCertificate', e.target.files?.[0] || null)} /></label>
          <label className="dev-formGrid__full">Developer Profile<textarea rows={4} value={form.developerProfileDescription} onChange={(e) => setField('developerProfileDescription', e.target.value)} /></label>
        </div>
      )}

      {step === 2 && (
        <div className="dev-formGrid">
          <h2 className="dev-sectionTitle">Project & Location Details</h2>
          <label><span className="dev-label"><Home size={14} /> Name of Project *</span><input value={form.nameOfProject} onChange={(e) => setField('nameOfProject', e.target.value)} /></label>
          <label>No of Floor<input type="number" value={form.noOfFloor} onChange={(e) => setField('noOfFloor', e.target.value)} /></label>
          <label>No of Tower<input type="number" value={form.noOfTower} onChange={(e) => setField('noOfTower', e.target.value)} /></label>

          <div className="dev-formGrid__full">
            <p className="dev-miniTitle">Project Type</p>
            <div className="dev-checkGrid">
              {projectTypeOptions.map((item) => (
                <label key={item} className="dev-checkItem">
                  <input type="checkbox" checked={form.projectType.includes(item)} onChange={() => toggleArrayValue('projectType', item)} />{item}
                </label>
              ))}
            </div>
          </div>

          <div className="dev-formGrid__full">
            <p className="dev-miniTitle">Project Status</p>
            <div className="dev-checkGrid">
              {projectStatusOptions.map((item) => (
                <label key={item} className="dev-checkItem">
                  <input type="radio" name="projectStatus" checked={form.projectStatus === item} onChange={() => setField('projectStatus', item)} />{item}
                </label>
              ))}
            </div>
          </div>

          <div className="dev-formGrid__full dev-config">
            <div className="dev-config__head">
              <p className="dev-miniTitle">Project Configuration</p>
              <button type="button" className="dev-smallBtn" onClick={addConfiguration}><Plus size={14} /> Add Configuration</button>
            </div>

            {form.projectConfiguration.length === 0 ? <p className="dev-muted">No categories available.</p> : null}
            {form.projectConfiguration.map((item, index) => (
              <div key={item.id} className="dev-config__row">
                <label>Type<input value={item.type} onChange={(e) => updateConfiguration(item.id, 'type', e.target.value)} /></label>
                <label>Area Min<input type="number" value={item.areaMin} onChange={(e) => updateConfiguration(item.id, 'areaMin', e.target.value)} /></label>
                <label>Area Max<input type="number" value={item.areaMax} onChange={(e) => updateConfiguration(item.id, 'areaMax', e.target.value)} /></label>
                <label>Price Min<input type="number" value={item.priceMin} onChange={(e) => updateConfiguration(item.id, 'priceMin', e.target.value)} /></label>
                <label>Price Max<input type="number" value={item.priceMax} onChange={(e) => updateConfiguration(item.id, 'priceMax', e.target.value)} /></label>
                <label>Floor Plan<input type="file" onChange={(e) => updateConfiguration(item.id, 'floorPlanFile', e.target.files?.[0] || null)} /></label>
                <button type="button" className="dev-config__remove" onClick={() => removeConfiguration(item.id)}>Remove #{index + 1}</button>
              </div>
            ))}
          </div>

          <label><span className="dev-label"><CalendarDays size={14} /> Launch Date</span><input type="date" value={form.launchDate} onChange={(e) => setField('launchDate', e.target.value)} /></label>
          <label><span className="dev-label"><CalendarDays size={14} /> Possession Date</span><input type="date" value={form.possessionDate} onChange={(e) => setField('possessionDate', e.target.value)} /></label>
          <label>E Brochure Upload<input type="file" accept="application/pdf" onChange={(e) => setField('eBrochure', e.target.files?.[0] || null)} /></label>

          <label className="dev-formGrid__full dev-addressField">
            <span className="dev-label"><MapPin size={14} /> Full Address</span>
            <input
              value={form.fullAddress}
              onChange={(e) => setField('fullAddress', e.target.value)}
              placeholder="Type address and select from Google suggestions"
              autoComplete="off"
            />
            {placesReady && addressSuggestions.length ? (
              <div className="dev-addressSuggestions">
                {addressSuggestions.map((item) => (
                  <button type="button" key={item.place_id} className="dev-addressSuggestion" onClick={() => applyAddressSuggestion(item)}>
                    <MapPin size={13} /> {item.description}
                  </button>
                ))}
              </div>
            ) : null}
            {!placesReady ? <small className="dev-muted">Address suggestions unavailable. Set VITE_GOOGLE_MAPS_API_KEY to enable Google suggestions.</small> : null}
          </label>
          <label>Pincode<input value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} /></label>
          <label>City<input value={form.city} onChange={(e) => setField('city', e.target.value)} /></label>
          <label>State<input value={form.state} onChange={(e) => setField('state', e.target.value)} /></label>
          <label>Country<input value={form.country} onChange={(e) => setField('country', e.target.value)} /></label>

          <label className="dev-formGrid__full">Gallery Images<input type="file" multiple onChange={(e) => setField('galleryFiles', Array.from(e.target.files || []))} /></label>
          <label className="dev-formGrid__full">Project Description<textarea rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} /></label>
        </div>
      )}

      {step === 3 && (
        <div className="dev-formGrid">
          <h2 className="dev-sectionTitle">Project Feature</h2>

          {[{ key: 'projectFeature', title: 'Project Feature', options: projectFeatureOptions }, { key: 'productSpecification', title: 'Product Specification', options: productSpecificationOptions }, { key: 'amenities', title: 'Amenities', options: amenitiesOptions }, { key: 'connectivity', title: 'Near by', options: nearbyOptions }].map((block) => (
            <div className="dev-formGrid__full" key={block.key}>
              <p className="dev-miniTitle">{block.title}</p>
              <div className="dev-checkGrid">
                {block.options.map((item) => (
                  <label key={item} className="dev-checkItem">
                    <input type="checkbox" checked={form[block.key].includes(item)} onChange={() => toggleArrayValue(block.key, item)} />
                    {item}
                  </label>
                ))}
              </div>
              <div className="dev-tagInput">
                <input
                  placeholder={`Add custom ${block.title.toLowerCase()} (comma separated)`}
                  value={customInput[block.key]}
                  onChange={(e) => setCustomInput((previous) => ({ ...previous, [block.key]: e.target.value }))}
                />
                <button type="button" onClick={() => addCustomTags(block.key)}>Add</button>
              </div>
            </div>
          ))}

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
          <h2 className="dev-sectionTitle">Plan Purchase</h2>
          <p className="dev-muted">The project can only be submitted after an active plan is in place.</p>

          {planStatus.loading || plansLoading ? <p>Loading plans...</p> : null}
          {!planStatus.loading ? (
            <p>
              Current Plan Status:{' '}
              <b className={planStatus.hasActivePlan ? 'ok' : 'warn'}>{planStatus.hasActivePlan ? 'Active' : 'No Active Plan'}</b>
            </p>
          ) : null}

          {!planStatus.hasActivePlan ? (
            <>
              <div className="dev-paymentActions" style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  className="dev-btn dev-btn--ghost"
                  onClick={() => setShowAllPlans((prev) => !prev)}
                >
                  {showAllPlans ? 'Show developer plans' : 'Show all plans'}
                </button>
              </div>
              <div className="dev-planGrid">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    type="button"
                    className={`dev-planCard${form.selectedPlan === plan._id ? ' is-selected' : ''}`}
                    onClick={() => setField('selectedPlan', plan._id)}
                  >
                    <div className="dev-planCard__price">₹{plan.price || 0}</div>
                    <div className="dev-planCard__cycle">/{plan.validityDays || 0} days</div>
                    <p className="dev-planCard__title">{plan.planName}</p>
                    <p className="dev-planCard__meta">Plan Limit: {plan.planLimit || 0}</p>
                    <p className="dev-planCard__meta">Tag: {plan.tag || 'N/A'}</p>
                  </button>
                ))}
              </div>

              <div className="dev-paymentActions">
                <button
                  type="button"
                  className="dev-btn dev-btn--primary"
                  onClick={purchaseSelectedPlan}
                  disabled={submitting || !form.selectedPlan || planStatus.hasActivePlan}
                >
                  {submitting ? 'Creating order...' : 'Purchase Selected Plan'}
                </button>

                <button type="button" className="dev-btn dev-btn--ghost" onClick={checkAndActivatePayment} disabled={checkingPayment || !pendingOrder?.merchantOrderId}>
                  {checkingPayment ? 'Checking...' : 'Check Payment Status'}
                </button>
              </div>
            </>
          ) : (
            <div className="dev-planActiveBanner">
              <b>Plan already active.</b> You can go straight to <b>Finish & Submit</b>.
            </div>
          )}
        </div>
      )}

      {status.text ? <p className={`dev-status ${status.type === 'error' ? 'is-error' : 'is-success'}`}>{status.text}</p> : null}

      {showPlanActivatedPopup ? (
        <div className="dev-modalOverlay" role="dialog" aria-modal="true">
          <div className="dev-modalCard">
            <h3>Plan Purchase Successful</h3>
            <p>Payment successful. You can now submit the project.</p>
            <button type="button" className="dev-btn dev-btn--primary" onClick={() => setShowPlanActivatedPopup(false)}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      <div className="dev-actions">
        <button type="button" className="dev-btn dev-btn--ghost" onClick={goBack} disabled={step === 1 || submitting}>Back</button>
        {step < 4 ? (
          <button type="button" className="dev-btn dev-btn--primary" onClick={goNext} disabled={submitting}>Next</button>
        ) : (
          <button type="button" className="dev-btn dev-btn--primary" onClick={submitProject} disabled={submitting}>
            {submitting ? 'Submitting...' : editProjectId ? 'Update Project' : 'Finish & Submit'}
          </button>
        )}
      </div>
    </section>
  )
}
