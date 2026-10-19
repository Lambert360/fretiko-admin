'use client';

/**
 * Partner Companies moderation tab — Logistics page
 * List verified partners, warn, ban territories, suspend/reactivate/terminate,
 * broadcast announcements, and view each partner's moderation history.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logisticsAPI, type PartnerRow, type ModerationEvent } from '@/lib/api/logistics';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Loader2, Megaphone, AlertTriangle, Ban, History, ShieldOff, MapPin } from 'lucide-react';

const statusBadge = (status: PartnerRow['partner_status']) => {
  if (status === 'active') return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
  if (status === 'suspended') return <Badge variant="secondary">Suspended</Badge>;
  return <Badge variant="destructive">Terminated</Badge>;
};

const actionLabel: Record<ModerationEvent['action'], string> = {
  warn: 'Warning', suspend: 'Suspended', reactivate: 'Reactivated',
  terminate: 'Terminated', ban_area: 'Territory banned', unban_area: 'Territory unbanned',
  broadcast: 'Broadcast', area_request: 'Expansion requested',
  area_approved: 'Expansion approved', area_rejected: 'Expansion rejected',
};

export default function PartnersTab({ onPendingCount }: { onPendingCount?: (n: number) => void }) {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const canView = isSuperAdmin || hasPermission('view_verified_partners');
  const canManage = isSuperAdmin || hasPermission('manage_verified_partners');

  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'terminated'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const [warnDialog, setWarnDialog] = useState<PartnerRow | null>(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [statusDialog, setStatusDialog] = useState<{ partner: PartnerRow; status: 'suspended' | 'terminated' | 'active' } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [areasDialog, setAreasDialog] = useState<PartnerRow | null>(null);
  const [expansionDialog, setExpansionDialog] = useState<PartnerRow | null>(null);
  const [expansionReason, setExpansionReason] = useState('');
  const [historyDialog, setHistoryDialog] = useState<{ partner: PartnerRow; events: ModerationEvent[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [broadcastDialog, setBroadcastDialog] = useState<{ partner?: PartnerRow } | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logisticsAPI.getPartners({ status: statusFilter, search, page, limit });
      setPartners(res.partners || []);
      setTotal(res.total || 0);
      onPendingCount?.((res.partners || []).filter(p => (p.pending_service_areas || []).length > 0).length);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load partners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, toast, onPendingCount]);

  useEffect(() => { if (canView) loadPartners(); }, [canView, loadPartners]);

  const run = async (fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await fn();
      toast({ title: 'Done', description: res?.message || successMsg });
      await loadPartners();
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Action failed', variant: 'destructive' });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const openHistory = async (partner: PartnerRow) => {
    setHistoryDialog({ partner, events: [] });
    setHistoryLoading(true);
    try {
      const events = await logisticsAPI.getPartnerModerationHistory(partner.id);
      setHistoryDialog({ partner, events });
    } catch {
      setHistoryDialog({ partner, events: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleAreaBan = async (partner: PartnerRow, area: string, banned: boolean) => {
    await run(
      () => logisticsAPI.setPartnerBannedAreas(partner.id, banned ? { remove: [area] } : { add: [area] }),
      banned ? 'Territory ban lifted.' : 'Territory banned.'
    );
    // Refresh the dialog's partner row
    const res = await logisticsAPI.getPartners({ status: 'all', search: partner.company_name, limit: 1 });
    const updated = res.partners.find(p => p.id === partner.id);
    if (updated) setAreasDialog(updated);
  };

  const decideArea = async (partner: PartnerRow, area: string, approve: boolean) => {
    await run(
      () => logisticsAPI.reviewAreaExpansion(partner.id, approve
        ? { approve: [area], reason: expansionReason || undefined }
        : { reject: [area], reason: expansionReason || undefined }),
      approve ? 'Area approved.' : 'Area rejected.'
    );
    const res = await logisticsAPI.getPartners({ status: 'all', search: partner.company_name, limit: 1 });
    const updated = res.partners.find(p => p.id === partner.id);
    if (updated) {
      if ((updated.pending_service_areas || []).length === 0) setExpansionDialog(null);
      else setExpansionDialog(updated);
    }
  };

  const decideAllAreas = async (partner: PartnerRow, approve: boolean) => {
    const areas = partner.pending_service_areas || [];
    if (!areas.length) return;
    const ok = await run(
      () => logisticsAPI.reviewAreaExpansion(partner.id, approve
        ? { approve: areas, reason: expansionReason || undefined }
        : { reject: areas, reason: expansionReason || undefined }),
      approve ? 'All areas approved.' : 'All areas rejected.'
    );
    if (ok) setExpansionDialog(null);
  };

  if (!canView) {
    return <p className="text-sm text-muted-foreground py-8 text-center">You do not have permission to view partner companies.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search companies..." className="pl-9" />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setBroadcastDialog({})}>
              <Megaphone className="w-4 h-4 mr-1" /> Broadcast to all
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : partners.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No partner companies found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Territories</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.company_logo_url ? (
                          <img src={p.company_logo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs">
                            {(p.company_name || '?').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{p.company_name}</p>
                          <p className="text-xs text-muted-foreground">{p.contact_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{statusBadge(p.partner_status)}</td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.service_areas || []).slice(0, 4).map(a => (
                          <Badge key={a} variant={(p.banned_service_areas || []).includes(a) ? 'destructive' : 'outline'} className="text-[10px]">
                            {a}
                          </Badge>
                        ))}
                        {(p.service_areas?.length || 0) > 4 && (
                          <span className="text-xs text-muted-foreground">+{(p.service_areas?.length || 0) - 4}</span>
                        )}
                        {(p.pending_service_areas || []).map(a => (
                          <Badge key={`pending-${a}`} className="text-[10px] bg-amber-100 text-amber-800">{a} ⏳</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {p.verified_at ? new Date(p.verified_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openHistory(p)}>
                            <History className="w-4 h-4 mr-2" /> Moderation history
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => { setWarnDialog(p); setWarnMessage(''); }}>
                                <AlertTriangle className="w-4 h-4 mr-2" /> Warn
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAreasDialog(p)}>
                                <Ban className="w-4 h-4 mr-2" /> Territory bans
                              </DropdownMenuItem>
                              {(p.pending_service_areas || []).length > 0 && (
                                <DropdownMenuItem onClick={() => { setExpansionDialog(p); setExpansionReason(''); }}>
                                  <MapPin className="w-4 h-4 mr-2" /> Review expansion ({p.pending_service_areas!.length})
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setBroadcastDialog({ partner: p })}>
                                <Megaphone className="w-4 h-4 mr-2" /> Message this partner
                              </DropdownMenuItem>
                              {p.partner_status !== 'active' && (
                                <DropdownMenuItem onClick={() => { setStatusDialog({ partner: p, status: 'active' }); setStatusReason(''); }}>
                                  <ShieldOff className="w-4 h-4 mr-2" /> Reactivate
                                </DropdownMenuItem>
                              )}
                              {p.partner_status !== 'suspended' && (
                                <DropdownMenuItem onClick={() => { setStatusDialog({ partner: p, status: 'suspended' }); setStatusReason(''); }}>
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {p.partner_status !== 'terminated' && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => { setStatusDialog({ partner: p, status: 'terminated' }); setStatusReason(''); }}
                                >
                                  Terminate
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{total} companies</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Warn dialog */}
      <Dialog open={!!warnDialog} onOpenChange={() => setWarnDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn {warnDialog?.company_name}</DialogTitle>
            <DialogDescription>The warning is delivered as an in-app notification and an email, and is logged to their moderation history.</DialogDescription>
          </DialogHeader>
          <textarea
            value={warnMessage}
            onChange={e => setWarnMessage(e.target.value)}
            placeholder="Warning message shown to the partner..."
            className="w-full border rounded-md p-3 text-sm min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnDialog(null)}>Cancel</Button>
            <Button
              disabled={!warnMessage.trim() || actionLoading}
              onClick={async () => {
                const ok = await run(() => logisticsAPI.warnPartner(warnDialog!.id, warnMessage), 'Warning issued.');
                if (ok) setWarnDialog(null);
              }}
            >
              Issue warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog?.status === 'terminated' ? 'Terminate' : statusDialog?.status === 'suspended' ? 'Suspend' : 'Reactivate'} {statusDialog?.partner.company_name}
            </DialogTitle>
            <DialogDescription>
              {statusDialog?.status === 'terminated'
                ? 'The partner is removed from all listings and can no longer log in. Their buyers/vendors get an explanation in active chats. This cannot be undone lightly — it can be reversed by reactivating.'
                : statusDialog?.status === 'suspended'
                ? 'The partner disappears from delivery options and cannot accept new orders, but must finish in-flight deliveries.'
                : 'Restores full access — the partner can log in and receive orders again.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={statusReason}
            onChange={e => setStatusReason(e.target.value)}
            placeholder="Reason (optional, shared with the partner)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button
              variant={statusDialog?.status === 'terminated' ? 'destructive' : 'default'}
              disabled={actionLoading}
              onClick={async () => {
                const ok = await run(
                  () => logisticsAPI.updatePartnerStatus(statusDialog!.partner.id, statusDialog!.status, statusReason || undefined),
                  'Status updated.'
                );
                if (ok) setStatusDialog(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Territory bans dialog */}
      <Dialog open={!!areasDialog} onOpenChange={() => setAreasDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Territory bans — {areasDialog?.company_name}</DialogTitle>
            <DialogDescription>
              Click a territory to ban or unban it. Banned areas stop matching at checkout — the partner simply won't appear for deliveries touching them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
            {(areasDialog?.service_areas || []).length === 0 && (
              <p className="text-sm text-muted-foreground">This partner has no service areas configured.</p>
            )}
            {(areasDialog?.service_areas || []).map(area => {
              const banned = (areasDialog?.banned_service_areas || []).includes(area);
              return (
                <button
                  key={area}
                  disabled={actionLoading}
                  onClick={() => toggleAreaBan(areasDialog!, area, banned)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    banned
                      ? 'bg-red-100 border-red-300 text-red-700 line-through'
                      : 'bg-muted hover:bg-muted/70 border-transparent'
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setAreasDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expansion review dialog */}
      <Dialog open={!!expansionDialog} onOpenChange={() => setExpansionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expansion request — {expansionDialog?.company_name}</DialogTitle>
            <DialogDescription>
              Approved areas take effect immediately (territory bans still apply). Rejected areas are removed from the request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(expansionDialog?.pending_service_areas || []).map(area => (
              <div key={area} className="flex items-center justify-between border rounded-md px-3 py-2">
                <span className="text-sm font-medium">{area}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={actionLoading}
                    onClick={() => decideArea(expansionDialog!, area, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={actionLoading}
                    onClick={() => decideArea(expansionDialog!, area, false)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Input
            value={expansionReason}
            onChange={e => setExpansionReason(e.target.value)}
            placeholder="Reason / note (optional, shared with the partner)"
          />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" disabled={actionLoading}
              onClick={() => decideAllAreas(expansionDialog!, true)}>
              Approve all
            </Button>
            <Button variant="destructive" disabled={actionLoading}
              onClick={() => decideAllAreas(expansionDialog!, false)}>
              Reject all
            </Button>
            <Button onClick={() => setExpansionDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast dialog */}
      <Dialog open={!!broadcastDialog} onOpenChange={() => setBroadcastDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {broadcastDialog?.partner ? `Message ${broadcastDialog.partner.company_name}` : 'Broadcast to all partners'}
            </DialogTitle>
            <DialogDescription>
              Delivered as an in-app notification in the partner dashboard bell and Notices tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={broadcastForm.title}
              onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title (e.g. 'New milestone reached!')"
            />
            <textarea
              value={broadcastForm.message}
              onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Message..."
              className="w-full border rounded-md p-3 text-sm min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialog(null)}>Cancel</Button>
            <Button
              disabled={!broadcastForm.title.trim() || !broadcastForm.message.trim() || actionLoading}
              onClick={async () => {
                const ok = await run(
                  () => logisticsAPI.broadcastToPartners({
                    title: broadcastForm.title,
                    message: broadcastForm.message,
                    partnerIds: broadcastDialog?.partner ? [broadcastDialog.partner.id] : undefined,
                  }),
                  'Broadcast sent.'
                );
                if (ok) { setBroadcastDialog(null); setBroadcastForm({ title: '', message: '' }); }
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyDialog} onOpenChange={() => setHistoryDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Moderation history — {historyDialog?.partner.company_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {historyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : historyDialog?.events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No moderation events yet.</p>
            ) : (
              historyDialog?.events.map(ev => (
                <div key={ev.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{actionLabel[ev.action] || ev.action}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  {ev.reason && <p className="mt-1.5 text-muted-foreground">{ev.reason}</p>}
                  {ev.areas?.length > 0 && <p className="mt-1 text-xs">{ev.areas.join(', ')}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
