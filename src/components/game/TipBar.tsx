import { Search } from "lucide-react";

export function TipBar() {
  return (
    <p className="tip-bar">
      <Search size={15} strokeWidth={2.2} aria-hidden="true" />
      <span>TIP: Be specific. Vague questions get vague answers.</span>
    </p>
  );
}
