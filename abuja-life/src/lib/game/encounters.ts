export interface EncounterOption {
  id: string;
  label: string;
  description: string;
  cost?: number;
  cloutRequired?: number;
}

export interface EncounterEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  mandatoryOption?: string;
  availableOptions: string[];
  options: EncounterOption[];
}

export function triggerRandomEncounter(location: string, clout: number): EncounterEvent {
  if (location === "secretariat" || location === "cbd") {
    const isVip = clout >= 400;
    return {
      id: "vio_checkpoint",
      title: "🚨 VIO & FRSC Checkpoint on Shehu Shagari Way",
      description: "Two officers in white and brown uniforms flag down your vehicle. 'Driver, pull over!'",
      location: "secretariat",
      mandatoryOption: isVip ? undefined : clout < 100 ? "bribe" : undefined,
      availableOptions: isVip
        ? ["show_papers", "bribe", "name_drop_pass"]
        : ["show_papers", "bribe"],
      options: [
        {
          id: "show_papers",
          label: "Show Complete Papers",
          description: "Present inspection sticker, roadworthiness, and fire extinguisher.",
          cost: 0,
        },
        {
          id: "bribe",
          label: "'Officer, take pure water' (₦2,000)",
          description: "Discreetly fold ₦2,000 into your license.",
          cost: 2000,
        },
        {
          id: "name_drop_pass",
          label: "'Do you know who my Uncle is?'",
          description: "Mention a Director in the Ministry of Transport. Officers immediately salute.",
          cloutRequired: 400,
        },
      ],
    };
  }

  return {
    id: "banex_gamble",
    title: "📱 Banex Plaza Street Vendor",
    description: "A boy in oversized sunglasses corners you: 'Chairman! UK-used iPhone 16 Pro Max, ₦120,000!'",
    location: "wuse2",
    availableOptions: ["buy_phone", "walk_away"],
    options: [
      {
        id: "buy_phone",
        label: "Take the Gamble (₦120,000)",
        description: "Pay the money and pray the box doesn't have a floor tile inside.",
        cost: 120000,
      },
      {
        id: "walk_away",
        label: "Shake head and walk fast",
        description: "'No thanks, my brother.' Keep your money intact.",
        cost: 0,
      },
    ],
  };
}
