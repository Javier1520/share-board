"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toast.success("Login successful");
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Card className="w-full max-w-md p-6 space-y-6 bg-gray-800 text-white">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 border-gray-600"
              disabled={isLoading}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border-gray-600"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="text-center text-gray-400">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300"
          >
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
