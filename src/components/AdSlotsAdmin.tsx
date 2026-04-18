import { useState, useRef } from "react";
import { useAllAdSlots, type AdSlot } from "@/hooks/useAdSlots";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Megaphone, Eye, EyeOff, ExternalLink, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const blank = (): Omit<AdSlot, "id"> => ({
  position: "sidebar_right",
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  active: true,
  display_order: 0,
});

const AdSlotsAdmin = () => {
  const { ads, reload } = useAllAdSlots();
  const [editing, setEditing] = useState<Partial<AdSlot> | null>(null);
  const [saving, setSaving] = useState(false);

  const startNew = () => setEditing(blank());
  const startEdit = (ad: AdSlot) => setEditing({ ...ad });

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

  return (
    <div className="space-y-4">
      <Button onClick={startNew} className="rounded-xl gap-2 bg-primary text-primary-foreground">
        <Plus className="w-4 h-4" /> Novo anúncio
      </Button>

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
            <label className="text-xs font-semibold text-muted-foreground">URL da imagem</label>
            <Input
              value={editing.image_url || ""}
              onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
              placeholder="https://..."
              className="rounded-xl mt-1"
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

      <div className="space-y-2">
        {ads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum anúncio cadastrado</p>
        )}
        {ads.map((ad) => (
          <div key={ad.id} className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
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
              <p className="text-xs text-muted-foreground">
                {ad.position === "sidebar_left" ? "← Esquerda" : "Direita →"} • Ordem {ad.display_order}
                {ad.link_url && (
                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-primary hover:underline">
                    link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleActive(ad)}
              className="rounded-xl shrink-0"
              title={ad.active ? "Desativar" : "Ativar"}
            >
              {ad.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => startEdit(ad)} className="rounded-xl">
              Editar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(ad.id)}
              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdSlotsAdmin;
