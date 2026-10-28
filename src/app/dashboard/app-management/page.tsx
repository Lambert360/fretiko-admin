'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getSignPosts,
  getSignPostById,
  createSignPost,
  updateSignPost,
  deleteSignPost,
  uploadGenericSignPostMedia,
  uploadSignPostMedia,
  deleteSignPostMedia,
  updateSignPostMedia,
  type SignPost,
  type SignPostMedia,
} from '@/lib/api/app-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import LiveSalesEventsTab from '@/components/LiveSalesEventsTab';
import LiveStreamSoundsTab from '@/components/LiveStreamSoundsTab';
import RetailProgramTab from '@/components/RetailProgramTab';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Upload, Video } from 'lucide-react';

const screenOptions = [
  { value: 'home', label: 'Home' },
  { value: 'products', label: 'Products' },
  { value: 'live_sales', label: 'Live Sales' },
  { value: 'auctions', label: 'Auctions' },
  { value: 'all', label: 'All Screens' },
];

const emptyForm: any = {
  name: '',
  title: '',
  subtitle: '',
  actionUrl: '',
  screenTarget: 'all',
  countdownEnabled: false,
  countdownTarget: '',
  isActive: true,
  sortOrder: 0,
  startAt: '',
  endAt: '',
  media: [],
};

