'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Calendar, User, Building, Mail, Phone, X, ZoomIn } from 'lucide-react'
import { logisticsAPI } from '@/lib/api/logistics'
import { partnershipsAPI } from '@/lib/api/partnerships'
import { useToast } from '@/hooks/use-toast'
import { Country, State, City } from 'country-state-city'

interface LogisticsApplication {
  id: string;
  trackingId: string;
  companyName: string;
  companyLogoUrl?: string;
  companyRegistrationNumber?: string;
  taxId?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone?: string;
  companyWebsite?: string;
  headquartersAddress: string;
  serviceAreas: string[];
  operatingHours?: Record<string, { start: string; end: string }>;
  vehicleFleet: Record<string, { count: number; photos?: string[] }>;
  totalRiders?: number;
  averageDailyDeliveries?: number;
  yearsInOperation?: number;
  insuranceCoverage?: Record<string, any>;
  serviceCategories?: string[];
  registrationDocumentUrls?: string[];
  insuranceDocumentUrls?: string[];
  fleetDocumentUrls?: string[];
  status: 'in_progress' | 'under_review' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface GeneralApplication {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  partnership_type: 'strategic' | 'technology' | 'marketing' | 'business' | 'international' | 'innovation' | 'other'
  message: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function PartnershipsPage() {
  const [activeTab, setActiveTab] = useState('logistics')
  const [logisticsApplications, setLogisticsApplications] = useState<LogisticsApplication[]>([])
  const [generalApplications, setGeneralApplications] = useState<GeneralApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [logisticsStatusFilter, setLogisticsStatusFilter] = useState<'all' | 'in_progress' | 'under_review' | 'verified' | 'rejected'>('all')
  const [generalStatusFilter, setGeneralStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all')
  const [selectedLogisticsApp, setSelectedLogisticsApp] = useState<LogisticsApplication | null>(null)
  const [selectedGeneralApp, setSelectedGeneralApp] = useState<GeneralApplication | null>(null)
  const [showLogisticsModal, setShowLogisticsModal] = useState(false)
  const [showGeneralModal, setShowGeneralModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string>('')
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('')
  const { toast } = useToast()

  // Dynamic country and state resolver using country-state-city library
  const getLocationName = (areaCode: string): string => {
    try {
      const cleanCode = areaCode.trim().toUpperCase()
      
      // Handle country-state format (e.g., "NG-LA")
      if (cleanCode.includes('-')) {
        const [countryCode, stateCode] = cleanCode.split('-')
        
        // Get country and state from library
        const country = Country.getCountryByCode(countryCode)
        const state = State.getStateByCodeAndCountry(stateCode, countryCode)
        
        if (country && state) {
          return `${state.name}, ${country.name}`
        } else if (country) {
          return `${country.name} (${stateCode})`
        }
      }
      
      // Handle country code only (e.g., "NG")
      const country = Country.getCountryByCode(cleanCode)
      if (country) {
        return country.name
      }
      
      // Handle state name lookup by ISO code
      const state = State.getStateByCode(cleanCode)
      if (state) {
        return state.name
      }
      
      // Return as-is if no mapping found
      return areaCode.trim()
    } catch (error) {
      console.warn('Error resolving location:', error)
      return areaCode.trim()
    }
  }

  // Vehicle emoji mapping
  const vehicleEmojis: Record<string, string> = {
    'motorcycle': ' motorcycle: ',
    'bike': ' bicycle: ',
    'scooter': ' scooter: ',
    'car': ' car: ',
    'van': ' van: ',
    'truck': ' truck: ',
    'pickup': ' pickup: ',
    'minivan': ' minivan: ',
    'bus': ' bus: ',
    'electric scooter': ' electric scooter: ',
    'electric bike': ' electric bike: ',
    'cargo bike': ' cargo bike: ',
    'delivery truck': ' delivery truck: ',
    'heavy truck': ' heavy truck: ',
    'trailer': ' trailer: '
  }

  // Fetch real data from backend API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        
        // Debug: Check if token exists
        const token = localStorage.getItem('accessToken')
        console.log('Partnerships Page - Token exists:', !!token)
        console.log('Partnerships Page - Token value:', token?.substring(0, 20) + '...')
        
        // Fetch logistics applications
        const logisticsResponse = await logisticsAPI.getPartnerApplications({
          status: logisticsStatusFilter === 'all' ? undefined : logisticsStatusFilter,
          search: searchTerm || undefined,
          page: 1,
          limit: 50
        })
        
        // Handle backend response structure { success: true, data: result }
        // The API client might return the data directly or wrapped in a response object
        const response = logisticsResponse as any;
        const applications = response.data?.applications || response.applications || [];
        
        if (response.success === false) {
          throw new Error(response.message || 'Failed to fetch applications');
        }
        
        // Transform PartnerApplication to LogisticsApplication format
        const transformedApplications = applications.map((app: any) => ({
          id: app.id,
          trackingId: app.tracking_id || app.trackingId,
          companyName: app.company_name || app.companyName,
          companyLogoUrl: app.company_logo_url || app.companyLogoUrl,
          companyRegistrationNumber: app.company_registration_number || app.companyRegistrationNumber,
          taxId: app.tax_id || app.taxId,
          contactPersonName: app.contact_person_name || app.contactPersonName,
          contactEmail: app.contact_email || app.contactEmail,
          contactPhone: app.contact_phone || app.contactPhone,
          companyWebsite: app.company_website || app.companyWebsite,
          headquartersAddress: app.headquarters_address || app.headquartersAddress,
          serviceAreas: Array.isArray(app.service_areas) ? app.service_areas : (Array.isArray(app.serviceAreas) ? app.serviceAreas : []),
          operatingHours: app.operating_hours || app.operatingHours,
          vehicleFleet: app.vehicle_fleet || app.vehicleFleet || {},
          totalRiders: app.total_riders || app.totalRiders,
          averageDailyDeliveries: app.average_daily_deliveries || app.averageDailyDeliveries,
          yearsInOperation: app.years_in_operation || app.yearsInOperation,
          insuranceCoverage: app.insurance_coverage || app.insuranceCoverage,
          serviceCategories: app.service_categories || app.serviceCategories,
          registrationDocumentUrls: app.registration_document_urls || app.registrationDocumentUrls,
          insuranceDocumentUrls: app.insurance_document_urls || app.insuranceDocumentUrls,
          fleetDocumentUrls: app.fleet_document_urls || app.fleetDocumentUrls,
          status: app.status,
          created_at: app.created_at || app.createdAt,
          updated_at: app.updated_at || app.updatedAt
        }))
        
        setLogisticsApplications(transformedApplications)
        
        // Fetch general partnership applications
        try {
          const generalResponse = await partnershipsAPI.getGeneralApplications({
            status: generalStatusFilter === 'all' ? undefined : generalStatusFilter,
            search: searchTerm || undefined,
            page: 1,
            limit: 50
          })
          
          // Handle different response structures
          const generalResponseObj = generalResponse as any;
          if (generalResponseObj.success === false) {
            throw new Error(generalResponseObj.message || 'Failed to fetch general applications');
          }
          
          // Get applications from different possible response structures
          const applications = generalResponseObj.data?.applications || generalResponseObj.applications || [];
          console.log('General Applications Response:', generalResponseObj)
          console.log('Parsed Applications:', applications)
          console.log('Applications Count:', applications.length)
          setGeneralApplications(applications)
        } catch (generalError) {
          console.warn('Failed to fetch general applications (backend may not be ready):', generalError)
          setGeneralApplications([])
        }
        
        setLoading(false)
      } catch (error: any) {
        console.error('Failed to fetch applications:', error)
        if (error.response) {
          console.error('Response data:', error.response.data)
          console.error('Response status:', error.response.status)
          console.error('Response headers:', error.response.headers)
          console.error('Is 401 error:', error.response.status === 401)
          console.error('Error message:', error.response?.data?.message)
          
          // Check if this is an authentication issue
          if (error.response.status === 401) {
            console.warn('Authentication failed - checking token validity...')
            const currentToken = localStorage.getItem('accessToken')
            console.warn('Current token:', currentToken?.substring(0, 20) + '...')
            
            // Don't show toast for 401, let interceptor handle redirect
            // Note: Don't return here - let error handling continue
          }
        }
        toast({
          title: 'Error',
          description: `Failed to load partnership applications: ${error.response?.data?.message || error.message}`,
          variant: 'destructive',
        })
        setLoading(false)
      }
    }

    fetchApplications()
  }, [logisticsStatusFilter, generalStatusFilter, searchTerm])

