"use client";

import { type ReactNode } from "react";

import { NoteTags } from "@/components/note-tags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Note = {
  id: string;
  title: string;
  updatedAt: string | Date;
  tags: string | null;
};

type MinimalError = {
  message?: string;
};

type ProfileNoteListProps = {
  title?: ReactNode;
  description?: ReactNode;
  user?: { id: string } | null;
  notes: Note[];
  isLoading: boolean;
  error?: MinimalError | null;
  onEdit: (id: string) => void;
};

export function ProfileNoteList({
  title = "笔记列表",
  user,
  notes,
  isLoading,
  error,
  onEdit,
}: ProfileNoteListProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 py-6">
        {!user && (
          <p className="text-muted-foreground text-sm">
            请登录后查看笔记列表。
          </p>
        )}
        {user && isLoading && (
          <p className="text-muted-foreground text-sm">加载中...</p>
        )}
        {user && error && (
          <p className="text-destructive text-sm">
            {error.message ?? "加载失败"}
          </p>
        )}
        {user && !isLoading && !error && notes.length === 0 && (
          <p className="text-muted-foreground text-sm">暂无笔记</p>
        )}
        {user && notes.length > 0 && (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border-border/70 hover:border-border flex flex-col gap-3 rounded-lg border p-4 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium">{note.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      最近更新：
                      {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(note.id)}
                  >
                    编辑
                  </Button>
                </div>
                <NoteTags tags={note.tags} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
