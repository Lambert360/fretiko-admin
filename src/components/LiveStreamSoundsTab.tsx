'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { financeAPI, type Sound } from '@/lib/api/finance';
import { Plus, Trash2, Volume2, Loader2 } from 'lucide-react';

/**
 * Live Stream Sounds Tab
 *
 * Manages the platform-curated soundboard library shown to hosts during
 * live sales streams and live auctions. Sounds uploaded here are tagged
 * context='live_stream' so they never leak into the gift sound library.
 * Hosts can also upload their own sounds in-app — those are private to
 * each host and do not appear in this admin list.
 */
export default function LiveStreamSoundsTab() {
  const { toast } = useToast();
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSounds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeAPI.getSounds('live_stream');
      setSounds(data || []);
    } catch (error: any) {
      console.error('Failed to load live stream sounds:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to load live stream sounds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSounds();
  }, [loadSounds]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    try {
      setUploading(true);
      const { url } = await financeAPI.uploadGiftAsset(file, 'sound');
      await financeAPI.createSound({
        name: file.name.replace(/\.[^/.]+$/, ''),
        sound_url: url,
        context: 'live_stream',
      });
      toast({ title: 'Success', description: 'Live stream sound uploaded' });
      await loadSounds();
    } catch (error: any) {
      console.error('Failed to upload live stream sound:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to upload sound',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (sound: Sound) => {
    if (!confirm(`Delete "${sound.name}"? Hosts who pinned it will lose that quick slot.`)) return;
    try {
      setDeletingId(sound.id);
      await financeAPI.deleteSound(sound.id);
      toast({ title: 'Success', description: 'Sound deleted' });
      setSounds((prev) => prev.filter((s) => s.id !== sound.id));
    } catch (error: any) {
      console.error('Failed to delete sound:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete sound',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Stream Sounds</CardTitle>
            <CardDescription>
              Platform soundboard effects available to hosts during live sales streams and live
              auctions. Hosts can pin up to 3 of these as quick-play buttons.
            </CardDescription>
          </div>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            id="live-sound-upload"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('live-sound-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Upload Sound
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No live stream sounds yet. Upload a sound to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {sounds.map((sound) => (
              <div key={sound.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{sound.name}</p>
                    <audio src={sound.sound_url} controls className="h-8 w-48" />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(sound)}
                  disabled={deletingId === sound.id}
                >
                  {deletingId === sound.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
