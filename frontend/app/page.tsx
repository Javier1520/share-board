"use client";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../components/auth-provider";
import { register, login } from "../services/api";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (auth?.access) {
      router.replace("/home");
    }
  }, [auth?.access, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await register({ username, email, password });
        setMode("login");
        setLoading(false);
        setError("Registration successful. Please log in.");
        return;
      } else {
        const tokens = await login({ username, password });
        auth?.setTokens(tokens.access, tokens.refresh);
        // router.replace will be triggered by useEffect
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  if (auth?.access) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18181b]">
      <Card className="w-full max-w-sm p-6 bg-[#23232a] border-none">
        <div className="flex justify-center mb-6">
          <Button
            variant={mode === "login" ? "default" : "ghost"}
            onClick={() => setMode("login")}
            className="w-1/2 rounded-none rounded-l"
          >
            Login
          </Button>
          <Button
            variant={mode === "register" ? "default" : "ghost"}
            onClick={() => setMode("register")}
            className="w-1/2 rounded-none rounded-r"
          >
            Register
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="bg-[#23232a] border-[#31313a] text-[#e4e4e7]"
            />
          </div>
          {mode === "register" && (
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#23232a] border-[#31313a] text-[#e4e4e7]"
              />
            </div>
          )}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#23232a] border-[#31313a] text-[#e4e4e7]"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Register"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
