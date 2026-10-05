export interface RemotePlayer {
  id: string;
  username: string;
  x: number;
  z: number;
  rotation?: number;
  color: string;
  capColor?: string;
  activeChat?: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  username: string;
  text: string;
  timestamp: number;
}

export type ClientPacket =
  | { type: "JOIN_ROOM"; roomId: string; username: string; color: string }
  | { type: "LEAVE_ROOM"; roomId: string }
  | { type: "MOVE"; x: number; z: number; rotation?: number }
  | { type: "CHAT_SEND"; text: string };

export type ServerPacket =
  | { type: "ROOM_STATE"; roomId: string; players: RemotePlayer[] }
  | { type: "PLAYER_JOIN"; player: RemotePlayer }
  | { type: "PLAYER_MOVE"; playerId: string; x: number; z: number; rotation?: number }
  | { type: "PLAYER_LEAVE"; playerId: string }
  | ({ type: "CHAT" } & ChatMessage);

export function encodePacket(packet: ClientPacket | ServerPacket): string {
  return JSON.stringify(packet);
}

export function decodePacket<T = ClientPacket | ServerPacket>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
