'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, Eye, Mail, Phone, Calendar, MapPin, Briefcase, Save, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import LandingTab from '@/components/website-management/LandingTab'

// Types
interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  publishedAt: string
  status: 'draft' | 'published'
  slug: string
  tags: string[]
  featuredImage?: string
}

interface JobListing {
  id: string
  title: string
  description: string
  requirements: string[]
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  department: string
  salary: string
  publishedAt: string
  status: 'draft' | 'published'
  applications: JobApplication[]
}

interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  name: string
  email: string
  phone: string
  resume: string
  coverLetter: string
  appliedAt: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired'
  experience?: string
  education?: string
  portfolio?: string
}

interface AboutContent {
  id: string
  section: string
  title: string
  content: string
  order: number
  updatedAt: string
  image?: string
}

interface FretikoNumbers {
  businessesConnected: string
  deliveriesCompleted: string
  citiesCovered: string
  activePartners: string
  onTimeDeliveryRate: string
  customerSatisfaction: string
  updatedAt: string
}

interface SupportMessage {
  id: string
  type: 'contact' | 'partnership_general' | 'partnership_logistics' | 'legal' | 'careers'
  name: string
  email: string
  phone?: string
  company?: string
  subject?: string
  category?: string
  partnershipType?: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  updatedAt?: string
  assignedTo?: string
  notes?: string
  metadata?: Record<string, any>
}

