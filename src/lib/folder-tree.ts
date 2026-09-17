import type { Folder } from "@/lib/queries";

export type FolderNode = Folder & { children: FolderNode[]; depth: number };

/** Build a nested tree out of the flat folder list. */
export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  for (const f of folders) byId.set(f.id, { ...f, children: [], depth: 0 });

  const roots: FolderNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  const sort = (nodes: FolderNode[], depth: number) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    for (const n of nodes) {
      n.depth = depth;
      sort(n.children, depth + 1);
    }
  };
  sort(roots, 0);
  return roots;
}

/** Flatten the tree in display order, for pickers and indented lists. */
export function flattenFolders(nodes: FolderNode[]): FolderNode[] {
  return nodes.flatMap((n) => [n, ...flattenFolders(n.children)]);
}

/** Ids of a folder and every folder nested inside it. */
export function folderSubtreeIds(node: FolderNode): string[] {
  return [node.id, ...node.children.flatMap(folderSubtreeIds)];
}
