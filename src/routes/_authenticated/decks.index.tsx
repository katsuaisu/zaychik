import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Folder, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { DeckCard, DeckGrid } from "@/components/DeckCard";
import { NewDeckDialog } from "@/components/NewDeckDialog";
import {
  useCreateFolder,
  useDecks,
  useDeleteFolder,
  useFolders,
  useMoveDeckToFolder,
  useRenameFolder,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/decks/")({
  head: () => ({
    meta: [
      { title: "My decks — Zaychik" },
      {
        name: "description",
        content:
          "Your flashcard library: organize decks into folders, edit cards and start a study session.",
      },
      { property: "og:title", content: "My decks — Zaychik" },
      { property: "og:description", content: "Your flashcard library in Zaychik." },
    ],
  }),
  component: DecksPage,
});

function DecksPage() {
  const { data: decks, isLoading } = useDecks();
  const { data: folders } = useFolders();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const moveDeck = useMoveDeckToFolder();
  const [open, setOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [adding, setAdding] = useState(false);

  const all = decks ?? [];
  const groups = [
    ...(folders ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      decks: all.filter((d) => d.folder_id === f.id),
    })),
    { id: null as string | null, name: "Unsorted", decks: all.filter((d) => !d.folder_id) },
  ];

  function folderPicker(deckId: string, folderId: string | null) {
    return (
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Folder className="h-4 w-4" />
        <select
          value={folderId ?? ""}
          onChange={(e) => moveDeck.mutate({ id: deckId, folder_id: e.target.value || null })}
          className="min-h-9 flex-1 rounded-xl border border-border bg-background px-2 text-xs font-semibold outline-none focus:border-brand"
        >
          <option value="">No folder</option>
          {(folders ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My decks</h1>
          <p className="text-sm text-muted-foreground">
            {all.length} {all.length === 1 ? "deck" : "decks"} in your library
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-card px-5 text-[15px] font-bold press hover:bg-muted/60"
          >
            <FolderPlus className="h-5 w-5" /> New folder
          </button>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            <Plus className="h-5 w-5" /> New deck
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-6 flex flex-wrap items-center gap-2 card-soft p-4">
          <input
            autoFocus
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="Folder name, e.g. Science"
            className="min-h-11 flex-1 rounded-2xl border border-border px-3 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={() => {
              const name = newFolder.trim();
              if (!name) return;
              createFolder.mutate({ name, position: folders?.length ?? 0 });
              setNewFolder("");
              setAdding(false);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground press hover:opacity-90"
          >
            Create folder
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your decks…</p>
      ) : all.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <h2 className="text-xl font-extrabold">No decks yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first deck and start adding cards.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            <Plus className="h-5 w-5" /> New deck
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => {
            if (group.id === null && group.decks.length === 0) return null;
            return (
              <section key={group.id ?? "unsorted"}>
                <div className="mb-3 flex items-center gap-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-extrabold tracking-tight">{group.name}</h2>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {group.decks.length}
                  </span>
                  {group.id && (
                    <div className="ml-auto flex gap-1">
                      <button
                        aria-label={`Rename ${group.name}`}
                        onClick={() => {
                          const name = window.prompt("Rename folder", group.name)?.trim();
                          if (name) renameFolder.mutate({ id: group.id!, name });
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${group.name}`}
                        onClick={() => {
                          if (window.confirm(`Delete folder "${group.name}"? Decks are kept.`))
                            deleteFolder.mutate(group.id!);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {group.decks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No decks in this folder yet.</p>
                ) : (
                  <DeckGrid>
                    {group.decks.map((deck) => (
                      <DeckCard
                        key={deck.id}
                        deck={deck}
                        action={folderPicker(deck.id, deck.folder_id)}
                      />
                    ))}
                  </DeckGrid>
                )}
              </section>
            );
          })}
        </div>
      )}

      <NewDeckDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
