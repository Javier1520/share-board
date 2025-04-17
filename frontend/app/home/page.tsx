"use client";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../components/auth-provider";
import { createRoom, joinRoom } from "../../services/api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

export default function HomePage() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.access) {
      router.replace("/");
    }
  }, [auth?.access, router]);

  if (!auth?.access) {
    // Show a loading spinner or message while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#18181b] text-[#e4e4e7]">
        <span>Redirecting...</span>
      </div>
    );
  }

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom(auth.access!);
      router.push(`/room/${room.code}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const room = await joinRoom(joinCode, auth.access!);
      router.push(`/room/${room.code}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.clearTokens();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18181b]">
      <Card className="w-full max-w-sm p-6 bg-[#23232a] border-none flex flex-col gap-6">
        <Button onClick={handleCreate} className="w-full" disabled={loading}>
          {loading ? "Please wait..." : "Create Room"}
        </Button>
        <form onSubmit={handleJoin} className="space-y-4">
          <Label htmlFor="join-code">Join Room by Code</Label>
          <Input
            id="join-code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
            className="bg-[#23232a] border-[#31313a] text-[#e4e4e7]"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            Join Room
          </Button>
        </form>
        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}
        <Button variant="ghost" onClick={handleLogout} className="w-full mt-2">
          Logout
        </Button>
      </Card>
    </div>
  );
}
