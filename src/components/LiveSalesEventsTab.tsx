'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getLiveSalesEventConfig,
  updateLiveSalesEventConfig,
  recalculateLeaderboard,
} from '@/lib/api/live-sales-gamification';

const PRESETS = [
  { name: 'Balanced', order: 40, viewer: 30, revenue: 30 },
  { name: 'Sales Rush', order: 50, viewer: 25, revenue: 25 },
  { name: 'Viewer Rush', order: 25, viewer: 50, revenue: 25 },
  { name: 'Revenue Rush', order: 25, viewer: 20, revenue: 55 },
];

export default function LiveSalesEventsTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLiveSalesEventConfig();
      setConfig(data || {
        watch_rewards_enabled: false,
        watch_time_minutes: 10,
        freti_per_reward: 1,
        daily_cap_per_user: 0,
        per_stream_cap_per_user: 0,
        notifications_enabled: true,
        leaderboard_enabled: false,
        default_order_weight: 40,
        default_viewer_weight: 30,
        default_revenue_weight: 30,
        special_event_enabled: false,
        special_event_name: '',
        special_event_start_at: '',
        special_event_end_at: '',
        special_event_order_weight: 40,
        special_event_viewer_weight: 30,
        special_event_revenue_weight: 30,
      });
    } catch (error) {
      console.error('Failed to load live sales event config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live sales event config',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...config };
      // Remove id/audit fields from update
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      // Convert empty strings to null
      if (!payload.special_event_name) payload.special_event_name = null;
      if (!payload.special_event_start_at) payload.special_event_start_at = null;
      if (!payload.special_event_end_at) payload.special_event_end_at = null;

      await updateLiveSalesEventConfig(payload);
      toast({ title: 'Success', description: 'Live sales event config updated' });
      await loadConfig();
    } catch (error: any) {
      console.error('Failed to save config:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save config',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateLeaderboard();
      toast({ title: 'Success', description: 'Leaderboard recalculation started' });
    } catch (error) {
      console.error('Failed to recalculate leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate leaderboard',
        variant: 'destructive',
      });
    } finally {
      setRecalculating(false);
    }
  };

  const applyPreset = (prefix: 'default' | 'special', preset: typeof PRESETS[0]) => {
    setConfig((prev: any) => ({
      ...prev,
      [`${prefix}_order_weight`]: preset.order,
      [`${prefix}_viewer_weight`]: preset.viewer,
      [`${prefix}_revenue_weight`]: preset.revenue,
    }));
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Watch Rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="watch_rewards_enabled"
              checked={config.watch_rewards_enabled}
              onCheckedChange={(v) => updateField('watch_rewards_enabled', !!v)}
            />
            <Label htmlFor="watch_rewards_enabled">Enable watch-time rewards</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Watch time (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={config.watch_time_minutes}
                onChange={(e) => updateField('watch_time_minutes', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Freti per reward</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={config.freti_per_reward}
                onChange={(e) => updateField('freti_per_reward', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Daily cap per user (0 = no cap)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={config.daily_cap_per_user}
                onChange={(e) => updateField('daily_cap_per_user', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Per-stream cap per user (0 = no cap)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={config.per_stream_cap_per_user}
                onChange={(e) => updateField('per_stream_cap_per_user', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="notifications_enabled"
              checked={config.notifications_enabled}
              onCheckedChange={(v) => updateField('notifications_enabled', !!v)}
            />
            <Label htmlFor="notifications_enabled">Send reward notifications</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="leaderboard_enabled"
              checked={config.leaderboard_enabled}
              onCheckedChange={(v) => updateField('leaderboard_enabled', !!v)}
            />
            <Label htmlFor="leaderboard_enabled">Enable public vendor leaderboard</Label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Default Scoring Weights</Label>
              <Select onValueChange={(name) => applyPreset('default', PRESETS.find(p => p.name === name) || PRESETS[0])}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Apply preset" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label>Orders %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.default_order_weight}
                  onChange={(e) => updateField('default_order_weight', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Viewers %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.default_viewer_weight}
                  onChange={(e) => updateField('default_viewer_weight', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Revenue %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.default_revenue_weight}
                  onChange={(e) => updateField('default_revenue_weight', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="special_event_enabled"
              checked={config.special_event_enabled}
              onCheckedChange={(v) => updateField('special_event_enabled', !!v)}
            />
            <Label htmlFor="special_event_enabled">Enable special event leaderboard</Label>
          </div>

          {config.special_event_enabled && (
            <div className="space-y-4 border rounded-lg p-4">
              <div>
                <Label>Event name</Label>
                <Input
                  value={config.special_event_name || ''}
                  onChange={(e) => updateField('special_event_name', e.target.value)}
                  placeholder="e.g. Valentine's Live Sale"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start at</Label>
                  <Input
                    type="datetime-local"
                    value={config.special_event_start_at ? new Date(config.special_event_start_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateField('special_event_start_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>
                <div>
                  <Label>End at</Label>
                  <Input
                    type="datetime-local"
                    value={config.special_event_end_at ? new Date(config.special_event_end_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateField('special_event_end_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Special Event Scoring Weights</Label>
                  <Select onValueChange={(name) => applyPreset('special', PRESETS.find(p => p.name === name) || PRESETS[0])}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Apply preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map((p) => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label>Orders %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.special_event_order_weight}
                      onChange={(e) => updateField('special_event_order_weight', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Viewers %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.special_event_viewer_weight}
                      onChange={(e) => updateField('special_event_viewer_weight', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Revenue %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.special_event_revenue_weight}
                      onChange={(e) => updateField('special_event_revenue_weight', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? 'Recalculating...' : 'Recalculate Leaderboard Now'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
