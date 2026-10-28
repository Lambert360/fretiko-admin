'use client';

/**
 * Partner API integrations — staff oversight.
 * Shows every partner using API keys / webhooks with health signals, a kill
 * switch that disables a partner's API access instantly, and a tool to clear a
 * delivery-PIN lockout after staff have verified the situation.
 */

import { useState, useEffect, useCallback } from 'react';
import { logisticsAPI, type PartnerIntegrationRow, type CarrierAdapterHealthRow } from '@/lib/api/logistics';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const carrierStatusBadge = (status: CarrierAdapterHealthRow['status']) => {
  if (status === 'down') return <Badge variant="destructive">Down</Badge>;
  if (status === 'degraded') return <Badge className="bg-amber-100 text-amber-800">Degraded</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800">Up</Badge>;
};

export default function IntegrationsPanel({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PartnerIntegrationRow[]>([]);
  const [carriers, setCarriers] = useState<CarrierAdapterHealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toggleDialog, setToggleDialog] = useState<PartnerIntegrationRow | null>(null);
  const [reason, setReason] = useState('');
  const [orderId, setOrderId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [integrations, health] = await Promise.all([
        logisticsAPI.getIntegrations(),
        logisticsAPI.getCarrierAdapterHealth().catch(() => [] as CarrierAdapterHealthRow[]),
      ]);
      setRows(integrations);
      setCarriers(health);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load integrations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // carrier health refreshes every minute
    return () => clearInterval(t);
  }, [load]);

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.success === false) throw new Error(res.message);
      toast({ title: 'Done', description: res?.message || ok });
      await load();
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Action failed', variant: 'destructive' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleDialog) return;
    const ok = await act(
      () => logisticsAPI.setIntegrationEnabled(toggleDialog.partnerId, !toggleDialog.integrationEnabled, reason || undefined),
      toggleDialog.integrationEnabled ? 'API access disabled.' : 'API access restored.',
    );
    if (ok) { setToggleDialog(null); setReason(''); }
  };

  return (
    <div className="space-y-4">
      {carriers.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
              <p className="text-sm font-medium">External carriers (AAJ, GIGL…)</p>
              <p className="text-xs text-muted-foreground">A carrier marked Down is hidden from buyer checkout until it recovers.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Carrier</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Failures</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Latency</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Last success</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Last error</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(c => (
                  <tr key={c.partner_id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{c.company_name || c.adapter_key}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.adapter_key}</p>
                    </td>
                    <td className="p-3">{carrierStatusBadge(c.status)}</td>
                    <td className="p-3 hidden md:table-cell">
                      {c.consecutive_failures > 0
                        ? <span className="text-red-600">{c.consecutive_failures} {c.last_operation ? `(${c.last_operation})` : ''}</span>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {c.last_latency_ms != null ? `${c.last_latency_ms}ms` : '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {c.last_success_at ? new Date(c.last_success_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs">
                      {c.last_error
                        ? <p className="text-red-600 max-w-[240px] truncate" title={c.last_error}>{c.last_error}</p>
                        : <span className="text-muted-foreground">—</span>}
                      {c.last_failure_at && <p className="text-muted-foreground mt-1">{new Date(c.last_failure_at).toLocaleString()}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No partner has created an API key or webhook endpoint yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Keys</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Webhooks</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Last API use</th>
                  <th className="text-left p-3 font-medium">Health</th>
                  <th className="text-left p-3 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.partnerId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{r.companyName}</p>
                      <p className="text-xs text-muted-foreground">{r.contactEmail}</p>
                      {r.managedGroups.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">API-managed: {r.managedGroups.join(', ')}</p>
                      )}
                    </td>
                    <td className="p-3">{r.activeKeys} <span className="text-xs text-muted-foreground">({r.liveKeys} live)</span></td>
                    <td className="p-3 hidden md:table-cell">{r.webhookEndpoints}</td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {r.lastApiUseAt ? new Date(r.lastApiUseAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3 text-xs">
                      {r.failedEvents7d > 0
                        ? <Badge className="bg-red-100 text-red-800">{r.failedEvents7d} failed events (7d)</Badge>
                        : <Badge className="bg-emerald-100 text-emerald-800">Healthy</Badge>}
                      {r.pendingEvents > 0 && <p className="text-muted-foreground mt-1">{r.pendingEvents} queued</p>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {r.integrationEnabled
                          ? <Badge className="bg-emerald-100 text-emerald-800">Enabled</Badge>
                          : <Badge variant="destructive">Disabled</Badge>}
                        {canManage && (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => { setToggleDialog(r); setReason(''); }}>
                            {r.integrationEnabled ? 'Disable' : 'Enable'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">Unlock a delivery PIN</p>
            <p className="text-xs text-muted-foreground">
              Orders lock after repeated wrong delivery-PIN attempts (30 minutes after 5, until staff unlock after 20).
              Verify the situation with the buyer before clearing a lock.
            </p>
            <div className="flex gap-2 max-w-xl">
              <Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Order ID (UUID)" />
              <Button
                disabled={busy || !orderId.trim()}
                onClick={async () => { if (await act(() => logisticsAPI.unlockDeliveryPin(orderId.trim()), 'Delivery PIN unlocked.')) setOrderId(''); }}
              >
                Unlock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!toggleDialog} onOpenChange={open => { if (!open) setToggleDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleDialog?.integrationEnabled ? 'Disable API access?' : 'Restore API access?'}</DialogTitle>
            <DialogDescription>
              {toggleDialog?.integrationEnabled
                ? `All API keys and webhook delivery for ${toggleDialog?.companyName} stop immediately. The partner is notified.`
                : `${toggleDialog?.companyName}'s API keys and webhooks start working again. The partner is notified.`}
            </DialogDescription>
          </DialogHeader>
          {toggleDialog?.integrationEnabled && (
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (shown to the partner, optional)" />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialog(null)}>Cancel</Button>
            <Button variant={toggleDialog?.integrationEnabled ? 'destructive' : 'default'} disabled={busy} onClick={confirmToggle}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : toggleDialog?.integrationEnabled ? 'Disable' : 'Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
