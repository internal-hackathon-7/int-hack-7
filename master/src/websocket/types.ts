export interface ClientToServerEvents {
  create_room: () => void;
  join_room: (roomCode: string) => void;
}

export interface ServerToClientEvents {
  room_created: (roomCode: string) => void;
  room_joined: (roomCode: string) => void;
  error_message: (message: string) => void;
}
