"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMeeting, updateMeeting } from "@/lib/api";
import { Meeting } from "@/types";
import { MeetingForm } from "@/components/meeting-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const data = await getMeeting(id);
        setMeeting(data);
      } catch {
        toast.error("Failed to load meeting");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMeeting();
  }, [id, router]);

  async function onSubmit(data: Partial<Meeting>) {
    setIsSubmitting(true);
    try {
      await updateMeeting(id, data);
      toast.success("Meeting updated successfully");
      router.push(`/meetings/${id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update meeting"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mx-auto max-w-2xl space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: meeting.title, href: `/meetings/${id}` },
          { label: "Edit" },
        ]}
      />
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Meeting</h2>
      <div className="mx-auto max-w-2xl">
        <MeetingForm
          initialData={meeting}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
