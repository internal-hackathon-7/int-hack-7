"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { LogOut } from "lucide-react";

interface User {
  name: string;
  email: string;
  picture: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();
        setUser(data);
      })
      .catch(() => {
        window.location.href = "http://localhost:5173/login";
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:3000/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "http://localhost:5173/login";
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-4 border-t-transparent border-emerald-400 rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6">
      <Card className="max-w-md w-full bg-gray-900/70 border border-emerald-500/30 shadow-2xl backdrop-blur-lg rounded-3xl overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center space-y-6">
          <motion.img
            src={user.picture}
            alt={user.name}
            className="w-24 h-24 rounded-full border-4 border-emerald-400 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
          />
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-300">
              {user.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{user.email}</p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition-all duration-300 rounded-xl py-2 px-6"
          >
            <LogOut size={18} /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
