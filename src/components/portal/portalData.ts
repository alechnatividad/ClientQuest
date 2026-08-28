import { FileText, Film, Image, PenTool, Presentation, type LucideIcon } from "lucide-react";

export type DeliverableStatus = "draft" | "review" | "approved";
export type FileType = "fig" | "pdf" | "img" | "deck" | "mp4";

export interface Note {
  author: string;
  role: string;
  text: string;
  time: string;
}

export interface Deliverable {
  id: string;
  title: string;
  type: FileType;
  size: string;
  updated: string;
  version: number;
  status: DeliverableStatus;
  notes: Note[];
}

export const FILE_META: Record<FileType, { icon: LucideIcon; label: string; tint: string; chip: string }> = {
  fig: { icon: PenTool, label: "Figma file", tint: "bg-violet-500/15 text-violet-300", chip: "FIG" },
  pdf: { icon: FileText, label: "PDF document", tint: "bg-rose-500/15 text-rose-300", chip: "PDF" },
  img: { icon: Image, label: "Image set", tint: "bg-emerald-500/15 text-emerald-300", chip: "IMG" },
  deck: { icon: Presentation, label: "Slide deck", tint: "bg-sky-500/15 text-sky-300", chip: "DECK" },
  mp4: { icon: Film, label: "Motion video", tint: "bg-amber-500/15 text-amber-300", chip: "MP4" },
};

export const PHASES = ["Discovery", "Design", "Build", "Launch"];
export const CURRENT_PHASE_INDEX = 1; // → "Phase 2: Design"

export const INITIAL_DELIVERABLES: Deliverable[] = [
  {
    id: "d1",
    title: "Creative brief & moodboard",
    type: "pdf",
    size: "4.2 MB",
    updated: "Mar 02",
    version: 3,
    status: "approved",
    notes: [
      { author: "Maya Reyes", role: "Client", text: "Direction feels right — locking this in.", time: "Mar 02, 10:14" },
      { author: "Nightowl Studio", role: "Agency", text: "Final v3 attached with the updated references.", time: "Mar 01, 16:40" },
    ],
  },
  {
    id: "d2",
    title: "Wireframe package — 12 screens",
    type: "fig",
    size: "18.6 MB",
    updated: "Mar 08",
    version: 2,
    status: "approved",
    notes: [
      { author: "Maya Reyes", role: "Client", text: "Flow reads cleanly. Approved as-is.", time: "Mar 08, 09:02" },
    ],
  },
  {
    id: "d3",
    title: "Homepage hero — 3 concepts",
    type: "fig",
    size: "22.1 MB",
    updated: "Mar 14",
    version: 2,
    status: "review",
    notes: [
      { author: "Maya Reyes", role: "Client", text: "Leaning toward concept B — can we see it with the serif headline?", time: "Mar 14, 11:37" },
      { author: "Nightowl Studio", role: "Agency", text: "Concept B updated with the alternate type treatment.", time: "Mar 14, 15:02" },
    ],
  },
  {
    id: "d4",
    title: "Brand color & type system",
    type: "pdf",
    size: "2.8 MB",
    updated: "Mar 15",
    version: 1,
    status: "review",
    notes: [
      { author: "Nightowl Studio", role: "Agency", text: "Full system spec with contrast checks included.", time: "Mar 15, 13:20" },
    ],
  },
  {
    id: "d5",
    title: "Mobile navigation flow",
    type: "fig",
    size: "9.4 MB",
    updated: "Mar 16",
    version: 1,
    status: "draft",
    notes: [],
  },
  {
    id: "d6",
    title: "Icon system exploration",
    type: "img",
    size: "6.1 MB",
    updated: "Mar 17",
    version: 1,
    status: "draft",
    notes: [
      { author: "Nightowl Studio", role: "Agency", text: "Two directions — line vs. duotone. Feedback welcome.", time: "Mar 17, 10:05" },
    ],
  },
];
