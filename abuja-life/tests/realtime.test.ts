import { describe, it, expect } from "vitest";
import { encodePacket, decodePacket, ClientPacket, ServerPacket } from "../src/lib/realtime/protocol";

describe("Realtime Multiplayer Protocol", () => {
  it("should encode and decode movement packets without precision loss", () => {
    const packet: ClientPacket = { type: "MOVE", x: 4.25, z: -1.5, rotation: 1.57 };
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);

    expect(decoded).toEqual(packet);
  });

  it("should encode and decode chat packets accurately", () => {
    const packet: ServerPacket = {
      type: "CHAT",
      id: "msg_123",
      senderId: "usr_xyz",
      username: "Alhaji_Wuse",
      text: "Who dey for Banex? We dey outside! 🍾",
      timestamp: 1728144000,
    };
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);

    expect(decoded).toEqual(packet);
  });

  it("should encode and decode room join and leave events", () => {
    const joinPacket: ServerPacket = {
      type: "ROOM_STATE",
      roomId: "secretariat",
      players: [
        { id: "p1", username: "Tunde", x: 2, z: -1, color: "#16a34a" },
        { id: "p2", username: "Amina", x: -3, z: 4, color: "#9333ea" },
      ],
    };
    expect(decodePacket(encodePacket(joinPacket))).toEqual(joinPacket);

    const leavePacket: ServerPacket = { type: "PLAYER_LEAVE", playerId: "p1" };
    expect(decodePacket(encodePacket(leavePacket))).toEqual(leavePacket);
  });

  it("should return null for malformed packet data", () => {
    expect(decodePacket("invalid json data string")).toBeNull();
  });
});
