"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createMeeting } from "@/lib/api";
import { Meeting } from "@/types";
import { MeetingForm } from "@/components/meeting-form";
import { Button } from "@/components/ui/button";

export default function NewMeetingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(data: Partial<Meeting>) {
    setIsLoading(true);
    try {
      await createMeeting(data);
      toast.success("Meeting created successfully");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create meeting"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Back</Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">
          Schedule New Meeting
        </h2>
      </div>
      <div className="mx-auto max-w-2xl">
        <MeetingForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
