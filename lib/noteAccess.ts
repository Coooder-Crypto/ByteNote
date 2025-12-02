export type AccessInput = {
  note: {
    userId?: string | null;
    collaborators?: { userId: string }[];
    deletedAt?: string | Date | null;
    isCollaborative?: boolean;
    folderId?: string | null;
  };
  currentUserId?: string;
  localOnly?: boolean;
};

export type AccessResult = {
  isOwner: boolean;
  isCollaborator: boolean;
  canEdit: boolean;
  isTrashed: boolean;
};

export function computeAccess({
  note,
  currentUserId,
  localOnly,
}: AccessInput): AccessResult {
  if (localOnly) {
    return {
      isOwner: true,
      isCollaborator: false,
      canEdit: true,
      isTrashed: false,
    };
  }

  const isOwner =
    typeof currentUserId === "string" && note.userId === currentUserId;
  const isCollaborator = Boolean(
    currentUserId &&
      note.collaborators?.some((item) => item.userId === currentUserId),
  );
  const isTrashed = Boolean(note.deletedAt);
  const canEdit = !isTrashed && (isOwner || isCollaborator);

  return { isOwner, isCollaborator, canEdit, isTrashed };
}
