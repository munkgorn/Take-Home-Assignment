"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Meeting } from "@/types";
import { cn } from "@/lib/utils";

const meetingSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    candidateName: z.string().min(1, "Candidate name is required"),
    position: z.string().min(1, "Position is required"),
    meetingType: z.enum(["onsite", "online"]),
    meetingLink: z.string().optional(),
    startDate: z.date({ error: "Start date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.date({ error: "End date is required" }),
    endTime: z.string().min(1, "End time is required"),
    status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.meetingType === "online" && !data.meetingLink) {
        return false;
      }
      return true;
    },
    {
      message: "Meeting link is required for online meetings",
      path: ["meetingLink"],
    }
  );

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  initialData?: Meeting;
  onSubmit: (data: Partial<Meeting>) => Promise<void>;
  isLoading: boolean;
}

export function MeetingForm({
  initialData,
  onSubmit,
  isLoading,
}: MeetingFormProps) {
  const isEdit = !!initialData;

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: initialData?.title || "",
      candidateName: initialData?.candidateName || "",
      position: initialData?.position || "",
      meetingType: initialData?.meetingType || "onsite",
      meetingLink: initialData?.meetingLink || "",
      startDate: initialData?.startTime
        ? new Date(initialData.startTime)
        : undefined,
      startTime: initialData?.startTime
        ? format(new Date(initialData.startTime), "HH:mm")
        : "",
      endDate: initialData?.endTime
        ? new Date(initialData.endTime)
        : undefined,
      endTime: initialData?.endTime
        ? format(new Date(initialData.endTime), "HH:mm")
        : "",
      status: initialData?.status || "pending",
      description: initialData?.description || "",
      notes: initialData?.notes || "",
    },
  });

  const meetingType = form.watch("meetingType");

  async function handleSubmit(values: MeetingFormValues) {
    const [startHours, startMinutes] = values.startTime.split(":").map(Number);
    const [endHours, endMinutes] = values.endTime.split(":").map(Number);

    const startDateTime = new Date(values.startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(values.endDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    await onSubmit({
      title: values.title,
      candidateName: values.candidateName,
      position: values.position,
      meetingType: values.meetingType,
      meetingLink:
        values.meetingType === "online" ? values.meetingLink : undefined,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: values.status,
      description: values.description || undefined,
      notes: values.notes || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Meeting title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="candidateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate Name</FormLabel>
                <FormControl>
                  <Input placeholder="Candidate name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Position" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="meetingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {meetingType === "online" && (
            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {isEdit && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Meeting description (optional)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes (optional)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Meeting"
                : "Create Meeting"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
