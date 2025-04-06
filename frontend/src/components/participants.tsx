"use client";

interface Participant {
  id: string;
  username: string;
}

interface ParticipantsProps {
  participants: Participant[];
}

export function Participants({ participants }: ParticipantsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Participants</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center space-x-2 text-foreground"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{participant.username}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
