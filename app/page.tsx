"use client";
import { Navbar } from "@/components/navabar";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-6">
        <Dashboard />
      </div>
    </main>
  );
}
