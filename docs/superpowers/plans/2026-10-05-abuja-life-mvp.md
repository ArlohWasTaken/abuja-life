# Abuja Life MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, playable, mobile-responsive browser-based life simulation game set in Abuja, Nigeria, featuring isometric 3D room scenes, server-authoritative economics, career and housing ladders, authentic Abuja culture/slang, and real-time multiplayer presence with room chat.

**Architecture:** A Next.js 15 App Router application with React 19 and Tailwind CSS. The 3D view is powered by an isometric `@react-three/fiber` canvas with click-to-move navigation. The backend enforces strict double-entry ledger validation via Drizzle ORM and SQLite to prevent state tampering. Real-time room presence and chat are handled via a decoupled WebSocket protocol.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, `@react-three/fiber`, Three.js, Drizzle ORM, `better-sqlite3`, Zustand, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-05-abuja-life-design.md`](file:///C:/Users/Kensey/Documents/antigravity/serene-nobel/docs/superpowers/specs/2026-10-05-abuja-life-design.md)

---

## Global Constraints

* All code must reside inside `abuja-life/`.
* The client must never send raw balances or inventories to the server (`PUT /api/save` with arbitrary money is strictly disallowed).
* All career and investment timers must use server database timestamps (`Date.now()` on the server).
* All money values in calculations and tables must match the spec:
  * Corper: ₦33,000 starting cash; Contractor: ₦150,000; Gwarinpa Landlord: ₦80,000; Nepo: ₦2,500,000.
  * Food: Mama Put (₦2,500), Al-Basha Shawarma (₦4,500), Kado Catfish (₦12,000).
  * Housing: Kubwa BQ (₦30,000/week), Gwarinpa (₦120,000/week), Wuse 2 (₦350,000/week), Maitama (₦1,500,000/week).
* Full TypeScript strict mode enabled with zero lint errors.

## Review Focus

1. **Negative Balance Protection:** An action that costs more than the player's balance must roll back the atomic transaction without mutating state.
2. **Earning Velocity Enforcement:** Rapid shift-calling macros must be rejected by server-side cooldown checks.
3. **WebGL Context Loss:** The canvas must recover gracefully when the browser tab is hidden and restored.
4. **Optimistic UI Rollback:** If an action fails on the server, the client Zustand store must revert to the last server-confirmed state.
5. **WebSocket Disconnect Teardown:** When a player leaves a room or closes the tab, remote avatars must unmount cleanly without orphan markers.

---

## Task Decomposition

### Task 1: Scaffolding, Tooling & Test Framework

**Files:**
- Create: `abuja-life/package.json`
- Create: `abuja-life/tsconfig.json`
- Create: `abuja-life/next.config.ts`
- Create: `abuja-life/vitest.config.ts`
- Create: `abuja-life/src/app/layout.tsx`
- Create: `abuja-life/src/app/page.tsx`
- Test: `abuja-life/tests/sanity.test.ts`

**Interfaces:**
- Produces: Project foundation, Vitest runner, and basic Next.js root layout.

- [ ] **Step 1: Write the failing sanity test**
```typescript
// abuja-life/tests/sanity.test.ts
import { describe, it, expect } from "vitest";

