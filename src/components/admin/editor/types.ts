import type { EventData, EventType } from "@/types";
import type { EditorSectionId } from "@/constants/editor";

export interface EditorSectionBaseProps {
  tenant: EventData;
  updateTenant: (updater: (prev: EventData) => EventData, sectionId?: EditorSectionId) => void;
  onSave: (sectionName: string, sectionId?: EditorSectionId) => void;
  isSaving: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isDirty: boolean;
  lastSavedTime?: string;
}

export interface EditorMediaSectionProps extends EditorSectionBaseProps {
  uploading: string | null;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "avatar" | "album" | "middlePhoto" | "finalPhoto" | "qrImage" | "logo"
  ) => Promise<void>;
}
