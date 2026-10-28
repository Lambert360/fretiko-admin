'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Ban } from 'lucide-react';
import {
  getRetailConfig,
  updateRetailConfig,
  getRetailStats,
  getRetailCommissions,
  getRetailReposts,
  disableRepostEarning,
  type RetailConfig,
  type RetailStats,
  type RetailCommissionRow,
  type RetailRepostRow,
} from '@/lib/api/retail';

export default function RetailProgramTab() {
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [config, setConfig] = useState<RetailConfig | null>(null);
  const [stats, setStats] = useState<RetailStats | null>(null);
  const [commissions, setCommissions] = useState<RetailCommissionRow[]>([]);
  const [reposts, setReposts] = useState<RetailRepostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = isSuperAdmin || hasPermission('manage_retail');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, statsData, commissionsData, repostsData] = await Promise.all([
        getRetailConfig(),
        getRetailStats(),
        getRetailCommissions(25, 0),
        getRetailReposts(25, 0),
      ]);
      setConfig(configData);
      setStats(statsData);
      setCommissions(commissionsData?.rows || []);
      setReposts(repostsData?.rows || []);
    } catch (error: any) {
      console.error('Failed to load retail program data:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to load retail program data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManage) loadAll();
  }, [canManage, loadAll]);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateRetailConfig({
        retail_enabled: config.retail_enabled,
        commission_rate: config.commission_rate,
        collaborators_enabled: config.collaborators_enabled,
      });
      toast({ title: 'Success', description: 'Retail config updated' });
      await loadAll();
    } catch (error: any) {
      console.error('Failed to save retail config:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save config',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (repostId: string) => {
    if (!confirm('Disable earning on this repost? The repost stays live, but no future commissions will credit.')) return;
    try {
      await disableRepostEarning(repostId);
      toast({ title: 'Done', description: 'Earning disabled on that repost' });
      setReposts((prev) => prev.filter((r) => r.id !== repostId));
      await loadAll();
    } catch (error: any) {
      console.error('Failed to disable repost earning:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to disable earning',
        variant: 'destructive',
      });
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You do not have permission to manage the retail program.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading retail program…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Retail Program Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="retail-enabled"
                  checked={config.retail_enabled}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, retail_enabled: v === true })
                  }
                />
                <Label htmlFor="retail-enabled" className="cursor-pointer">
                  Retail reposts enabled (product & service reposts can earn commissions)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="collaborators-enabled"
                  checked={config.collaborators_enabled}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, collaborators_enabled: v === true })
                  }
                />
                <Label htmlFor="collaborators-enabled" className="cursor-pointer">
                  Collaborator mode enabled (vendors may restrict earning to invited users)
                </Label>
              </div>

              <div className="max-w-xs space-y-1">
                <Label htmlFor="commission-rate">
                  Commission rate (% of platform commission)
                </Label>
                <Input
                  id="commission-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={Number((config.commission_rate * 100).toFixed(4))}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      commission_rate: Math.min(1, Math.max(0, parseFloat(e.target.value) / 100 || 0)),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {(config.commission_rate * 100).toFixed(2)}% — e.g. 1% means the reposter earns
                  1% of the platform commission on sales through their repost.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.activeEarningReposts}</div>
              <div className="text-sm text-muted-foreground">Active earning reposts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">⭐ {stats.commissionThisMonth}</div>
              <div className="text-sm text-muted-foreground">Commissions this month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">⭐ {stats.totalCommissionAmount}</div>
              <div className="text-sm text-muted-foreground">
                All-time commissions ({stats.totalCommissionsPaid} payouts)
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.uniqueEarners}</div>
              <div className="text-sm text-muted-foreground">Unique earners</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top earners */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.topEarners.length > 0 ? (
              <div className="space-y-2">
                {stats.topEarners.map((e, i) => (
                  <div key={e.userId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">{i + 1}.</span>
                      <span className="font-medium">@{e.username}</span>
                    </div>
                    <Badge variant="secondary">⭐ {e.total}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No commissions paid yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        @{c.reposter?.username ?? c.reposter_id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.item_type} · order {c.order?.order_number ?? '—'} ·{' '}
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {c.status === 'credited' ? (
                        <Badge variant="secondary">⭐ {c.commission_amount}</Badge>
                      ) : (
                        <Badge variant="outline" title={c.skip_reason ?? ''}>
                          skipped
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No commissions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earning reposts */}
      <Card>
        <CardHeader>
          <CardTitle>Earning Reposts</CardTitle>
        </CardHeader>
        <CardContent>
          {reposts.length > 0 ? (
            <div className="space-y-2">
              {reposts.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      @{r.reposterRaw?.username ?? r.reposter?.username ?? r.reposterId.slice(0, 8)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        reposted a {r.targetType}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.itemName ?? r.targetId}
                      {r.caption ? ` · “${r.caption.slice(0, 60)}”` : ''} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisable(r.id)}
                    title="Disable earning (repost stays live)"
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Disable earning
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No earning reposts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