  const getStatusBadge = (status: string, type: 'logistics' | 'general') => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      under_review: { variant: 'default', icon: Eye, label: 'Under Review' },
      verified: { variant: 'default', icon: CheckCircle, label: 'Verified' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    }

    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPartnershipTypeBadge = (type: string) => {
    const types = {
      strategic: { label: 'Strategic', color: 'bg-purple-100 text-purple-800' },
      technology: { label: 'Technology', color: 'bg-blue-100 text-blue-800' },
      marketing: { label: 'Marketing', color: 'bg-green-100 text-green-800' },
      business: { label: 'Business', color: 'bg-orange-100 text-orange-800' },
      international: { label: 'International', color: 'bg-indigo-100 text-indigo-800' },
      innovation: { label: 'Innovation', color: 'bg-pink-100 text-pink-800' },
      other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
    }

    const config = types[type as keyof typeof types] || types.other
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to extract state name from formatted location
  const extractStateName = (locationName: string): string => {
    // For locations like "Abia, Nigeria", extract just "Abia"
    if (locationName.includes(', ')) {
      return locationName.split(', ')[0]
    }
    return locationName
  }

  // Helper function to extract country from original area code
  const extractCountryFromLocation = (areaCode: string): string => {
    try {
      const cleanCode = areaCode.trim().toUpperCase()
      
      // Handle country-state format (e.g., "NG-LA")
      if (cleanCode.includes('-')) {
        const [countryCode] = cleanCode.split('-')
        const country = Country.getCountryByCode(countryCode)
        return country ? country.name : countryCode
      }
      
      // Handle country code only (e.g., "NG")
      const country = Country.getCountryByCode(cleanCode)
      return country ? country.name : cleanCode
    } catch (error) {
      console.warn('Error extracting country:', error)
      return areaCode.trim()
    }
  }

  // Helper function to check if location is country only
  const isCountryOnly = (locationName: string): boolean => {
    // If it doesn't contain a comma, it's likely a country
    return !locationName.includes(', ')
  }

  const formatServiceAreas = (areas: string[] | undefined | null) => {
    if (!areas || !Array.isArray(areas)) {
      return 'No service areas specified'
    }
    
    // Debug: Log raw data to understand what we're receiving
    console.log('Raw service areas data:', areas)
    
    // Process and filter areas
    const processedAreas = areas.map(area => {
      const locationName = getLocationName(area)
      return {
        original: area,
        name: locationName,
        country: extractCountryFromLocation(area),
        isCountry: isCountryOnly(locationName)
      }
    }).filter(item => {
      // Filter out invalid/corrupted data
      if (!item.name || item.name.trim() === '') return false
      
      // Filter out obviously invalid codes (single letters and numbers that aren't valid)
      const cleanArea = item.original.trim().toUpperCase()
      const invalidPatterns = [/^[A-Z]$/, /^\d+$/] // Single letters or numbers only
      
      if (invalidPatterns.some(pattern => pattern.test(cleanArea))) {
        // Check if it's a valid country code using library
        const isValidCountry = Country.getCountryByCode(cleanArea)
        if (!isValidCountry) {
          console.warn('Filtered invalid service area code:', item.original)
          return false
        }
      }
      
      return true
    })
    
    // Group by country
    const groupedByCountry = processedAreas.reduce((groups, item) => {
      const country = item.country
      if (!groups[country]) {
        groups[country] = []
      }
      groups[country].push(item)
      return groups
    }, {} as Record<string, typeof processedAreas>)
    
    // Format grouped result
    return Object.entries(groupedByCountry).map(([country, items]) => {
      const countryItem = items.find(item => item.isCountry)
      const states = items.filter(item => !item.isCountry).map(item => extractStateName(item.name))
      
      if (countryItem && states.length > 0) {
        return `${country}: ${states.join(', ')}`
      } else if (countryItem) {
        return country
      } else if (states.length > 0) {
        return `${country}: ${states.join(', ')}`
      }
      return ''
    }).filter((item): item is string => Boolean(item)).map(item => String(item)).join('\n')
  }

  const formatOperatingHours = (hours: Record<string, { start: string; end: string }> | undefined) => {
    if (!hours || Object.keys(hours).length === 0) {
      return 'Not specified'
    }
    return Object.entries(hours).map(([day, time]) => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      return `${dayName}: ${time.start} - ${time.end}`
    }).join(', ')
  }

