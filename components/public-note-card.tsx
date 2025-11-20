"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { NoteTags } from "@/components/note-tags";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NoteCardProps = {
  note: {
    id: string;
    title: string;
    updatedAt: string;
    tags: string | null;
    user?: {
      name: string | null;
      email: string;
      avatarUrl: string | null;
    } | null;
  };
  onView: (id: string) => void;
};

export default function PublicNoteCard({ note, onView }: NoteCardProps) {
  const router = useRouter();

  return (
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        {note.user?.avatarUrl ? (
          <Image
            src={note.user.avatarUrl}
            alt="avatar"
            width={48}
            height={48}
            className="border-border h-12 w-12 rounded-full border object-cover"
          />
        ) : (
          <div className="border-border h-12 w-12 rounded-full border border-dashed" />
        )}
        <div>
          <CardTitle>{note.title}</CardTitle>
          <CardDescription>
            {note.user?.name ?? note.user?.email ?? "匿名作者"} ·{" "}
            {new Date(note.updatedAt).toLocaleString()}
          </CardDescription>
          <div className="mt-2">
            <NoteTags tags={note.tags} />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/profile")}
        >
          作者
        </Button>
        <Button variant="outline" size="sm" onClick={() => onView(note.id)}>
          查看
        </Button>
      </CardFooter>
    </Card>
  );
}
