import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Flame,
  LayoutGrid,
  Calculator,
  Menu,
  Plus,
  Search,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { GizmoLogo } from "./GizmoLogo";
import { useDecks } from "@/lib/queries";
import { colorHex } from "@/lib/deck-colors";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NewDeckDialog } from "./NewDeckDialog";

const NAV = [
  { to: "/decks", label: "My decks", icon: BarChart3 },
  { to: "/progress", label: "Progress", icon: Flame },
  { to: "/public-decks", label: "Public decks", icon: LayoutGrid },
  { to: "/gwa", label: "GWA Calculator", icon: Calculator },
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: decks } = useDecks();
  const [filter, setFilter] = useState("");
  const [searching, setSearching] = useState(false);
  const [newDeck, setNewDeck] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const list = (decks ?? []).filter((d) =>
    d.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-6">
      <Link to="/decks" onClick={onNavigate} className="px-2">
        <GizmoLogo />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold press ${
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            const first = decks?.[0];
            if (first) {
              onNavigate?.();
              navigate({ to: "/study/$deckId", params: { deckId: first.id } });
            } else {
              setNewDeck(true);
            }
          }}
          className="min-h-12 rounded-full bg-brand px-4 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Quiz
        </button>
        <button
          onClick={() => setNewDeck(true)}
          className="min-h-12 rounded-full border border-border bg-card px-4 text-[15px] font-bold text-foreground press hover:bg-muted/60"
        >
          Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-semibold text-muted-foreground">Library</span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Search decks"
              onClick={() => setSearching((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground press hover:bg-muted"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              aria-label="Add deck"
              onClick={() => setNewDeck(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground press hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {searching && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search…"
            className="min-h-10 rounded-xl border border-border px-3 text-sm outline-none focus:border-brand"
          />
        )}

        <div className="flex flex-col">
          {list.map((deck) => (
            <Link
              key={deck.id}
              to="/decks/$deckId"
              params={{ deckId: deck.id }}
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-[15px] font-medium text-foreground press hover:bg-muted/60"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-[4px]"
                style={{ backgroundColor: colorHex(deck.color) }}
              />
              <span className="min-w-0 flex-1 truncate">{deck.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {list.length === 0 && (
            <p className="px-2 py-2 text-sm text-muted-foreground">No decks yet.</p>
          )}
        </div>
      </div>

      <button
        onClick={signOut}
        className="mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-muted-foreground press hover:bg-muted/60 hover:text-foreground"
      >
        <LogOut className="h-5 w-5" /> Log out
      </button>

      <NewDeckDialog open={newDeck} onOpenChange={setNewDeck} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-2 w-full shrink-0 edge-gradient" />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
          <SidebarBody />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="grid h-11 w-11 place-items-center rounded-xl border border-border press"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-80 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <GizmoLogo />
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <div className="h-2 w-full shrink-0 edge-gradient" />
    </div>
  );
}
