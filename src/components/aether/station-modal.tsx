'use client';

import { useState } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { Station } from '@/types/station';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Check } from 'lucide-react';
import { parsePlaylistFile } from '@/lib/audio-utils';

function StationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Station | null;
  onSave: (station: Station) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [rdsUrl, setRdsUrl] = useState(initial?.rdsUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSave({
      id: initial?.id || crypto.randomUUID(),
      name: name.trim(),
      url: url.trim(),
      rdsUrl: rdsUrl.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs text-aether-muted font-medium">Station Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Radio Station"
          className="bg-white/5 border-aether-border text-aether-text placeholder:text-aether-muted/60 focus-visible:border-aether-indigo/50 focus-visible:ring-aether-indigo/30"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-aether-muted font-medium">Stream URL *</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://stream.example.com/live"
          className="bg-white/5 border-aether-border text-aether-text placeholder:text-aether-muted/60 focus-visible:border-aether-indigo/50 focus-visible:ring-aether-indigo/30"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-aether-muted font-medium">
          RDS URL <span className="text-aether-muted/50">(optional)</span>
        </label>
        <Input
          value={rdsUrl}
          onChange={(e) => setRdsUrl(e.target.value)}
          placeholder="https://now-playing.example.com/api"
          className="bg-white/5 border-aether-border text-aether-text placeholder:text-aether-muted/60 focus-visible:border-aether-indigo/50 focus-visible:ring-aether-indigo/30"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1 bg-white/5 text-aether-muted hover:text-aether-text hover:bg-white/10"
        >
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || !url.trim()}
          className="flex-1 bg-aether-indigo hover:bg-aether-indigo/90 text-white"
        >
          <Check className="w-4 h-4 mr-2" /> {initial ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

export function StationModal() {
  const {
    showStationModal,
    setShowStationModal,
    editingStation,
    setEditingStation,
    addStation,
    editStation,
    deleteStation,
    importStations,
  } = useAetherStore();

  const [mode, setMode] = useState<'form' | 'import'>('form');

  const handleSave = (station: Station) => {
    if (editingStation) {
      editStation(station);
    } else {
      addStation(station);
    }
    setShowStationModal(false);
    setEditingStation(null);
  };

  const handleCancel = () => {
    setShowStationModal(false);
    setEditingStation(null);
    setMode('form');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parsePlaylistFile(content, file.name);
      if (parsed.length > 0) {
        const newStations: Station[] = parsed.map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          url: s.url,
        }));
        importStations(newStations);
        setShowStationModal(false);
      } else {
        useAetherStore.getState().addToast('No valid stations found in file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    if (editingStation) {
      deleteStation(editingStation.id);
      setShowStationModal(false);
      setEditingStation(null);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4">
      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('form')}
          className={`flex-1 h-11 rounded-lg text-sm font-medium transition-all ${
            mode === 'form'
              ? 'bg-aether-indigo text-white'
              : 'bg-white/5 text-aether-muted hover:bg-white/10'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {editingStation ? 'Edit' : 'Manual'}
        </button>
        <button
          onClick={() => setMode('import')}
          className={`flex-1 h-11 rounded-lg text-sm font-medium transition-all ${
            mode === 'import'
              ? 'bg-aether-indigo text-white'
              : 'bg-white/5 text-aether-muted hover:bg-white/10'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Import
        </button>
      </div>

      {mode === 'form' ? (
        <>
          <StationForm
            initial={editingStation}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          {editingStation && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full mt-2 bg-aether-red/10 text-aether-red hover:bg-aether-red/20 border-0"
            >
              Delete Station
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <Upload className="w-10 h-10 text-aether-muted" />
          <p className="text-sm text-aether-muted text-center">
            Upload a .m3u, .m3u8, or .pls playlist file
          </p>
          <label className="w-full">
            <input
              type="file"
              accept=".m3u,.m3u8,.pls"
              onChange={handleImport}
              className="hidden"
            />
            <div className="w-full h-11 rounded-lg border border-dashed border-aether-border flex items-center justify-center text-sm text-aether-muted hover:border-aether-indigo/50 hover:text-aether-indigo transition-colors cursor-pointer">
              Choose File
            </div>
          </label>
        </div>
      )}
    </div>
  );

  // Mobile: Drawer (bottom sheet)
  // Desktop: Dialog (centered)
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer open={showStationModal} onOpenChange={setShowStationModal}>
        <DrawerContent className="bg-[#0a0a0f] border-t border-aether-border">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-aether-text">
              {editingStation ? 'Edit Station' : 'Add Station'}
            </DrawerTitle>
            <DrawerDescription className="text-aether-muted">
              {mode === 'import' ? 'Import from playlist file' : editingStation ? 'Modify station details' : 'Enter station details'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 sm:hidden">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop Dialog */}
      <Dialog open={showStationModal} onOpenChange={setShowStationModal}>
        <DialogContent className="bg-[#0a0a0f] border border-aether-border max-w-md hidden sm:block">
          <DialogHeader>
            <DialogTitle className="text-aether-text">
              {editingStation ? 'Edit Station' : 'Add Station'}
            </DialogTitle>
            <DialogDescription className="text-aether-muted">
              {mode === 'import' ? 'Import from playlist file' : editingStation ? 'Modify station details' : 'Enter station details'}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            {formContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
