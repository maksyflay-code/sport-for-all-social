import { useState, useRef, useMemo } from "react";
import { useAllAdSlots, type AdSlot } from "@/hooks/useAdSlots";
import { useAdMetrics, type AdMetric } from "@/hooks/useAdMetrics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Megaphone, Eye, EyeOff, ExternalLink, Upload, Loader2, X, GripVertical, MousePointerClick, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const blank = (): Omit<AdSlot, "id"> => ({
  position: "sidebar_right",
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  active: true,
  display_order: 0,
});

const SortableAdRow = ({
  ad,
  metric,
  onToggleActive,
  onEdit,
  onRemove,
}: {
  ad: AdSlot;
  metric?: AdMetric;
  onToggleActive: (ad: AdSlot) => void;
  onEdit: (ad: AdSlot) => void;
  onRemove: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ad.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 p-1 -ml-1"
        title="Arraste para reordenar"
        aria-label="Arraste para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {ad.image_url ? (
        <img src={ad.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
          {ad.title}
          {!ad.active && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Inativo</span>}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Ordem {ad.display_order}</span>
          <span className="inline-flex items-center gap-1" title="Impressões">
            <Eye className="w-3 h-3" /> {metric?.impressions ?? 0}
          </span>
          <span className="inline-flex items-center gap-1" title="Cliques">
            <MousePointerClick className="w-3 h-3" /> {metric?.clicks ?? 0}
          </span>
          <span className="inline-flex items-center gap-1" title="Taxa de cliques (CTR)">
            <BarChart3 className="w-3 h-3" /> {metric?.ctr ?? 0}%
          </span>
          {ad.link_url && (
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
              link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleActive(ad)}
        className="rounded-xl shrink-0"
        title={ad.active ? "Desativar" : "Ativar"}
      >
        {ad.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onEdit(ad)} className="rounded-xl">
        Editar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(ad.id)}
        className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

const AdSlotsAdmin = () => {
  const { ads, reload } = useAllAdSlots();
  const [editing, setEditing] = useState<Partial<AdSlot> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = useMemo(() => {
    const left = ads.filter((a) => a.position === "sidebar_left");
    const right = ads.filter((a) => a.position === "sidebar_right");
    return { left, right };
  }, [ads]);

  const startNew = () => setEditing(blank());
  const startEdit = (ad: AdSlot) => setEditing({ ...ad });

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ads").upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("ads").getPublicUrl(filename);
      setEditing((prev) => ({ ...(prev || blank()), image_url: pub.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error("Erro ao enviar imagem: " + (e.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => setEditing((prev) => ({ ...(prev || blank()), image_url: "" }));

  const save = async () => {
    if (!editing?.title) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload = {
      position: editing.position || "sidebar_right",
      title: editing.title,
      description: editing.description || null,
      image_url: editing.image_url || null,
      link_url: editing.link_url || null,
      active: editing.active ?? true,
      display_order: editing.display_order ?? 0,
    };
    const { error } = editing.id
      ? await (supabase.from("ad_slots" as any) as any).update(payload).eq("id", editing.id)
      : await (supabase.from("ad_slots" as any) as any).insert(payload);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success(editing.id ? "Anúncio atualizado" : "Anúncio criado");
    setEditing(null);
    reload();
  };

  const toggleActive = async (ad: AdSlot) => {
    await (supabase.from("ad_slots" as any) as any)
      .update({ active: !ad.active })
      .eq("id", ad.id);
    reload();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remover este anúncio?")) return;
    await (supabase.from("ad_slots" as any) as any).delete().eq("id", id);
    toast.success("Removido");
    reload();
  };

  const persistOrder = async (list: AdSlot[]) => {
    setReordering(true);
    try {
      const updates = list.map((ad, idx) =>
        (supabase.from("ad_slots" as any) as any)
          .update({ display_order: idx })
          .eq("id", ad.id)
      );
      const results = await Promise.all(updates);
      const firstErr = results.find((r: any) => r?.error);
      if (firstErr) {
        toast.error("Erro ao salvar ordem");
      } else {
        toast.success("Ordem atualizada");
      }
    } finally {
      setReordering(false);
      reload();
    }
  };

  const handleDragEnd = (position: "sidebar_left" | "sidebar_right") => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = position === "sidebar_left" ? grouped.left : grouped.right;
    const oldIdx = list.findIndex((a) => a.id === active.id);
    const newIdx = list.findIndex((a) => a.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(list, oldIdx, newIdx);
    persistOrder(reordered);
  };

  const renderList = (position: "sidebar_left" | "sidebar_right", label: string) => {
    const list = position === "sidebar_left" ? grouped.left : grouped.right;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
          {label} <span className="text-muted-foreground/60">({list.length})</span>
        </h4>
        {list.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
            Nenhum anúncio nesta posição
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd(position)}
          >
            <SortableContext items={list.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {list.map((ad) => (
                  <SortableAdRow
                    key={ad.id}
                    ad={ad}
                    onToggleActive={toggleActive}
                    onEdit={startEdit}
                    onRemove={remove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button onClick={startNew} className="rounded-xl gap-2 bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" /> Novo anúncio
        </Button>
        {reordering && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Salvando ordem...
          </span>
        )}
      </div>

      {editing && (
        <div className="bg-card rounded-2xl shadow-card p-5 space-y-3 border-2 border-primary/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            {editing.id ? "Editar anúncio" : "Novo anúncio"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Posição</label>
              <select
                value={editing.position}
                onChange={(e) => setEditing({ ...editing, position: e.target.value as any })}
                className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="sidebar_left">Sidebar esquerda</option>
                <option value="sidebar_right">Sidebar direita</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ordem</label>
              <Input
                type="number"
                value={editing.display_order ?? 0}
                onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })}
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Título *</label>
            <Input
              value={editing.title || ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Ex: Loja Esportiva XYZ"
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
            <Textarea
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Texto curto (até 2 linhas)"
              className="rounded-xl mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Imagem do anúncio</label>
            {editing.image_url ? (
              <div className="mt-1 relative inline-block">
                <img
                  src={editing.image_url}
                  alt="Preview"
                  className="w-full max-w-xs h-32 object-cover rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
                  title="Remover imagem"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-1 w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-semibold">Clique para enviar imagem</span>
                    <span className="text-[10px]">JPG, PNG, WebP até 5MB</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">URL do link</label>
            <Input
              value={editing.link_url || ""}
              onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
              placeholder="https://..."
              className="rounded-xl mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={editing.active ?? true}
              onCheckedChange={(v) => setEditing({ ...editing, active: v })}
            />
            <span className="text-sm text-foreground">Ativo</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="rounded-xl bg-primary text-primary-foreground">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">Cancelar</Button>
          </div>
        </div>
      )}

      {ads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum anúncio cadastrado</p>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground px-1">
            💡 Arraste pelo ícone <GripVertical className="w-3 h-3 inline -mt-0.5" /> para reordenar
          </p>
          {renderList("sidebar_left", "← Sidebar esquerda")}
          {renderList("sidebar_right", "Sidebar direita →")}
        </div>
      )}
    </div>
  );
};

export default AdSlotsAdmin;