  const formatVehicleFleet = (fleet: Record<string, { count: number; photos?: string[] }> | undefined) => {
    if (!fleet || Object.keys(fleet).length === 0) {
      return 'No fleet information'
    }
    return Object.entries(fleet).map(([vehicle, info]) => {
      const vehicleLower = vehicle.toLowerCase()
      // Find matching emoji or use default
      let emoji = ' truck: ' // default emoji
      for (const [key, value] of Object.entries(vehicleEmojis)) {
        if (vehicleLower.includes(key)) {
          emoji = value
          break
        }
      }
      return `${emoji}${info.count}`
    }).join(', ')
  }

  const formatDocumentUrls = (urls: string[] | undefined, title: string) => {
    if (!urls || urls.length === 0) {
      return []
    }
    return urls.map((url, index) => {
      // Extract the base URL and path from the existing URL
      if (url.includes('supabase.co')) {
        // URL already has correct domain, add authentication token for private bucket
        const token = localStorage.getItem('accessToken')
        if (token && url.includes('partnership-documents')) {
          // Add token as query parameter for private bucket access
          const separator = url.includes('?') ? '&' : '?'
          const authenticatedUrl = `${url}${separator}token=${token}`
          return {
            name: `${title} ${index + 1}`,
            url: authenticatedUrl
          }
        }
        return {
          name: `${title} ${index + 1}`,
          url: url
        }
      } else {
        // Fallback for relative paths (shouldn't happen with current setup)
        return {
          name: `${title} ${index + 1}`,
          url: url
        }
      }
    })
  }

