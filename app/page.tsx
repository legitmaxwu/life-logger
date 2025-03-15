"use client";

import { useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import LogsView from "../components/LogsView";
import HabitsView from "../components/HabitsView";
import LogTypesView from "../components/LogTypesView";

export default function Home() {
  return (
    <div className="min-h-screen bg-notebook">
      <header className="sticky top-0 z-10 bg-paper p-4 border-b border-pencil/20 flex flex-row justify-between items-center shadow-sm">
        <span className="text-2xl font-handwriting text-pencil">
          LifeLogger
        </span>
        <UserButton />
      </header>
      <main className="p-6 md:p-8">
        <Authenticated>
          <LifeLoggerApp />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </div>
  );
}

function SignInForm() {
  const createDefaultTypes = useMutation(api.logTypes.createDefaultTypes);

  const handleSetup = async () => {
    await createDefaultTypes();
  };

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto bg-paper p-8 rounded-lg shadow-md border border-pencil/10">
      <h1 className="text-4xl font-handwriting text-center text-pencil">
        LifeLogger
      </h1>
      <p className="text-center font-notebook text-pencil/80">
        Your personal space to track life&apos;s little victories
      </p>
      <SignInButton mode="modal">
        <button className="w-full py-3 px-4 bg-highlight hover:bg-highlight/90 text-paper rounded-md font-notebook transition-colors">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="w-full py-3 px-4 bg-pencil hover:bg-pencil/90 text-paper rounded-md font-notebook transition-colors">
          Sign up
        </button>
      </SignUpButton>
      <button
        onClick={handleSetup}
        className="w-full bg-highlight text-paper py-2 rounded-md font-notebook hover:bg-highlight/90 transition-colors"
      >
        Set Up My Journal
      </button>
    </div>
  );
}

function LifeLoggerApp() {
  const [activeTab, setActiveTab] = useState("logs");
  const logTypes = useQuery(api.logTypes.list) || [];
  const createDefaultTypes = useMutation(api.logTypes.createDefaultTypes);

  if (logTypes.length === 0) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center p-8 bg-paper rounded-lg shadow-md border border-pencil/10 max-w-xl mx-auto">
        <h2 className="text-3xl font-handwriting text-pencil">
          Welcome to your Journal!
        </h2>
        <p className="text-pencil/80 font-notebook text-center">
          Let&apos;s set up your journal with some basic tracking categories to
          get you started.
        </p>
        <button
          className="py-3 px-6 bg-highlight hover:bg-highlight/90 text-paper rounded-md font-notebook transition-colors"
          onClick={() => createDefaultTypes()}
        >
          Set Up My Journal
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex gap-2 font-handwriting text-lg">
        <TabButton
          active={activeTab === "logs"}
          onClick={() => setActiveTab("logs")}
        >
          Daily Logs
        </TabButton>
        <TabButton
          active={activeTab === "habits"}
          onClick={() => setActiveTab("habits")}
        >
          Habits
        </TabButton>
        <TabButton
          active={activeTab === "types"}
          onClick={() => setActiveTab("types")}
        >
          Log Types
        </TabButton>
      </div>

      <div className="bg-paper rounded-lg shadow-md border border-pencil/10 p-6">
        {activeTab === "logs" ? (
          <LogsView />
        ) : activeTab === "habits" ? (
          <HabitsView />
        ) : (
          <LogTypesView />
        )}
      </div>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`px-6 py-2 rounded-t-lg transition-colors ${
        active
          ? "bg-paper text-pencil border-t border-x border-pencil/10 shadow-sm"
          : "text-pencil/60 hover:text-pencil/80"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
