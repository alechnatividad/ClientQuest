import { useState } from "react";
import { Bell, Check, Palette, Save, Users } from "lucide-react";

const BRAND_COLORS = [
  { name: "Violet", value: "#8B5CF6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Gold", value: "#F59E0B" },
  { name: "Sky", value: "#38BDF8" },
];

interface Props {
  onToast: (title: string, sub: string) => void;
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left transition-colors duration-200 hover:border-slate-700"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          on ? "bg-[#10B981]" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function AdminSettings({ onToast }: Props) {
  const [workspace, setWorkspace] = useState("Nightowl Studio");
  const [tagline, setTagline] = useState("Brand & web for ambitious teams");
  const [color, setColor] = useState(BRAND_COLORS[0].value);
  const [prefs, setPrefs] = useState({ signoff: true, archive: true, notify: false });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-slate-500">Studio preferences for every client workspace you publish.</p>

      {/* Workspace Branding */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-quest/15 text-violet-300">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-white">Workspace Branding</h2>
            <p className="text-xs text-slate-500">What clients see at the top of their portal.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_200px]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold tracking-[0.14em] text-slate-500">WORKSPACE NAME</span>
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-600 focus:border-quest"
                placeholder="Your studio name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-[0.14em] text-slate-500">TAGLINE</span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-600 focus:border-quest"
                placeholder="One line about your studio"
              />
            </label>
            <div>
              <span className="text-xs font-bold tracking-[0.14em] text-slate-500">BRAND COLOR</span>
              <div className="mt-2.5 flex items-center gap-3">
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    aria-label={`Use ${c.name}`}
                    className={`grid h-9 w-9 place-items-center rounded-full transition-all duration-200 hover:scale-110 ${
                      color === c.value ? "ring-2 ring-white/80 ring-offset-2 ring-offset-slate-900" : ""
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {color === c.value && <Check className="h-4 w-4 text-slate-950" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* live preview */}
          <div>
            <span className="text-xs font-bold tracking-[0.14em] text-slate-500">LIVE PREVIEW</span>
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg font-display text-sm font-bold text-white transition-colors duration-300"
                  style={{ backgroundColor: color }}
                >
                  {workspace.slice(0, 1).toUpperCase() || "S"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{workspace || "Your studio"}</p>
                  <p className="truncate text-[11px] text-slate-500">{tagline || "Tagline"}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full w-2/3 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onToast("Branding saved", "Client workspaces now reflect your new identity.")}
            className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-400 active:translate-y-0 active:scale-95"
          >
            <Save className="h-4 w-4" /> Save branding
          </button>
        </div>
      </section>

      {/* Approval preferences */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 text-[#10B981]">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-white">Approval Preferences</h2>
            <p className="text-xs text-slate-500">How sign-off behaves across all projects.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <Toggle
            on={prefs.signoff}
            onChange={() => setPrefs((p) => ({ ...p, signoff: !p.signoff }))}
            label="Require explicit sign-off per deliverable"
            desc="Deliverables move to Approved only after the client clicks approve."
          />
          <Toggle
            on={prefs.archive}
            onChange={() => setPrefs((p) => ({ ...p, archive: !p.archive }))}
            label="Auto-archive approved files to the Asset Library"
            desc="Final versions stay available to the client after the project closes."
          />
          <Toggle
            on={prefs.notify}
            onChange={() => setPrefs((p) => ({ ...p, notify: !p.notify }))}
            label="Email clients when a deliverable enters review"
            desc="A single, clean notification — never a status update blast."
          />
        </div>
      </section>

      {/* Client access */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400/15 text-[#F59E0B]">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-white">Client Access</h2>
            <p className="text-xs text-slate-500">Invite reviewers to this workspace.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-600 focus:border-quest"
            placeholder="client@company.com"
          />
          <button
            onClick={() => onToast("Invite sent", "Your client will receive a magic link to the portal.")}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-quest hover:bg-quest/15 hover:text-violet-200"
          >
            Send invite
          </button>
        </div>
      </section>
    </div>
  );
}