  const filteredLogisticsApplications = logisticsApplications.filter(app => {
    const matchesSearch = !searchTerm || 
      (app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.contactPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = logisticsStatusFilter === 'all' || app.status === logisticsStatusFilter
    return matchesSearch && matchesStatus
  })

  const filteredGeneralApplications = generalApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.company && app.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         app.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = generalStatusFilter === 'all' || app.status === generalStatusFilter
    return matchesSearch && matchesStatus
  })

  // Handle verify/reject actions for logistics
  const handleVerifyLogisticsApplication = async (applicationId: string) => {
    try {
      await logisticsAPI.verifyPartnerApplication(applicationId, 'Application verified by admin')
      toast({
        title: 'Success',
        description: 'Application verified successfully',
      })
      // Refresh data
      const response = await logisticsAPI.getPartnerApplications({
        status: logisticsStatusFilter === 'all' ? undefined : logisticsStatusFilter,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      })
      
      // Handle different response structures
      const responseObj = response as any;
      const applications = responseObj.data?.applications || responseObj.applications || []
      
      // Transform PartnerApplication to LogisticsApplication format
      const transformedApplications = applications.map((app: any) => ({
        id: app.id,
        trackingId: app.tracking_id || app.trackingId,
        companyName: app.company_name || app.companyName,
        companyLogoUrl: app.company_logo_url || app.companyLogoUrl,
        companyRegistrationNumber: app.company_registration_number || app.companyRegistrationNumber,
        taxId: app.tax_id || app.taxId,
        contactPersonName: app.contact_person_name || app.contactPersonName,
        contactEmail: app.contact_email || app.contactEmail,
        contactPhone: app.contact_phone || app.contactPhone,
        companyWebsite: app.company_website || app.companyWebsite,
        headquartersAddress: app.headquarters_address || app.headquartersAddress,
        serviceAreas: Array.isArray(app.service_areas) ? app.service_areas : (Array.isArray(app.serviceAreas) ? app.serviceAreas : []),
        operatingHours: app.operating_hours || app.operatingHours,
        vehicleFleet: app.vehicle_fleet || app.vehicleFleet || {},
        totalRiders: app.total_riders || app.totalRiders,
        averageDailyDeliveries: app.average_daily_deliveries || app.averageDailyDeliveries,
        yearsInOperation: app.years_in_operation || app.yearsInOperation,
        insuranceCoverage: app.insurance_coverage || app.insuranceCoverage,
        serviceCategories: app.service_categories || app.serviceCategories,
        registrationDocumentUrls: app.registration_document_urls || app.registrationDocumentUrls,
        insuranceDocumentUrls: app.insurance_document_urls || app.insuranceDocumentUrls,
        fleetDocumentUrls: app.fleet_document_urls || app.fleetDocumentUrls,
        status: app.status,
        created_at: app.created_at || app.createdAt,
        updated_at: app.updated_at || app.updatedAt
      }))
      
      setLogisticsApplications(transformedApplications)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify application',
        variant: 'destructive',
      })
    }
  }

  const handleRejectLogisticsApplication = async (applicationId: string) => {
    try {
      await logisticsAPI.rejectPartnerApplication(applicationId, 'Rejected by admin', 'Application does not meet requirements')
      toast({
        title: 'Success',
        description: 'Application rejected successfully',
      })
      // Refresh data
      const response = await logisticsAPI.getPartnerApplications({
        status: logisticsStatusFilter === 'all' ? undefined : logisticsStatusFilter,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      })
      
      // Handle different response structures
      const responseObj = response as any;
      const applications = responseObj.data?.applications || responseObj.applications || []
      
      // Transform PartnerApplication to LogisticsApplication format
      const transformedApplications = applications.map((app: any) => ({
        id: app.id,
        trackingId: app.tracking_id || app.trackingId,
        companyName: app.company_name || app.companyName,
        companyLogoUrl: app.company_logo_url || app.companyLogoUrl,
        companyRegistrationNumber: app.company_registration_number || app.companyRegistrationNumber,
        taxId: app.tax_id || app.taxId,
        contactPersonName: app.contact_person_name || app.contactPersonName,
        contactEmail: app.contact_email || app.contactEmail,
        contactPhone: app.contact_phone || app.contactPhone,
        companyWebsite: app.company_website || app.companyWebsite,
        headquartersAddress: app.headquarters_address || app.headquartersAddress,
        serviceAreas: Array.isArray(app.service_areas) ? app.service_areas : (Array.isArray(app.serviceAreas) ? app.serviceAreas : []),
        operatingHours: app.operating_hours || app.operatingHours,
        vehicleFleet: app.vehicle_fleet || app.vehicleFleet || {},
        totalRiders: app.total_riders || app.totalRiders,
        averageDailyDeliveries: app.average_daily_deliveries || app.averageDailyDeliveries,
        yearsInOperation: app.years_in_operation || app.yearsInOperation,
        insuranceCoverage: app.insurance_coverage || app.insuranceCoverage,
        serviceCategories: app.service_categories || app.serviceCategories,
        registrationDocumentUrls: app.registration_document_urls || app.registrationDocumentUrls,
        insuranceDocumentUrls: app.insurance_document_urls || app.insuranceDocumentUrls,
        fleetDocumentUrls: app.fleet_document_urls || app.fleetDocumentUrls,
        status: app.status,
        created_at: app.created_at || app.createdAt,
        updated_at: app.updated_at || app.updatedAt
      }))
      
      setLogisticsApplications(transformedApplications)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject application',
        variant: 'destructive',
      })
    }
  }

  // Handle approve/reject actions for general partnerships
  const handleApproveGeneralApplication = async (applicationId: string) => {
    try {
      await partnershipsAPI.approveGeneralApplication(applicationId, 'Application approved by admin')
      toast({
        title: 'Success',
        description: 'Application approved successfully',
      })
      // Refresh data
      const response = await partnershipsAPI.getGeneralApplications({
        status: generalStatusFilter === 'all' ? undefined : generalStatusFilter,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      })
      
      // Handle different response structures
      const responseObj = response as any;
      if (responseObj.success === false) {
        console.warn('Failed to fetch general applications (backend may not be ready):', responseObj.message)
        setGeneralApplications([])
      } else {
        // Get applications from different possible response structures
        const applications = responseObj.data?.applications || responseObj.applications || [];
        setGeneralApplications(applications)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve application',
        variant: 'destructive',
      })
    }
  }

  const handleRejectGeneralApplication = async (applicationId: string) => {
    try {
      await partnershipsAPI.rejectGeneralApplication(applicationId, 'Rejected by admin', 'Application does not meet requirements')
      toast({
        title: 'Success',
        description: 'Application rejected successfully',
      })
      // Refresh data
      const response = await partnershipsAPI.getGeneralApplications({
        status: generalStatusFilter === 'all' ? undefined : generalStatusFilter,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      })
      
      // Handle different response structures
      const responseObj = response as any;
      if (responseObj.success === false) {
        console.warn('Failed to fetch general applications (backend may not be ready):', responseObj.message)
        setGeneralApplications([])
      } else {
        // Get applications from different possible response structures
        const applications = responseObj.data?.applications || responseObj.applications || [];
        setGeneralApplications(applications)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject application',
        variant: 'destructive',
      })
    }
  }

  const handleViewLogisticsApplication = (application: LogisticsApplication) => {
    setSelectedLogisticsApp(application)
    setShowLogisticsModal(true)
  }

  const handleViewGeneralApplication = async (applicationId: string) => {
    try {
      const response = await partnershipsAPI.getGeneralApplicationById(applicationId)
      setSelectedGeneralApp(response)
      setShowGeneralModal(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch application details',
        variant: 'destructive',
      })
    }
  }

  const handleViewDocument = (url: string, name: string) => {
    setSelectedDocumentUrl(url)
    setSelectedDocumentName(name)
    setShowDocumentModal(true)
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setShowImageModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partnership Applications</h1>
          <p className="text-muted-foreground">
            Manage and review partnership applications from logistics partners and other business inquiries
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logistics" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Logistics Partners
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            General Partnerships
          </TabsTrigger>
        </TabsList>

        {/* Logistics Partners Tab */}
        <TabsContent value="logistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Logistics Partner Applications</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={logisticsStatusFilter} onValueChange={(value) => setLogisticsStatusFilter(value as typeof logisticsStatusFilter)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Service Areas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogisticsApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-mono">{application.trackingId}</TableCell>
                      <TableCell className="font-medium">{application.companyName}</TableCell>
                      <TableCell>{application.contactPersonName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{application.contactEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate" title={String(formatServiceAreas(application.serviceAreas) || '')}>
                          {formatServiceAreas(application.serviceAreas)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status, 'logistics')}</TableCell>
                      <TableCell>{formatDate(application.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewLogisticsApplication(application)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerifyLogisticsApplication(application.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectLogisticsApplication(application.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Partnerships Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>General Partnership Applications</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  </div>
                  <Select value={generalStatusFilter} onValueChange={(value) => setGeneralStatusFilter(value as typeof generalStatusFilter)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Partnership Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGeneralApplications.map((application: GeneralApplication) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.name}</TableCell>
                      <TableCell>{application.company || '-'}</TableCell>
                      <TableCell>{application.email}</TableCell>
                      <TableCell>{getPartnershipTypeBadge(application.partnership_type)}</TableCell>
                      <TableCell>{getStatusBadge(application.status, 'general')}</TableCell>
                      <TableCell>{formatDate(application.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewGeneralApplication(application.id)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleApproveGeneralApplication(application.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectGeneralApplication(application.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logistics Application Modal */}
      <Dialog open={showLogisticsModal} onOpenChange={setShowLogisticsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logistics Partner Application Details</DialogTitle>
          </DialogHeader>
          {selectedLogisticsApp && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Tracking ID</h4>
                  <p className="font-mono">{selectedLogisticsApp?.trackingId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <div>{getStatusBadge(selectedLogisticsApp?.status || 'pending', 'logistics')}</div>
                </div>
              </div>
              
              {/* Company Logo */}
              {selectedLogisticsApp?.companyLogoUrl && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Company Logo</h4>
                  <div className="mt-2">
                    <div 
                      className="relative inline-block cursor-pointer group"
                      onClick={() => selectedLogisticsApp?.companyLogoUrl && handleImageClick(selectedLogisticsApp.companyLogoUrl)}
                    >
                      <img 
                        src={selectedLogisticsApp?.companyLogoUrl || ''} 
                        alt="Company Logo" 
                        className="h-20 w-20 object-cover rounded-lg border transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Click to expand</p>
                  </div>
                </div>
              )}
              
              {/* Company Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Company Name</h4>
                  <p>{selectedLogisticsApp?.companyName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Registration Number</h4>
                  <p>{selectedLogisticsApp?.companyRegistrationNumber || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Tax ID</h4>
                  <p>{selectedLogisticsApp?.taxId || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Years in Operation</h4>
                  <p>{selectedLogisticsApp?.yearsInOperation || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Contact Person</h4>
                  <p>{selectedLogisticsApp?.contactPersonName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedLogisticsApp?.contactEmail}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Phone</h4>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedLogisticsApp?.contactPhone || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Company Website</h4>
                  {selectedLogisticsApp?.companyWebsite ? (
                    <a 
                      href={selectedLogisticsApp?.companyWebsite || ''} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Building className="w-4 h-4" />
                      {selectedLogisticsApp?.companyWebsite || ''}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              </div>
              
              {/* Address and Service Areas */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Headquarters Address</h4>
                <p>{selectedLogisticsApp?.headquartersAddress}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Service Areas</h4>
                <p className="whitespace-pre-wrap">{formatServiceAreas(selectedLogisticsApp?.serviceAreas) || ''}</p>
              </div>
              
              {/* Operating Hours */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Operating Hours</h4>
                <p>{formatOperatingHours(selectedLogisticsApp?.operatingHours)}</p>
              </div>
              
              {/* Fleet Information */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Vehicle Fleet</h4>
                <p>{formatVehicleFleet(selectedLogisticsApp?.vehicleFleet)}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Total Riders</h4>
                    <p>{selectedLogisticsApp?.totalRiders || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Average Daily Deliveries</h4>
                    <p>{selectedLogisticsApp?.averageDailyDeliveries || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              {/* Service Categories */}
              {selectedLogisticsApp?.serviceCategories && (selectedLogisticsApp?.serviceCategories?.length || 0) > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Service Categories</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLogisticsApp?.serviceCategories?.map((category: string) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Documents */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Documents</h4>
                
                {/* Registration Documents */}
                {selectedLogisticsApp?.registrationDocumentUrls && (selectedLogisticsApp?.registrationDocumentUrls?.length || 0) > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">Registration Documents</h5>
                    <div className="space-y-2">
                      {formatDocumentUrls(selectedLogisticsApp?.registrationDocumentUrls || [], 'Registration Document').map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => handleViewDocument(doc.url, doc.name)}
                          className="flex items-center gap-2 text-blue-600 hover:underline p-2 border rounded hover:bg-muted/50 text-left"
                        >
                          <Calendar className="w-4 h-4" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Insurance Documents */}
                {selectedLogisticsApp?.insuranceDocumentUrls && (selectedLogisticsApp?.insuranceDocumentUrls?.length || 0) > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">Insurance Documents</h5>
                    <div className="space-y-2">
                      {formatDocumentUrls(selectedLogisticsApp?.insuranceDocumentUrls || [], 'Insurance Document').map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => handleViewDocument(doc.url, doc.name)}
                          className="flex items-center gap-2 text-blue-600 hover:underline p-2 border rounded hover:bg-muted/50 text-left"
                        >
                          <Calendar className="w-4 h-4" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fleet Documents */}
                {selectedLogisticsApp?.fleetDocumentUrls && (selectedLogisticsApp?.fleetDocumentUrls?.length || 0) > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">Fleet Documents</h5>
                    <div className="space-y-2">
                      {formatDocumentUrls(selectedLogisticsApp?.fleetDocumentUrls || [], 'Fleet Document').map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => handleViewDocument(doc.url, doc.name)}
                          className="flex items-center gap-2 text-blue-600 hover:underline p-2 border rounded hover:bg-muted/50 text-left"
                        >
                          <Calendar className="w-4 h-4" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Applied</h4>
                  <p>{formatDate(selectedLogisticsApp?.created_at || '')}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Last Updated</h4>
                  <p>{formatDate(selectedLogisticsApp?.updated_at || '')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* General Partnership Application Modal */}
      <Dialog open={showGeneralModal} onOpenChange={setShowGeneralModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>General Partnership Application Details</DialogTitle>
          </DialogHeader>
          {selectedGeneralApp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Name</h4>
                  <p>{selectedGeneralApp?.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <div>{getStatusBadge(selectedGeneralApp?.status || 'pending', 'general')}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedGeneralApp?.email}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Phone</h4>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedGeneralApp?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Company</h4>
                  <p>{selectedGeneralApp?.company || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Partnership Type</h4>
                  <div>{getPartnershipTypeBadge(selectedGeneralApp?.partnership_type || 'other')}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Message</h4>
                <p className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{selectedGeneralApp?.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Applied</h4>
                  <p>{formatDate(selectedGeneralApp?.created_at || '')}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Last Updated</h4>
                  <p>{formatDate(selectedGeneralApp?.updated_at || '')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Company Logo</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-2">
            <div className="flex items-center justify-center">
              <img 
                src={selectedImageUrl} 
                alt="Company Logo Full Size" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">{selectedDocumentName}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocumentModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-2">
            <div className="flex items-center justify-center">
              <iframe
                src={selectedDocumentUrl}
                className="w-full h-[70vh] border-0 rounded-lg"
                title={selectedDocumentName}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
