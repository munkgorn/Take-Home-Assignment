"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { getMeeting, deleteMeeting } from "@/lib/api";
import { Meeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";

const statusColors: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  async function handleDelete() {
    try {
      await deleteMeeting(id);
      toast.success("Meeting deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete meeting");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: meeting.title }]} />
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{meeting.title}</h2>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Meeting Details</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/meetings/${meeting.id}/edit`}>Edit</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this meeting? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={statusColors[meeting.status]}
            >
              {meeting.status}
            </Badge>
            <Badge variant="outline">{meeting.meetingType}</Badge>
          </div>

          <Separator />

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Candidate
              </p>
              <p className="text-base">{meeting.candidateName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Position
              </p>
              <p className="text-base">{meeting.position}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Start Time
              </p>
              <p className="text-base">
                {format(new Date(meeting.startTime), "MMMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                End Time
              </p>
              <p className="text-base">
                {format(new Date(meeting.endTime), "MMMM d, yyyy h:mm a")}
              </p>
            </div>
            {meeting.meetingLink && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Meeting Link
                </p>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all"
                >
                  {meeting.meetingLink}
                </a>
              </div>
            )}
          </div>

          {meeting.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-base">
                  {meeting.description}
                </p>
              </div>
            </>
          )}

          {meeting.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-base">
                  {meeting.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>
              Created: {format(new Date(meeting.createdAt), "MMMM d, yyyy h:mm a")}
            </p>
            <p>
              Updated: {format(new Date(meeting.updatedAt), "MMMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