export default function WebsiteManagementPage() {
  const [activeTab, setActiveTab] = useState('blog')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  // State for each tab
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([])
  const [aboutContent, setAboutContent] = useState<AboutContent[]>([])
  const [fretikoNumbers, setFretikoNumbers] = useState<FretikoNumbers>({
    businessesConnected: '10,000+',
    deliveriesCompleted: '50,000+',
    citiesCovered: '15+',
    activePartners: '500+',
    onTimeDeliveryRate: '99%',
    customerSatisfaction: '4.8/5',
    updatedAt: '2024-01-01'
  })
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [selectedMessageType, setSelectedMessageType] = useState<'all' | 'contact' | 'partnership_general' | 'partnership_logistics' | 'legal' | 'careers'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')

  // Editor states
  const [blogEditorOpen, setBlogEditorOpen] = useState(false)
  const [jobEditorOpen, setJobEditorOpen] = useState(false)
  const [aboutEditorOpen, setAboutEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form states
  const [blogForm, setBlogForm] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    author: 'Fretiko Team',
    status: 'draft',
    tags: [],
    slug: '',
    featuredImage: ''
  })

  const [jobForm, setJobForm] = useState<Partial<JobListing>>({
    title: '',
    description: '',
    requirements: [],
    location: '',
    type: 'full-time',
    department: '',
    salary: '',
    status: 'draft'
  })

  const [aboutForm, setAboutForm] = useState<Partial<AboutContent>>({
    section: '',
    title: '',
    content: '',
    order: 1
  })

  // Load data from backend APIs
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      try {
        // Load all data in parallel
        const [
          blogResponse,
          jobsResponse,
          applicationsResponse,
          aboutResponse,
          supportResponse
        ] = await Promise.all([
          apiClient.getBlogPosts(),
          apiClient.getJobListings(),
          apiClient.getJobApplications(),
          apiClient.getAboutContent(),
          apiClient.getSupportMessages()
        ])

        setBlogPosts(blogResponse.data || [])
        setJobListings(jobsResponse.data || [])
        setJobApplications(applicationsResponse.data || [])
        setAboutContent(aboutResponse.data || [])
        setSupportMessages(supportResponse.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load data from server',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Blog post handlers
  const handleCreateBlogPost = () => {
    setEditingItem(null)
    setBlogForm({
      title: '',
      content: '',
      excerpt: '',
      author: 'Fretiko Team',
      status: 'draft',
      tags: [],
      slug: '',
      featuredImage: ''
    })
    setUploadingImage(false)
    setBlogEditorOpen(true)
  }

  const handleEditBlogPost = (post: BlogPost) => {
    setEditingItem(post)
    setBlogForm(post)
    setBlogEditorOpen(true)
  }

  const handleSaveBlogPost = async () => {
    try {
      if (editingItem) {
        // Update existing blog post
        await apiClient.updateBlogPost(editingItem.id, blogForm)
        toast({
          title: 'Success',
          description: 'Blog post updated successfully',
        })
      } else {
        // Create new blog post
        const newPost = {
          ...blogForm,
          publishedAt: new Date().toISOString().split('T')[0],
          slug: blogForm.title?.toLowerCase().replace(/\s+/g, '-') || ''
        }
        await apiClient.createBlogPost(newPost)
        toast({
          title: 'Success',
          description: 'Blog post created successfully',
        })
      }
      
      // Reload data to reflect changes
      const blogResponse = await apiClient.getBlogPosts()
      setBlogPosts(blogResponse.data || [])
      
      setBlogEditorOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast({
        title: 'Error',
        description: 'Failed to save blog post',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBlogPost = async (id: string) => {
    try {
      await apiClient.deleteBlogPost(id)
      
      // Reload data to reflect changes
      const blogResponse = await apiClient.getBlogPosts()
      setBlogPosts(blogResponse.data || [])
      
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive',
      })
    }
  }

  // Job listing handlers
  const handleCreateJobListing = () => {
    setEditingItem(null)
    setJobForm({
      title: '',
      description: '',
      requirements: [],
      location: '',
      type: 'full-time',
      department: '',
      salary: '',
      status: 'draft'
    })
    setJobEditorOpen(true)
  }

  const handleEditJobListing = (job: JobListing) => {
    setEditingItem(job)
    setJobForm(job)
    setJobEditorOpen(true)
  }

  const handleSaveJobListing = async () => {
    try {
      // TODO: API call to save job listing
      if (editingItem) {
        setJobListings(jobs => 
          jobs.map(j => j.id === editingItem.id ? { ...jobForm, id: editingItem.id } as JobListing : j)
        )
        toast({
          title: 'Success',
          description: 'Job listing updated successfully',
        })
      } else {
        const newJob = {
          ...jobForm,
          id: Date.now().toString(),
          publishedAt: new Date().toISOString().split('T')[0],
          applications: []
        } as JobListing
        setJobListings(jobs => [newJob, ...jobs])
        toast({
          title: 'Success',
          description: 'Job listing created successfully',
        })
      }
      setJobEditorOpen(false)
      setEditingItem(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save job listing',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteJobListing = (id: string) => {
    setJobListings(jobs => jobs.filter(job => job.id !== id))
    toast({
      title: 'Success',
      description: 'Job listing deleted successfully',
    })
  }

  // Job application handlers
  const handleUpdateApplicationStatus = (id: string, status: JobApplication['status']) => {
    setJobApplications(apps => 
      apps.map(app => 
        app.id === id ? { ...app, status } : app
      )
    )
    toast({
      title: 'Success',
      description: `Application status updated to ${status}`,
    })
  }

  const handleViewApplication = (application: JobApplication) => {
    setViewingApplication(application)
    setIsViewDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    setUploadingImage(true)

    try {
      // Upload to backend API
      const result = await apiClient.uploadBlogImage(file)
      
      setBlogForm(prev => ({ ...prev, featuredImage: result.url }))
      setUploadingImage(false)
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      })

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      })
      setUploadingImage(false)
    }
  }

  // About content handlers
  const handleEditAboutContent = (content: AboutContent) => {
    setEditingItem(content)
    setAboutForm(content)
    setAboutEditorOpen(true)
  }

  const handleSaveAboutContent = async () => {
    try {
      // TODO: API call to save about content
      if (editingItem) {
        setAboutContent(contents => 
          contents.map(c => c.id === editingItem.id ? { ...aboutForm, id: editingItem.id } as AboutContent : c)
        )
        toast({
          title: 'Success',
          description: 'About section updated successfully',
        })
      } else {
        const newContent = {
          ...aboutForm,
          id: Date.now().toString(),
          updatedAt: new Date().toISOString().split('T')[0]
        } as AboutContent
        setAboutContent(contents => [...contents, newContent])
        toast({
          title: 'Success',
          description: 'About section created successfully',
        })
      }
      setAboutEditorOpen(false)
      setEditingItem(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save about content',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAboutSection = (id: string) => {
    setAboutContent(contents => contents.filter(c => c.id !== id))
    toast({
      title: 'Success',
      description: 'About section deleted successfully',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Website Management</h1>
        <p className="text-muted-foreground">Manage website content including blog, careers, and company information</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blog">Blog Posts</TabsTrigger>
          <TabsTrigger value="landing">Landing</TabsTrigger>
          <TabsTrigger value="careers">Careers</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Blog Posts Tab */}
        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Blog Posts</span>
                <Button onClick={handleCreateBlogPost}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured Image</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {post.featuredImage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-green-500 rounded"></div>
                            </div>
                            <span className="text-xs text-green-600">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-gray-400 rounded"></div>
                            </div>
                            <span className="text-xs text-gray-500">No</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{post.publishedAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditBlogPost(post)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBlogPost(post.id)}>
                            <Trash2 className="w-4 h-4" />
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

        {/* Careers Tab */}
        <TabsContent value="careers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Job Listings</span>
                  <Button onClick={handleCreateJobListing}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Listing
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobListings.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.type}
                            </span>
                          </div>
                          <p className="text-sm">{job.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditJobListing(job)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteJobListing(job.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobApplications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{application.name}</h3>
                          <Badge variant={application.status === 'pending' ? 'secondary' : 'default'}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {application.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {application.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {application.appliedAt}
                          </span>
                        </div>
                        <p className="text-sm">{application.coverLetter}</p>
                        {application.experience && (
                          <p className="text-sm"><strong>Experience:</strong> {application.experience}</p>
                        )}
                        {application.education && (
                          <p className="text-sm"><strong>Education:</strong> {application.education}</p>
                        )}
                        {application.portfolio && (
                          <p className="text-sm"><strong>Portfolio:</strong> {application.portfolio}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Select value={application.status} onValueChange={(value) => handleUpdateApplicationStatus(application.id, value as JobApplication['status'])}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => handleViewApplication(application)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Company Information</span>
                <Button onClick={() => {
                  setEditingItem(null)
                  setAboutForm({
                    section: '',
                    title: '',
                    content: '',
                    order: Math.max(...aboutContent.map(c => c.order)) + 1
                  })
                  setAboutEditorOpen(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Section
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aboutContent.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{section.title}</h3>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditAboutContent(section)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAboutSection(section.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Section: {section.section} | Order: {section.order}
                    </p>
                    <p>{section.content}</p>
                    {section.image && (
                      <div className="mt-3">
                        <img 
                          src={section.image} 
                          alt={section.title} 
                          className="w-full max-w-md h-32 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = '';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Fretiko by Numbers Section */}
          <Card>
            <CardHeader>
              <CardTitle>Fretiko by Numbers</CardTitle>
              <CardDescription>Manage the statistics displayed in the website footer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Businesses Connected</label>
                  <Input
                    value={fretikoNumbers.businessesConnected}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, businessesConnected: e.target.value })}
                    placeholder="e.g., 10,000+"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Deliveries Completed</label>
                  <Input
                    value={fretikoNumbers.deliveriesCompleted}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, deliveriesCompleted: e.target.value })}
                    placeholder="e.g., 50,000+"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Cities Covered</label>
                  <Input
                    value={fretikoNumbers.citiesCovered}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, citiesCovered: e.target.value })}
                    placeholder="e.g., 15+"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Active Partners</label>
                  <Input
                    value={fretikoNumbers.activePartners}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, activePartners: e.target.value })}
                    placeholder="e.g., 500+"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">On-time Delivery Rate</label>
                  <Input
                    value={fretikoNumbers.onTimeDeliveryRate}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, onTimeDeliveryRate: e.target.value })}
                    placeholder="e.g., 99%"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Customer Satisfaction</label>
                  <Input
                    value={fretikoNumbers.customerSatisfaction}
                    onChange={(e) => setFretikoNumbers({ ...fretikoNumbers, customerSatisfaction: e.target.value })}
                    placeholder="e.g., 4.8/5"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => {
                  // TODO: API call to save fretiko numbers
                  setFretikoNumbers({ ...fretikoNumbers, updatedAt: new Date().toISOString().split('T')[0] })
                  toast({
                    title: 'Success',
                    description: 'Fretiko numbers updated successfully',
                  })
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Numbers
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Messages</CardTitle>
              <CardDescription>Manage messages from contact forms, partnership inquiries, and other communications</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedMessageType}
                  onChange={(e) => setSelectedMessageType(e.target.value as any)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="contact">Contact</option>
                  <option value="partnership_general">Partnership - General</option>
                  <option value="partnership_logistics">Partnership - Logistics</option>
                  <option value="legal">Legal</option>
                  <option value="careers">Careers</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Messages List */}
              <div className="space-y-4">
                {supportMessages
                  .filter(msg => {
                    const matchesSearch = searchTerm === '' || 
                      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase()))
                    
                    const matchesType = selectedMessageType === 'all' || msg.type === selectedMessageType
                    const matchesStatus = selectedStatus === 'all' || msg.status === selectedStatus
                    const matchesPriority = selectedPriority === 'all' || msg.priority === selectedPriority
                    
                    return matchesSearch && matchesType && matchesStatus && matchesPriority
                  })
                  .map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{message.name}</h3>
                            <Badge variant={
                              message.type === 'contact' ? 'default' :
                              message.type.includes('partnership') ? 'secondary' :
                              message.type === 'legal' ? 'destructive' : 'outline'
                            }>
                              {message.type.replace('_', ' ').replace('partnership', 'Partner')}
                            </Badge>
                            <Badge variant={
                              message.priority === 'urgent' ? 'destructive' :
                              message.priority === 'high' ? 'default' :
                              message.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {message.priority}
                            </Badge>
                            <Badge variant={
                              message.status === 'resolved' ? 'default' :
                              message.status === 'in_progress' ? 'secondary' :
                              message.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {message.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {message.email}
                            </span>
                            {message.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {message.phone}
                              </span>
                            )}
                            {message.company && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {message.company}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {message.subject && (
                            <p className="font-medium text-sm mb-2">Subject: {message.subject}</p>
                          )}
                          <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <select
                            value={message.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as SupportMessage['status']
                              setSupportMessages(msgs => 
                                msgs.map(m => m.id === message.id ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m)
                              )
                              toast({
                                title: 'Status Updated',
                                description: `Message status changed to ${newStatus}`,
                              })
                            }}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      {message.assignedTo && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Assigned to: {message.assignedTo}
                        </div>
                      )}
                      {message.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Notes: {message.notes}
                        </div>
                      )}
                    </div>
                  ))}
                
                {supportMessages.filter(msg => {
                  const matchesSearch = searchTerm === '' || 
                    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase()))
                  
                  const matchesType = selectedMessageType === 'all' || msg.type === selectedMessageType
                  const matchesStatus = selectedStatus === 'all' || msg.status === selectedStatus
                  const matchesPriority = selectedPriority === 'all' || msg.priority === selectedPriority
                  
                  return matchesSearch && matchesType && matchesStatus && matchesPriority
                }).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No support messages found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Landing Page Tab */}
        <TabsContent value="landing" className="space-y-6">
          <LandingTab />
        </TabsContent>
      </Tabs>

      {/* Blog Editor Dialog */}
      {blogEditorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Blog Post' : 'Create Blog Post'}
              </h2>
              <Button variant="outline" onClick={() => setBlogEditorOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={blogForm.title || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="Enter blog post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <Textarea
                  value={blogForm.excerpt || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Featured Image</label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    {/* File Upload */}
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={uploadingImage}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                    
                    {/* URL Input */}
                    <div className="flex-1">
                      <Input
                        value={blogForm.featuredImage || ''}
                        onChange={(e) => setBlogForm({ ...blogForm, featuredImage: e.target.value })}
                        placeholder="Or enter image URL"
                      />
                    </div>
                  </div>
                  
                  {/* Image Preview */}
                  {blogForm.featuredImage && (
                    <div className="mt-3">
                      <div className="relative inline-block">
                        <img 
                          src={blogForm.featuredImage} 
                          alt="Featured image preview" 
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            toast({
                              title: 'Error',
                              description: 'Failed to load image. Please check the URL or upload a new image.',
                              variant: 'destructive',
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setBlogForm({ ...blogForm, featuredImage: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Help Text */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>ΓÇó Upload an image file (JPG, PNG, GIF, WebP) - Max 5MB</p>
                    <p>ΓÇó Or enter an image URL directly</p>
                    <p>ΓÇó Recommended size: 1200x630px for best display</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={blogForm.content || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="Write your blog post content here..."
                  rows={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <Input
                  value={blogForm.tags?.join(', ') || ''}
                  onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={blogForm.status} onValueChange={(value) => setBlogForm({ ...blogForm, status: value as 'draft' | 'published' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBlogEditorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBlogPost}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Update' : 'Create'} Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Editor Dialog */}
      {jobEditorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Job Listing' : 'Create Job Listing'}
              </h2>
              <Button variant="outline" onClick={() => setJobEditorOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input
                  value={jobForm.title || ''}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={jobForm.description || ''}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the role and responsibilities"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Requirements</label>
                <Textarea
                  value={jobForm.requirements?.join('\n') || ''}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value.split('\n').filter(req => req.trim()) })}
                  placeholder="Enter each requirement on a new line"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={jobForm.location || ''}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="e.g., Remote, Lagos, Nigeria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <Input
                    value={jobForm.department || ''}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    placeholder="e.g., Engineering, Operations"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Type</label>
                  <Select value={jobForm.type} onValueChange={(value) => setJobForm({ ...jobForm, type: value as JobListing['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Salary Range</label>
                  <Input
                    value={jobForm.salary || ''}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    placeholder="e.g., $60k - $80k"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={jobForm.status} onValueChange={(value) => setJobForm({ ...jobForm, status: value as 'draft' | 'published' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setJobEditorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveJobListing}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Update' : 'Create'} Listing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Editor Dialog */}
      {aboutEditorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit About Section' : 'Create About Section'}
              </h2>
              <Button variant="outline" onClick={() => setAboutEditorOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Section</label>
                <Input
                  value={aboutForm.section || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, section: e.target.value })}
                  placeholder="e.g., mission, vision, values"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={aboutForm.title || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                  placeholder="Section title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={aboutForm.content || ''}
                  onChange={(e) => setAboutForm({ ...aboutForm, content: e.target.value })}
                  placeholder="Enter section content"
                  rows={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    {/* File Upload */}
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && file.type.startsWith('image/')) {
                              const previewUrl = URL.createObjectURL(file)
                              setAboutForm({ ...aboutForm, image: previewUrl })
                            }
                          }}
                          className="hidden"
                          id="about-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('about-image-upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    </div>
                    
                    {/* URL Input */}
                    <div className="flex-1">
                      <Input
                        value={aboutForm.image || ''}
                        onChange={(e) => setAboutForm({ ...aboutForm, image: e.target.value })}
                        placeholder="Or enter image URL"
                      />
                    </div>
                  </div>
                  
                  {/* Image Preview */}
                  {aboutForm.image && (
                    <div className="mt-2">
                      <div className="relative inline-block">
                        <img 
                          src={aboutForm.image} 
                          alt="Section image preview" 
                          className="w-full max-w-md h-32 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            toast({
                              title: 'Error',
                              description: 'Failed to load image. Please check the URL or upload a new image.',
                              variant: 'destructive',
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setAboutForm({ ...aboutForm, image: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
                <Input
                  type="number"
                  value={aboutForm.order || 1}
                  onChange={(e) => setAboutForm({ ...aboutForm, order: parseInt(e.target.value) })}
                  placeholder="Display order"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAboutEditorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAboutContent}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Update' : 'Create'} Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application View Dialog */}
      {isViewDialogOpen && viewingApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Application Details</h2>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <p className="mt-1 text-sm">{viewingApplication.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <p className="mt-1 text-sm">{viewingApplication.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <p className="mt-1 text-sm">{viewingApplication.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Applied At</label>
                  <p className="mt-1 text-sm">{viewingApplication.appliedAt}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="mt-1">
                    <Badge variant={viewingApplication.status === 'pending' ? 'secondary' : 'default'}>
                      {viewingApplication.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {viewingApplication.experience && (
                <div>
                  <label className="block text-sm font-medium mb-2">Experience</label>
                  <p className="mt-1 text-sm">{viewingApplication.experience}</p>
                </div>
              )}
              {viewingApplication.education && (
                <div>
                  <label className="block text-sm font-medium mb-2">Education</label>
                  <p className="mt-1 text-sm">{viewingApplication.education}</p>
                </div>
              )}
              {viewingApplication.portfolio && (
                <div>
                  <label className="block text-sm font-medium mb-2">Portfolio</label>
                  <a 
                    href={viewingApplication.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {viewingApplication.portfolio}
                  </a>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Resume</label>
                <div className="mt-1">
                  {viewingApplication.resume.endsWith('.pdf') ? (
                    <a 
                      href={viewingApplication.resume} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Resume (PDF)
                    </a>
                  ) : (
                    <p className="text-sm">{viewingApplication.resume}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Letter</label>
                <p className="mt-1 text-sm text-gray-700">{viewingApplication.coverLetter}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