describe("Sanity Environment Check", () => {
  it("should confirm the test environment is functional", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify failure (missing runner/setup)**
Run: `cd abuja-life && npx vitest run tests/sanity.test.ts`
Expected: FAIL (No such directory or package)

- [ ] **Step 3: Scaffold `abuja-life` with Next.js, TypeScript, Tailwind, and Vitest**
Initialize `abuja-life/package.json` with dependencies (`next`, `react`, `react-dom`, `drizzle-orm`, `better-sqlite3`, `zustand`, `lucide-react`, `three`, `@react-three/fiber`, `clsx`, `tailwind-merge`), configure `vitest.config.ts` and `tsconfig.json`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/sanity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/
git commit -m "chore: scaffold abuja-life with Next.js, TypeScript, Tailwind, and Vitest"
```

---

### Task 2: Database Schema & Server-Authoritative Ledger

**Files:**
- Create: `abuja-life/src/lib/db/schema.ts`
- Create: `abuja-life/src/lib/db/index.ts`
- Create: `abuja-life/src/lib/db/ledger.ts`
- Test: `abuja-life/tests/ledger.test.ts`

**Interfaces:**
- Produces: 
  - `executeTransaction(userId: string, amount: number, actionType: string, metadata?: object): Promise<{ newBalance: number }>`
  - `getUserById(id: string): Promise<User | null>`
  - `createUser(username: string, origin: OriginType): Promise<User>`

- [ ] **Step 1: Write the failing ledger tests**
```typescript
// abuja-life/tests/ledger.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb, executeTransaction, createUser, getUserById } from "../src/lib/db/ledger";

describe("Server-Authoritative Ledger & User Store", () => {
  beforeEach(() => {
    initTestDb();
  });

  it("should create a user with exact starting cash by origin", () => {
    const corper = createUser("tunde_corper", "corper");
    expect(corper.money).toBe(33000);
    expect(corper.apartmentId).toBe("kubwa_bq");

    const nepo = createUser("femi_nepo", "nepo");
    expect(nepo.money).toBe(2500000);
    expect(nepo.apartmentId).toBe("maitama_mansion");
  });

  it("should accurately process debits and prevent negative balances", () => {
    const user = createUser("chidi_contractor", "contractor"); // ₦150,000
    const result = executeTransaction(user.id, -50000, "rent");
    expect(result.newBalance).toBe(100000);

    expect(() => {
      executeTransaction(user.id, -200000, "buy_car");
    }).toThrow(/Insufficient funds/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/ledger.test.ts`
Expected: FAIL (Cannot find module `ledger`)

- [ ] **Step 3: Implement Schema & Ledger in `src/lib/db/`**
Implement Drizzle SQLite schema for `users` and `transactionLedger`. Implement `executeTransaction` inside an atomic transaction block that checks `user.money + amount >= 0` before inserting the ledger row and updating the user's balance.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/ledger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/lib/db/ abuja-life/tests/ledger.test.ts
git commit -m "feat(db): implement database schema and atomic transaction ledger"
```

---

### Task 3: Game Constants & Action Engine

**Files:**
- Create: `abuja-life/src/lib/game/constants.ts`
- Create: `abuja-life/src/lib/game/actions.ts`
- Create: `abuja-life/src/app/api/action/route.ts`
- Test: `abuja-life/tests/actions.test.ts`

**Interfaces:**
- Consumes: `executeTransaction`, `getUserById` from Task 2
- Produces: 
  - `handleGameAction(userId: string, actionPayload: ActionRequest): Promise<ActionResult>`
  - `POST /api/action` endpoint

- [ ] **Step 1: Write the failing action tests**
```typescript
// abuja-life/tests/actions.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb, createUser } from "../src/lib/db/ledger";
import { handleGameAction } from "../src/lib/game/actions";

describe("Game Action Rules & Vitals", () => {
  beforeEach(() => {
    initTestDb();
  });

  it("should process eating Al-Basha Shawarma with correct vitals and cash deduction", () => {
    const user = createUser("amina_test", "corper"); // 33,000 cash, 100 energy, 50 hunger
    const result = handleGameAction(user.id, { type: "eat", itemId: "shawarma_wuse2" });
    
    expect(result.money).toBe(28500); // 33000 - 4500
    expect(result.hunger).toBe(90);    // 50 + 40
  });

  it("should enforce shift cooldowns to block macro spamming", () => {
    const user = createUser("ahmed_civil", "corper");
    const shift1 = handleGameAction(user.id, { type: "work_shift" });
    expect(shift1.money).toBe(33000 + 35000);

    expect(() => {
      handleGameAction(user.id, { type: "work_shift" });
    }).toThrow(/Cooldown in effect/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/actions.test.ts`
Expected: FAIL (`handleGameAction` not defined)

- [ ] **Step 3: Implement Game Constants & Action Dispatcher**
Define food items, careers, and housing in `constants.ts`. Implement `handleGameAction` in `actions.ts` covering `eat`, `sleep`, `work_shift`, and `rent_apartment` with cooldown verification using `user.lastShiftAt`. Implement the Next.js route handler in `src/app/api/action/route.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/lib/game/ abuja-life/src/app/api/action/ abuja-life/tests/actions.test.ts
git commit -m "feat(game): implement game action dispatcher and cooldown verification"
```

---

### Task 4: Minigames & Random Encounters Engine

**Files:**
- Create: `abuja-life/src/lib/game/minigames.ts`
- Create: `abuja-life/src/lib/game/encounters.ts`
- Test: `abuja-life/tests/minigames.test.ts`

**Interfaces:**
- Produces:
  - `evaluateStampMinigame(score: number, rank: number): { payout: number; bonus: number }`
  - `evaluateTenderLobby(patience: number, clout: number): { released: boolean; payout: number }`
  - `triggerRandomEncounter(location: string, clout: number): EncounterEvent`

- [ ] **Step 1: Write the failing minigames & encounters test**
```typescript
// abuja-life/tests/minigames.test.ts
import { describe, it, expect } from "vitest";
import { evaluateStampMinigame, evaluateTenderLobby, triggerRandomEncounter } from "../src/lib/game/minigames";

describe("Minigames and Random Encounters", () => {
  it("should calculate Civil Service bonus based on stamp accuracy", () => {
    const perfectScore = evaluateStampMinigame(100, 1); // Rank 1 (Level 08)
    expect(perfectScore.payout).toBe(35000);
    expect(perfectScore.bonus).toBeGreaterThan(0);
  });

  it("should resolve VIO encounter based on player clout", () => {
    const lowClout = triggerRandomEncounter("cbd", 50);
    expect(["bribe", "fine"]).toContain(lowClout.mandatoryOption);

    const highClout = triggerRandomEncounter("cbd", 500); // Senator-tier clout
    expect(highClout.availableOptions).toContain("name_drop_pass");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/minigames.test.ts`
Expected: FAIL (`evaluateStampMinigame` not defined)

- [ ] **Step 3: Implement Minigames & Encounters Logic**
Implement scoring formulas, tender windfall RNG based on patience meters, and the contextual Abuja encounters (VIO Checkpoint, Banex Gadget Gamble, Aso Rock Convoy) in `src/lib/game/minigames.ts` and `src/lib/game/encounters.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/minigames.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/lib/game/minigames.ts abuja-life/src/lib/game/encounters.ts abuja-life/tests/minigames.test.ts
git commit -m "feat(game): implement shift minigames and random street encounter engine"
```

---

### Task 5: 3D Isometric Room Canvas & Avatar Navigation

**Files:**
- Create: `abuja-life/src/components/canvas/GameCanvas.tsx`
- Create: `abuja-life/src/components/canvas/RoomScene.tsx`
- Create: `abuja-life/src/components/canvas/Avatar.tsx`
- Create: `abuja-life/src/components/canvas/rooms/SecretariatOffice.tsx`
- Create: `abuja-life/src/components/canvas/rooms/WuseLounge.tsx`
- Create: `abuja-life/src/components/canvas/rooms/JabiLake.tsx`

**Interfaces:**
- Produces: 
  - `<GameCanvas roomId={currentLocation} onPositionChange={fn} />`
  - Point-and-click movement with floor raycasting and coordinate interpolation.

- [ ] **Step 1: Write smoke test for Three.js scene mounting**
```typescript
// abuja-life/tests/canvas.test.ts
import { describe, it, expect } from "vitest";
import { getRoomConfig } from "../src/lib/game/constants";

describe("Room Scene Configuration", () => {
  it("should provide valid camera angles and bounds for all districts", () => {
    const secretariat = getRoomConfig("secretariat");
    expect(secretariat.cameraPosition).toBeDefined();
    expect(secretariat.bounds.width).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/canvas.test.ts`
Expected: FAIL (`getRoomConfig` not defined)

- [ ] **Step 3: Implement Three.js isometric components**
Implement `<GameCanvas />` with orthographic camera angle `[20, 20, 20]`, ambient and directional lighting. Implement `<RoomScene />` with procedural low-poly office desks, lounges, palm trees, and water planes. Implement `<Avatar />` with click-to-move pointer events, lerped walking animation, and username overhead label.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/canvas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/components/canvas/ abuja-life/tests/canvas.test.ts
git commit -m "feat(canvas): implement Three.js isometric room canvas and avatar navigation"
```

---

### Task 6: Real-Time Multiplayer Room & Chat Layer

**Files:**
- Create: `abuja-life/src/lib/realtime/protocol.ts`
- Create: `abuja-life/src/lib/realtime/useRoomMultiplayer.ts`
- Create: `abuja-life/src/components/ui/RoomChat.tsx`
- Create: `abuja-life/src/components/canvas/OtherPlayers.tsx`
- Test: `abuja-life/tests/realtime.test.ts`

**Interfaces:**
- Produces: 
  - `useRoomMultiplayer(roomId: string, player: Player)` hook returning `{ otherPlayers, sendMovement, sendChat, messages }`
  - `<RoomChat />` and `<OtherPlayers />` components

- [ ] **Step 1: Write the failing protocol serialization test**
```typescript
// abuja-life/tests/realtime.test.ts
import { describe, it, expect } from "vitest";
import { encodePacket, decodePacket } from "../src/lib/realtime/protocol";

describe("Realtime Multiplayer Protocol", () => {
  it("should encode and decode movement packets without precision loss", () => {
    const packet = { type: "MOVE" as const, x: 4.25, z: -1.5, rotation: 1.57 };
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);

    expect(decoded).toEqual(packet);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/realtime.test.ts`
Expected: FAIL (`encodePacket` not defined)

- [ ] **Step 3: Implement Multiplayer Hook & Room Chat**
Implement packet types, encoding/decoding, and a robust WebSocket client hook in `useRoomMultiplayer.ts` with auto-reconnection and room switching. Implement `<OtherPlayers />` rendering remote avatars at synchronized coordinates and `<RoomChat />` rendering live chat bubbles and feed.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/realtime.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/lib/realtime/ abuja-life/src/components/ui/RoomChat.tsx abuja-life/tests/realtime.test.ts
git commit -m "feat(realtime): implement multiplayer room presence, avatar sync, and live chat"
```

---

### Task 7: Game HUD, Modals, Sound System & UI Shell

**Files:**
- Create: `abuja-life/src/components/ui/VitalsHUD.tsx`
- Create: `abuja-life/src/components/ui/DistrictMapModal.tsx`
- Create: `abuja-life/src/components/ui/MinigameModal.tsx`
- Create: `abuja-life/src/components/ui/EncounterModal.tsx`
- Create: `abuja-life/src/lib/audio/SoundEffects.ts`
- Create: `abuja-life/src/lib/game/state.ts` (Zustand store)

**Interfaces:**
- Consumes: Action API, Minigames, Room Multiplayer
- Produces: Complete playable browser UI with responsive HUD, district traveling, and interactive dialogs.

- [ ] **Step 1: Write failing Zustand store test**
```typescript
// abuja-life/tests/store.test.ts
import { describe, it, expect } from "vitest";
import { useGameStore } from "../src/lib/game/state";

describe("Client Game Store", () => {
  it("should initialize with default vitals and allow optimistic updates", () => {
    const store = useGameStore.getState();
    expect(store.vitals.energy).toBe(100);
    store.updateVitals({ energy: 80 });
    expect(useGameStore.getState().vitals.energy).toBe(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd abuja-life && npx vitest run tests/store.test.ts`
Expected: FAIL (`useGameStore` not defined)

- [ ] **Step 3: Implement UI Components, Web Audio SFX & Store**
Implement `<VitalsHUD />` displaying Energy, Hunger, Fun, Clout, and Naira formatted balance (`₦33,000`). Implement `<DistrictMapModal />` showing Abuja districts with travel buttons. Implement `<MinigameModal />` and `<EncounterModal />`. Implement `SoundEffects.ts` with Web Audio synthesized tones for cash, stamps, and horns.

- [ ] **Step 4: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add abuja-life/src/components/ui/ abuja-life/src/lib/audio/ abuja-life/src/lib/game/state.ts abuja-life/tests/store.test.ts
git commit -m "feat(ui): implement vitals HUD, district travel modal, sound effects, and Zustand store"
```

---

### Task 8: End-to-End Integration, Smoke Testing & Polish

**Files:**
- Modify: `abuja-life/src/app/page.tsx`
- Modify: `abuja-life/src/app/layout.tsx`
- Create: `abuja-life/tests/e2e.test.ts`

**Interfaces:**
- Integrates: All previous tasks into the primary interactive route `http://localhost:3000`.

- [ ] **Step 1: Write integration flow test**
```typescript
// abuja-life/tests/e2e.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { initTestDb, createUser } from "../src/lib/db/ledger";
import { handleGameAction } from "../src/lib/game/actions";

describe("Full Game Loop Integration", () => {
  beforeEach(() => {
    initTestDb();
  });

  it("should take a Corper from arrival, through shift work, eating, and renting a Gwarinpa flat", () => {
    const user = createUser("tunde_integration", "corper");
    
    // 1. Work shift
    const afterShift = handleGameAction(user.id, { type: "work_shift" });
    expect(afterShift.money).toBe(68000); // 33k + 35k
    expect(afterShift.energy).toBeLessThan(100);

    // 2. Eat food to recover hunger
    const afterEat = handleGameAction(user.id, { type: "eat", itemId: "mama_put" });
    expect(afterEat.money).toBe(65500); // 68k - 2.5k
    expect(afterEat.hunger).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**
Run: `cd abuja-life && npx vitest run tests/e2e.test.ts`
Expected: PASS

- [ ] **Step 3: Assemble `src/app/page.tsx` with responsive layout & welcome modal**
Connect `GameCanvas`, `VitalsHUD`, `DistrictMapModal`, `MinigameModal`, and `RoomChat`. Add an initial "Choose Your Origin" screen for new players.

- [ ] **Step 4: Run full test suite across the whole project**
Run: `cd abuja-life && npx vitest run`
Expected: All test suites PASS (100% green)

- [ ] **Step 5: Commit & verify clean git status**
```bash
git add abuja-life/
git commit -m "feat(core): complete Abuja Life MVP fullstack integration and smoke verification"
```
