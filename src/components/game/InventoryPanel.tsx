"use client";

import {
  BookOpen,
  Coins,
  Compass,
  Feather,
  Gem,
  KeyRound,
  Lamp,
  Map,
  Package,
  Scroll,
  Shield,
  TestTube,
} from "lucide-react";
import type { IconName, InventoryItem } from "@/lib/gameTypes";
import { OrnateFrame } from "@/components/game/OrnateFrame";

const itemIcons = {
  map: Map,
  lamp: Lamp,
  coin: Coins,
  book: BookOpen,
  key: KeyRound,
  feather: Feather,
  scroll: Scroll,
  potion: TestTube,
  shield: Shield,
  compass: Compass,
  gem: Gem,
  default: Package,
} satisfies Record<IconName, typeof Package>;

type InventoryPanelProps = {
  items: InventoryItem[];
};

export function InventoryPanel({ items }: InventoryPanelProps) {
  return (
    <OrnateFrame title="Inventário" icon={Package}>
      <ul className="inventory-list">
        {items.map((item) => {
          const Icon = itemIcons[item.icon] ?? itemIcons.default;
          return (
            <li key={item.id} title={item.description}>
              <span className={`item-icon item-${item.rarity ?? "common"}`}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span>{item.name}</span>
              {item.quantity ? <strong>x{item.quantity}</strong> : null}
            </li>
          );
        })}
      </ul>
    </OrnateFrame>
  );
}
