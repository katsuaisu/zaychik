import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderX,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DeckCard, DeckGrid, type DeckWithCount } from "@/components/DeckCard";
import { NewDeckDialog } from "@/components/NewDeckDialog";
import { buildFolderTree, flattenFolders, type FolderNode } from "@/lib/folder-tree";
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
          "Your flashcard library: organize decks into folders and subfolders, edit cards and start a study session.",
      },
      { property: "og:title", content: "My decks — Gizmo" },
      { property: "og:description", content: "Your flashcard library in Gizmo." },
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const all = decks ?? [];
  const tree = buildFolderTree(folders ?? []);
  const flat = flattenFolders(tree);
  const unsorted = all.filter((d) => !d.folder_id);

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
          {flat.map((f) => (
            <option key={f.id} value={f.id}>
              {"— ".repeat(f.depth)}
              {f.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  function renderDecks(list: DeckWithCount[]) {
    if (list.length === 0) {
      return <p className="text-sm text-muted-foreground">No decks in this folder yet.</p>;
    }
    return (
      <DeckGrid>
        {list.map((deck) => (
          <DeckCard key={deck.id} deck={deck} action={folderPicker(deck.id, deck.folder_id)} />
        ))}
      </DeckGrid>
    );
  }

  function renderFolder(node: FolderNode) {
    const isOpen = !collapsed[node.id];
    const list = all.filter((d) => d.folder_id === node.id);
    return (
      <section
        key={node.id}
        className={node.depth > 0 ? "ml-3 border-l border-border pl-4 sm:ml-5 sm:pl-5" : ""}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed((c) => ({ ...c, [node.id]: isOpen }))}
            aria-expanded={isOpen}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-1 text-left press hover:bg-muted/60"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <Folder className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h2 className="truncate text-lg font-extrabold tracking-tight">{node.name}</h2>
            <span className="text-sm font-semibold text-muted-foreground">{list.length}</span>
          </button>
          <div className="flex shrink-0 gap-1">
            <button
              aria-label={`Add subfolder in ${node.name}`}
              onClick={() => {
                const name = window.prompt(`New folder inside "${node.name}"`)?.trim();
                if (name)
                  createFolder.mutate({
                    name,
                    parent_id: node.id,
                    position: node.children.length,
                  });
                setCollapsed((c) => ({ ...c, [node.id]: false }));
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-muted"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              aria-label={`Rename ${node.name}`}
              onClick={() => {
                const name = window.prompt("Rename folder", node.name)?.trim();
                if (name) renameFolder.mutate({ id: node.id, name });
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              aria-label={`Delete ${node.name}, keep decks`}
              title="Delete folder, keep decks"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete folder "${node.name}" and its subfolders? Decks are kept.`,
                  )
                )
                  deleteFolder.mutate(node.id);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              aria-label={`Delete ${node.name} and its decks`}
              title="Delete folder and everything inside"
              onClick={() => {
                const ids = folderSubtreeIds(node);
                const count = all.filter((d) => d.folder_id && ids.includes(d.folder_id)).length;
                if (
                  window.confirm(
                    `Delete folder "${node.name}", its subfolders and ${count} ${
                      count === 1 ? "deck" : "decks"
                    } with all their cards? This cannot be undone.`,
                  )
                )
                  deleteFolderWithDecks.mutate(ids);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground press hover:bg-destructive/10 hover:text-destructive"
            >
              <FolderX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 flex flex-col gap-5">
            {renderDecks(list)}
            {node.children.map(renderFolder)}
          </div>
        )}
      </section>
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
        <div className="card-soft mb-6 flex flex-wrap items-center gap-2 p-4">
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
              createFolder.mutate({ name, position: tree.length, parent_id: null });
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
      ) : all.length === 0 && tree.length === 0 ? (
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
          {tree.map(renderFolder)}

          {unsorted.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 px-1">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-extrabold tracking-tight">Unsorted</h2>
                <span className="text-sm font-semibold text-muted-foreground">
                  {unsorted.length}
                </span>
              </div>
              {renderDecks(unsorted)}
            </section>
          )}
        </div>
      )}

      <NewDeckDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
