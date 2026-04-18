import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  onCreated?: () => void;
}

const StoryUploader = ({ onCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 25 MB)"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setOpen(true);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async () => {
    if (!user || !file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("stories").upload(path, file, { upsert: false });
    if (upErr) { toast.error("Erro ao enviar mídia"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(path);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const { error } = await (supabase.from("stories" as any) as any).insert({
      user_id: user.id,
      media_url: publicUrl,
      media_type: mediaType,
      caption: caption.trim() || null,
    });
    if (error) { toast.error("Erro ao publicar story"); setUploading(false); return; }
    toast.success("Story publicado! Expira em 24h ⏱️");
    setUploading(false);
    setOpen(false);
    reset();
    onCreated?.();
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="flex flex-col items-center gap-1.5 shrink-0 group"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-orange-400 group-hover:bg-orange-500/10 transition-colors">
          <Plus className="w-6 h-6 text-white/50 group-hover:text-orange-400" />
        </div>
        <span className="text-[10px] font-semibold text-white/60 group-hover:text-white">Seu story</span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onPick}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo story</DialogTitle>
          </DialogHeader>
          {previewUrl && file && (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh] flex items-center justify-center">
                {file.type.startsWith("video/") ? (
                  <video src={previewUrl} className="max-w-full max-h-full" controls autoPlay muted loop />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                )}
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma legenda (opcional)..."
                rows={2}
                maxLength={200}
                className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
              <Button
                onClick={submit}
                disabled={uploading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? "Publicando..." : "Publicar story (24h)"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoryUploader;
