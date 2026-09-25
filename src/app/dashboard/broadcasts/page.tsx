'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  broadcastsAPI,
  type BroadcastTemplate,
  type BroadcastSend,
  type BroadcastAudience,
} from '@/lib/api/broadcasts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Send, Plus, Trash2, Edit, Clock, Users, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EMPTY_DRAFT = { subject: '', title: '', body: '', cta_label: '', cta_url: '' };

function findVariables(tpl?: { subject: string; title: string; body: string } | null): string[] {
  if (!tpl) return [];
  const text = `${tpl.subject} ${tpl.title} ${tpl.body}`;
  const found = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*(custom\d+)\s*\}\}/gi)) {
    found.add(m[1].toLowerCase());
  }
  return [...found];
}

export default function BroadcastsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const canSend = isSuperAdmin || hasPermission('send_broadcasts');

  const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'history'>('templates');
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [sends, setSends] = useState<BroadcastSend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compose state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [audience, setAudience] = useState<BroadcastAudience>('vendors');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [testUserId, setTestUserId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Template editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<BroadcastTemplate> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BroadcastTemplate | null>(null);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
  const templateVars = findVariables(selectedTemplate ?? draft);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplates(await broadcastsAPI.getTemplates());
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load templates', variant: 'destructive' });
    }
  }, [toast]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await broadcastsAPI.getHistory();
      setSends(res.sends);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load history', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    if (!canSend) return;
    setIsLoading(true);
    Promise.all([fetchTemplates(), fetchHistory()]).finally(() => setIsLoading(false));
  }, [canSend, fetchTemplates, fetchHistory]);

  // Refresh history while any send is running
  useEffect(() => {
    if (!sends.some(s => s.status === 'running')) return;
    const t = setInterval(fetchHistory, 5000);
    return () => clearInterval(t);
  }, [sends, fetchHistory]);

  // Live audience count
  useEffect(() => {
    if (activeTab !== 'send') return;
    broadcastsAPI.getAudienceCount(audience)
      .then(r => setAudienceCount(r.count))
      .catch(() => setAudienceCount(null));
  }, [audience, activeTab]);

  // When a template is picked, prefill its channel flags and reset variables
  useEffect(() => {
    if (selectedTemplate) {
      setSendPush(selectedTemplate.send_push);
      setSendEmail(selectedTemplate.send_email);
      setAudience(selectedTemplate.audience);
      setVariables({});
    }
  }, [selectedTemplateId]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const payload: any = {
        audience,
        sendPush,
        sendEmail,
        variables,
      };
      if (selectedTemplate) payload.templateId = selectedTemplate.id;
      else payload.draft = draft;

      const res: any = await broadcastsAPI.sendBroadcast(payload);
      if (res?.error) throw new Error(res.error);
      toast({ title: 'Broadcast started', description: `Sending to ${audience === 'vendors' ? 'vendors' : 'all users'}…` });
      setConfirmOpen(false);
      fetchHistory();
      setActiveTab('history');
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestSend = async () => {
    if (!testUserId.trim()) {
      toast({ title: 'Test user required', description: 'Enter a user ID to send the test to.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const payload: any = { userId: testUserId.trim(), sendPush, sendEmail, variables };
      if (selectedTemplate) payload.templateId = selectedTemplate.id;
      else payload.draft = draft;
      await broadcastsAPI.testBroadcast(payload);
      toast({ title: 'Test sent', description: `Delivered to ${testUserId}` });
    } catch (err: any) {
      toast({ title: 'Test failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate.subject || !editingTemplate.title || !editingTemplate.body) {
      toast({ title: 'Missing fields', description: 'Name, subject, title and body are required.', variant: 'destructive' });
      return;
    }
    try {
      const { id, created_at, updated_at, template, ...fields } = editingTemplate as any;
      if (id) await broadcastsAPI.updateTemplate(id, fields);
      else await broadcastsAPI.createTemplate(fields);
      toast({ title: id ? 'Template updated' : 'Template created' });
      setEditorOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    }
  };

  const toggleTemplateActive = async (tpl: BroadcastTemplate) => {
    try {
      await broadcastsAPI.updateTemplate(tpl.id, { is_active: !tpl.is_active });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await broadcastsAPI.deleteTemplate(deleteTarget.id);
      toast({ title: 'Template deleted' });
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  if (!canSend) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p>You need the <code>send_broadcasts</code> permission to manage broadcasts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cadenceLabel = (days: number | null) =>
    days == null ? 'Manual' : days === 1 ? 'Daily' : `Every ${days} days`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" /> Broadcasts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Promotional email + push + in-app messages to vendors. Recipients can opt out via notification settings.
          </p>
        </div>
        <Button onClick={() => { setEditingTemplate({ audience: 'vendors', send_push: true, send_email: true, is_active: true }); setEditorOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['templates', 'send', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'templates' ? 'Templates' : tab === 'send' ? 'Send Broadcast' : 'History'}
          </button>
        ))}
      </div>

      {/* ============ TEMPLATES ============ */}
      {activeTab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && templates.length === 0 && (
            <p className="text-muted-foreground">No templates yet. Create one or run migration 231 to seed the defaults.</p>
          )}
          {templates.map(tpl => (
            <Card key={tpl.id} className={!tpl.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{tpl.subject}</CardDescription>
                  </div>
                  <Badge variant={tpl.is_active ? 'default' : 'secondary'}>
                    {tpl.is_active ? 'Active' : 'Off'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{tpl.body}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{tpl.audience}</Badge>
                  <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{cadenceLabel(tpl.auto_cadence_days)}</Badge>
                  {tpl.send_push && <Badge variant="outline">Push</Badge>}
                  {tpl.send_email && <Badge variant="outline">Email</Badge>}
                  {tpl.skip_if_listed_within_days != null && (
                    <Badge variant="outline">Skips active listers ({tpl.skip_if_listed_within_days}d)</Badge>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(tpl); setEditorOpen(true); }}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleTemplateActive(tpl)}>
                    {tpl.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedTemplateId(tpl.id); setActiveTab('send'); }}>
                    <Send className="h-3 w-3 mr-1" /> Send
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => setDeleteTarget(tpl)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============ SEND ============ */}
      {activeTab === 'send' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compose</CardTitle>
              <CardDescription>Pick a template or write a custom message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger><SelectValue placeholder="Custom message" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom message</SelectItem>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {!selectedTemplate && (
                <>
                  <div><Label>Email subject</Label><Input value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} placeholder="Hi {{name}} — …" /></div>
                  <div><Label>Push / in-app title</Label><Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
                  <div><Label>Body</Label><Textarea rows={4} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} placeholder="Supports {{name}}, {{custom1}}, {{custom2}}" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>CTA label</Label><Input value={draft.cta_label} onChange={e => setDraft({ ...draft, cta_label: e.target.value })} placeholder="Optional" /></div>
                    <div><Label>CTA URL</Label><Input value={draft.cta_url} onChange={e => setDraft({ ...draft, cta_url: e.target.value })} placeholder="Optional" /></div>
                  </div>
                </>
              )}

              {templateVars.map(v => (
                <div key={v}>
                  <Label>Value for <code>{`{{${v}}}`}</code></Label>
                  <Input value={variables[v] || ''} onChange={e => setVariables({ ...variables, [v]: e.target.value })} placeholder={v === 'custom1' ? 'e.g. a blue jacket' : ''} />
                </div>
              ))}

              <div>
                <Label>Audience</Label>
                <Select value={audience} onValueChange={v => setAudience(v as BroadcastAudience)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendors">All vendors ({audienceCount ?? '…'})</SelectItem>
                    <SelectItem value="all_users">All users ({audienceCount ?? '…'})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sendPush} onCheckedChange={v => setSendPush(!!v)} /> Push + in-app
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sendEmail} onCheckedChange={v => setSendEmail(!!v)} /> Email
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => setConfirmOpen(true)} disabled={isSending || (!selectedTemplate && (!draft.subject || !draft.title || !draft.body))}>
                  <Send className="h-4 w-4 mr-2" /> Send Broadcast
                </Button>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label>Test send (user ID)</Label>
                <div className="flex gap-2">
                  <Input value={testUserId} onChange={e => setTestUserId(e.target.value)} placeholder="Paste a user UUID" />
                  <Button variant="outline" onClick={handleTestSend} disabled={isSending}>Send Test</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</CardTitle>
              <CardDescription>{'Rendered with {{name}} = "Oliver"'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const src = selectedTemplate ?? draft;
                const render = (s: string) =>
                  s.replace(/\{\{\s*name\s*\}\}/gi, 'Oliver')
                   .replace(/\{\{\s*custom(\d+)\s*\}\}/gi, (_, n) => variables[`custom${n}`] || `{{custom${n}}}`);
                return (
                  <>
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-xs text-muted-foreground">Push / in-app</p>
                      <p className="font-semibold text-sm">{render(src.title || '(no title)')}</p>
                      <p className="text-sm text-muted-foreground">{render(src.body || '(no body)')}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-sm">{render(src.subject || '(no subject)')}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{render(src.body || '(no body)')}</p>
                      {src.cta_label && <Badge>{render(src.cta_label)}</Badge>}
                    </div>
                  </>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                Guardrails: max 1 broadcast per user per 48h · respects push/email opt-outs and quiet hours · templates can skip recently-active listers.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============ HISTORY ============ */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send History</CardTitle>
            <CardDescription>Running sends refresh automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {sends.length === 0 ? (
              <p className="text-muted-foreground text-sm">No broadcasts sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Message</th>
                      <th className="py-2 pr-4">Audience</th>
                      <th className="py-2 pr-4">Trigger</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Sent / Targeted</th>
                      <th className="py-2 pr-4 text-right">Suppressed</th>
                      <th className="py-2 text-right">Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sends.map(s => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-4">
                          <div className="font-medium">{s.template?.name || s.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{s.subject}</div>
                        </td>
                        <td className="py-2 pr-4">{s.audience}</td>
                        <td className="py-2 pr-4 capitalize">{s.trigger}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={s.status === 'completed' ? 'default' : s.status === 'failed' ? 'destructive' : 'secondary'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-right">{s.sent} / {s.targeted}</td>
                        <td className="py-2 pr-4 text-right">{s.suppressed}</td>
                        <td className="py-2 text-right">{s.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ TEMPLATE EDITOR DIALOG ============ */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => setEditorOpen(false)} />
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>Body supports {'{{name}}'}, {'{{custom1}}'}, {'{{custom2}}'} placeholders.</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editingTemplate.name || ''} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} /></div>
              <div><Label>Email subject</Label><Input value={editingTemplate.subject || ''} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} /></div>
              <div><Label>Push / in-app title</Label><Input value={editingTemplate.title || ''} onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })} /></div>
              <div><Label>Body</Label><Textarea rows={4} value={editingTemplate.body || ''} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>CTA label</Label><Input value={editingTemplate.cta_label || ''} onChange={e => setEditingTemplate({ ...editingTemplate, cta_label: e.target.value })} /></div>
                <div><Label>CTA URL</Label><Input value={editingTemplate.cta_url || ''} onChange={e => setEditingTemplate({ ...editingTemplate, cta_url: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Audience</Label>
                  <Select value={editingTemplate.audience || 'vendors'} onValueChange={v => setEditingTemplate({ ...editingTemplate, audience: v as BroadcastAudience })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendors">Vendors</SelectItem>
                      <SelectItem value="all_users">All users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Auto-send cadence</Label>
                  <Select
                    value={editingTemplate.auto_cadence_days == null ? 'manual' : String(editingTemplate.auto_cadence_days)}
                    onValueChange={v => setEditingTemplate({ ...editingTemplate, auto_cadence_days: v === 'manual' ? null : parseInt(v, 10) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual only</SelectItem>
                      <SelectItem value="3">Every 3 days</SelectItem>
                      <SelectItem value="7">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Skip vendors who listed within (days)</Label>
                <Input
                  type="number"
                  value={editingTemplate.skip_if_listed_within_days ?? ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, skip_if_listed_within_days: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                  placeholder="No suppression"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={editingTemplate.send_push ?? true} onCheckedChange={v => setEditingTemplate({ ...editingTemplate, send_push: !!v })} /> Push + in-app
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={editingTemplate.send_email ?? true} onCheckedChange={v => setEditingTemplate({ ...editingTemplate, send_email: !!v })} /> Email
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ CONFIRM SEND ============ */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogClose onClose={() => setConfirmOpen(false)} />
          <DialogHeader>
            <DialogTitle>Send broadcast?</DialogTitle>
            <DialogDescription>
              This will notify approximately {audienceCount ?? '…'} {audience === 'vendors' ? 'vendors' : 'users'} via
              {[sendPush && ' push + in-app', sendEmail && ' email'].filter(Boolean).join(' and ')}.
              Users who opted out of promotions are skipped automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={isSending}>{isSending ? 'Sending…' : 'Confirm Send'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE CONFIRM ============ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogClose onClose={() => setDeleteTarget(null)} />
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>"{deleteTarget?.name}" will be removed. Past send history is kept.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