export default function AppManagementPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [signPosts, setSignPosts] = useState<SignPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SignPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingMediaIndex, setUploadingMediaIndex] = useState<number | null>(null);

  const canManage = isSuperAdmin || hasPermission('manage_departments') || hasPermission('manage_retail');

  const loadSignPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSignPosts();
      setSignPosts(response || []);
    } catch (error) {
      console.error('Failed to load sign posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sign posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSignPosts();
  }, [loadSignPosts]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const handleOpenEdit = async (item: SignPost) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      title: item.title,
      subtitle: item.subtitle || '',
      actionUrl: item.action_url || '',
      screenTarget: item.screen_target,
      countdownEnabled: item.countdown_enabled,
      countdownTarget: item.countdown_target ? new Date(item.countdown_target).toISOString().slice(0, 16) : '',
      isActive: item.is_active,
      sortOrder: item.sort_order,
      startAt: item.start_at ? new Date(item.start_at).toISOString().slice(0, 16) : '',
      endAt: item.end_at ? new Date(item.end_at).toISOString().slice(0, 16) : '',
      media: [],
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.title) {
      toast({
        title: 'Validation Error',
        description: 'Name and title are required',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      ...form,
      isActive: form.isActive,
      countdownEnabled: form.countdownEnabled,
      countdownTarget: form.countdownTarget ? new Date(form.countdownTarget).toISOString() : undefined,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    };

    if (editingItem) {
      delete payload.media;
    } else if (payload.media) {
      payload.media = payload.media.filter((m: any) => m.mediaUrl && m.mediaUrl.trim() !== '');
    }

    try {
      if (editingItem) {
        await updateSignPost(editingItem.id, payload);
        toast({ title: 'Success', description: 'Sign post updated' });
      } else {
        await createSignPost(payload);
        toast({ title: 'Success', description: 'Sign post created' });
      }
      setEditorOpen(false);
      await loadSignPosts();
    } catch (error: any) {
      console.error('Failed to save sign post:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save sign post',
        variant: 'destructive',
      });
    }
  };

  const handleAddMedia = () => {
    setForm({
      ...form,
      media: [
        ...(form.media || []),
        { mediaUrl: '', mediaType: 'image', sortOrder: (form.media || []).length, thumbnailUrl: undefined },
      ],
    });
  };

  const handleRemoveMedia = (index: number) => {
    setForm({ ...form, media: (form.media || []).filter((_: any, i: number) => i !== index) });
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.quicktime'];
    const isVideo = videoExts.some((ext) => value.toLowerCase().endsWith(ext));
    setForm({
      ...form,
      media: (form.media || []).map((m: any, i: number) =>
        i === index ? { ...m, mediaUrl: value, mediaType: isVideo ? 'video' : 'image' } : m
      ),
    });
  };

  const handleMediaSortChange = (index: number, value: string) => {
    setForm({
      ...form,
      media: (form.media || []).map((m: any, i: number) =>
        i === index ? { ...m, sortOrder: parseInt(value, 10) || 0 } : m
      ),
    });
  };

  const handleUploadCreateMedia = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingMediaIndex(index);
    try {
      const result = await uploadGenericSignPostMedia(file);
      setForm({
        ...form,
        media: (form.media || []).map((m: any, i: number) =>
          i === index
            ? {
                ...m,
                mediaUrl: result.mediaUrl,
                mediaType: result.mediaType,
                thumbnailUrl: result.thumbnailUrl || undefined,
                sortOrder: m.sortOrder ?? index,
              }
            : m
        ),
      });
      toast({ title: 'Success', description: 'Media uploaded' });
    } catch (error: any) {
      console.error('Failed to upload media:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to upload media',
        variant: 'destructive',
      });
    } finally {
      setUploadingMediaIndex(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sign post?')) return;
    try {
      await deleteSignPost(id);
      toast({ title: 'Success', description: 'Sign post deleted' });
      await loadSignPosts();
    } catch (error) {
      console.error('Failed to delete sign post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sign post',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (signPostId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const mediaList = (editingItem?.sign_post_media || []) as SignPostMedia[];
      const nextSortOrder = mediaList.length;
      await uploadSignPostMedia(signPostId, file, nextSortOrder);
      toast({ title: 'Success', description: 'Media uploaded' });
      const response = await getSignPostById(signPostId);
      setEditingItem(response);
      setSignPosts((prev) =>
        prev.map((sp) => (sp.id === signPostId ? response : sp))
      );
    } catch (error: any) {
      console.error('Failed to upload media:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to upload media',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media item?')) return;
    try {
      await deleteSignPostMedia(mediaId);
      toast({ title: 'Success', description: 'Media deleted' });
      if (editingItem) {
        const response = await getSignPostById(editingItem.id);
        setEditingItem(response);
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete media',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMediaSort = async (mediaId: string, newOrder: number) => {
    try {
      await updateSignPostMedia(mediaId, { sortOrder: newOrder });
      if (editingItem) {
        const response = await getSignPostById(editingItem.id);
        setEditingItem(response);
      }
    } catch (error) {
      console.error('Failed to update media sort order:', error);
    }
  };

  if (!canManage) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You do not have permission to manage app content.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Management</h1>
          <p className="text-muted-foreground">Manage hero banners and sign posts for the mobile app.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Sign Post
        </Button>
      </div>

      <Tabs defaultValue="sign-posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sign-posts">Sign Posts</TabsTrigger>
          <TabsTrigger value="live-events">Live Sales Events</TabsTrigger>
          <TabsTrigger value="live-sounds">Live Stream Sounds</TabsTrigger>
          <TabsTrigger value="retail-program">Retail Program</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign Posts</CardTitle>
            </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : signPosts.length === 0 ? (
            <p className="text-muted-foreground">No sign posts found.</p>
          ) : (
            <div className="space-y-4">
              {signPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {post.name}
                      <Badge variant={post.is_active ? 'default' : 'secondary'}>
                        {post.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Title: {post.title} · Screen: {post.screen_target} · Sort: {post.sort_order}
                    </div>
                    {post.sign_post_media && post.sign_post_media.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {post.sign_post_media.length} media item(s)
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(post)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Sign Post' : 'Create Sign Post'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Label>Admin Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer Sale Banner"
              />
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Hero title"
              />
            </div>

            <div>
              <Label>Subtitle</Label>
              <Textarea
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Hero subtitle"
                rows={2}
              />
            </div>

            <div>
              <Label>Action URL</Label>
              <Input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="e.g. /products?category=sale"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Screen Target</Label>
                <Select
                  value={form.screenTarget}
                  onValueChange={(value) => setForm({ ...form, screenTarget: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {screenOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start At</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
              </div>
              <div>
                <Label>End At</Label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="countdownEnabled"
                  type="checkbox"
                  checked={form.countdownEnabled}
                  onChange={(e) => setForm({ ...form, countdownEnabled: e.target.checked })}
                />
                <Label htmlFor="countdownEnabled" className="cursor-pointer">
                  Show countdown overlay
                </Label>
              </div>
              {form.countdownEnabled && (
                <div>
                  <Label>Countdown Target</Label>
                  <Input
                    type="datetime-local"
                    value={form.countdownTarget}
                    onChange={(e) => setForm({ ...form, countdownTarget: e.target.value })}
                  />
                </div>
              )}
            </div>

            {!editingItem && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-medium flex items-center justify-between">
                  Media Items
                  <Button type="button" variant="outline" size="sm" onClick={handleAddMedia}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Media
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.media && form.media.length > 0 ? (
                    form.media.map((media: any, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 p-3 border rounded-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                            {media.mediaUrl ? (
                              media.mediaType === 'video' ? (
                                media.thumbnailUrl ? (
                                  <img
                                    src={media.thumbnailUrl}
                                    alt="thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Video className="w-6 h-6" />
                                )
                              ) : (
                                <img
                                  src={media.mediaUrl}
                                  alt="media"
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="text-xs text-muted-foreground text-center">No media</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="space-y-1">
                              <Label className="text-xs">Media URL</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={media.mediaUrl}
                                  onChange={(e) => handleMediaUrlChange(index, e.target.value)}
                                  placeholder="https://... or upload below"
                                  className="flex-1"
                                />
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => handleUploadCreateMedia(index, e)}
                                    disabled={uploadingMediaIndex === index}
                                    className="hidden"
                                    id={`sign-post-media-upload-${index}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      document.getElementById(`sign-post-media-upload-${index}`)?.click()
                                    }
                                    disabled={uploadingMediaIndex === index}
                                  >
                                    {uploadingMediaIndex === index ? (
                                      '...'
                                    ) : (
                                      <>
                                        <Upload className="w-3 h-3 mr-1" />
                                        Upload
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Paste an image/video URL or click Upload to choose a file.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Sort Order</Label>
                                <Input
                                  type="number"
                                  value={media.sortOrder}
                                  onChange={(e) => handleMediaSortChange(index, e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveMedia(index)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No media added yet. Click "Add Media" to upload or enter a URL.
                    </p>
                  )}
                </div>
              </div>
            )}

            {editingItem && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-medium flex items-center justify-between">
                  Media Items
                  <Label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(editingItem.id, e)}
                    />
                    <span className="inline-flex items-center px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </span>
                  </Label>
                </div>

                <div className="space-y-3">
                  {editingItem.sign_post_media && editingItem.sign_post_media.length > 0 ? (
                    [...editingItem.sign_post_media]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((media) => (
                        <div
                          key={media.id}
                          className="flex items-center gap-3 p-3 border rounded-md"
                        >
                          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                            {media.media_type === 'video' ? (
                              media.thumbnail_url ? (
                                <img
                                src={media.thumbnail_url}
                                  alt="thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Video className="w-6 h-6" />
                              )
                            ) : (
                              <img
                                src={media.media_url}
                                alt="media"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium capitalize">{media.media_type}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {media.media_url.split('/').pop()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20 h-8"
                              value={media.sort_order}
                              onChange={(e) =>
                                handleUpdateMediaSort(media.id, parseInt(e.target.value, 10) || 0)
                              }
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMedia(media.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </TabsContent>
      <TabsContent value="live-events">
        <LiveSalesEventsTab />
      </TabsContent>
      <TabsContent value="live-sounds">
        <LiveStreamSoundsTab />
      </TabsContent>
      <TabsContent value="retail-program">
        <RetailProgramTab />
      </TabsContent>
    </Tabs>
  </div>
  );
}
