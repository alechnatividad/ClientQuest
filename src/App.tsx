import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import Portal from "./components/portal/Portal";

export default function App() {
  const [view, setView] = useState<"landing" | "portal">("landing");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  return view === "landing" ? (
    <LandingPage onEnter={() => setView("portal")} />
  ) : (
    <Portal onExit={() => setView("landing")} />
  );
}
