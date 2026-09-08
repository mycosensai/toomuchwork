'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DensityBadge } from '@/components/ui/badge';
import { CommunityReport, DensityLevel } from '@/types';
import { MessageSquare, ThumbsUp, Clock, User, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const densityOptions: DensityLevel[] = ['green', 'yellow', 'orange', 'red', 'purple'];

export function Community() {
  const { activeView, communityReports, addCommunityReport, businesses, addCorrection, cameras } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [reportDensity, setReportDensity] = useState<DensityLevel>('green');
  const [reportComment, setReportComment] = useState('');
  const [selectedBiz, setSelectedBiz] = useState('');

  if (activeView !== 'community') return null;

  const submitReport = () => {
    if (!selectedBiz || !reportComment.trim()) return;
    const biz = businesses.find((b) => b.id === selectedBiz);
    const report: CommunityReport = {
      id: `report-${Date.now()}`,
      locationId: selectedBiz,
      locationName: biz?.name || 'Unknown',
      density: reportDensity,
      comment: reportComment.trim(),
      timestamp: new Date().toISOString(),
      authorId: 'user-you',
      helpful: 0,
    };
    addCommunityReport(report);
    setShowForm(false);
    setReportComment('');
    setReportDensity('green');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            <MessageSquare className="h-6 w-6" /> Community
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Quiet reports from people like you. Help each other find calm windows.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Report quietness'}</Button>
      </div>

      {/* Report form */}
      {showForm && (
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-zinc-500">Location</p>
              <select
                value={selectedBiz}
                onChange={(e) => setSelectedBiz(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Select a location...</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-zinc-500">How busy is it?</p>
              <div className="flex gap-2">
                {densityOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setReportDensity(d)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors ${
                      reportDensity === d ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''
                    }`}
                  >
                    <DensityBadge level={d} size="sm" />
                  </button>
                ))}
              </div>
            </div>
            <Input placeholder="How was it? (e.g., 'Very quiet, only 2 cars in the lot')" value={reportComment} onChange={(e) => setReportComment(e.target.value)} />
            <Button className="mt-3 w-full" onClick={submitReport} disabled={!selectedBiz || !reportComment.trim()}>
              Submit report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Correction form: fix a wrong/stale signal */}
      <CorrectionForm
        cameras={cameras}
        businesses={businesses}
        onSubmit={(c) => addCorrection(c)}
      />

      {/* Reports feed */}
      <div className="space-y-3">
        {communityReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-zinc-400">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
              <p>No reports yet</p>
              <p className="text-xs">Be the first to share how quiet it is near you!</p>
            </CardContent>
          </Card>
        ) : (
          communityReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DensityBadge level={report.density} size="sm" />
                    <span className="text-sm font-medium">{report.locationName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />You</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{report.comment}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

type CorrectionType = 'camera_down' | 'camera_back' | 'traffic_clear' | 'traffic_jam' | 'crowd_wrong';

function CorrectionForm({ cameras, businesses, onSubmit }: {
  cameras: { id: string; name: string }[];
  businesses: { id: string; name: string }[];
  onSubmit: (c: import('@/types').CorrectionReport) => void;
}) {
  const [type, setType] = useState<CorrectionType>('camera_down');
  const [targetId, setTargetId] = useState('');
  const [note, setNote] = useState('');

  const targetType = type.startsWith('camera') ? 'camera' : 'location';
  const options = targetType === 'camera' ? cameras : businesses;

  const submit = () => {
    if (!targetId) return;
    onSubmit({
      id: `corr-${Date.now()}`,
      kind: 'correction',
      correctionType: type,
      targetId,
      targetType,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
      authorId: 'user-you',
    });
    setNote('');
  };

  return (
    <Card className="mb-6 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">Report a correction (fixes a wrong or stale signal)</p>
        <select value={type} onChange={(e) => { setType(e.target.value as CorrectionType); setTargetId(''); }}
          className="mb-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option value="camera_down">Camera is down / not there</option>
          <option value="camera_back">Camera is back online</option>
          <option value="traffic_clear">Traffic is actually clear</option>
          <option value="traffic_jam">Unexpected jam</option>
          <option value="crowd_wrong">Busyness is wrong</option>
        </select>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
          className="mb-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option value="">Select target…</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <Input placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button className="mt-3 w-full" onClick={submit} disabled={!targetId}>Submit correction</Button>
      </CardContent>
    </Card>
  );
}
