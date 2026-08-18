export type LiveChatThreadStatus = "active" | "resolved" | "archived";
export type LiveChatSenderType = "user" | "admin" | "system";
export type LiveChatMessageType = "text" | "image" | "video";

export interface LiveChatMessage {
  message_id: number;
  thread_id: number;
  sender_type: LiveChatSenderType;
  sender_user_id: number | null;
  sender_admin_id: number | null;
  message_type: LiveChatMessageType;
  body: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

export interface LiveChatFeedback {
  rating: number;
  comment: string | null;
  source: "web";
  tags: string[];
  submitted_at: string;
  updated_at: string;
}
export interface LiveChatIntakeChoice {
  choice_id: number;
  label: string;
  sort_order: number;
}

export interface LiveChatIntake {
  intake_id: number;
  status: "started" | "completed" | "expired";
  outcome: "skip" | "self_resolved" | "escalated" | null;
  topic_code: string | null;
  topic_revision: number | null;
  topic_title: string | null;
  path: Array<{
    node_id: number;
    node_key: string;
    prompt: string;
    choice_id: number;
    choice_label: string;
  }>;
  current_node: null | {
    node_id: number;
    node_key: string;
    prompt: string;
    choices: LiveChatIntakeChoice[];
  };
  terminal: null | {
    node_id: number;
    node_key: string;
    title: string;
    body: string;
    images: Array<{ image_url: string; sort_order: number }>;
  };
  expires_at: string;
}

export interface LiveChatThread {
  thread_id: number;
  status: LiveChatThreadStatus;
  assigned_admin_id: number | null;
  last_message_id: number | null;
  last_message_at: string | null;
  last_user_message_at: string | null;
  last_admin_message_at: string | null;
  last_resolved_at: string | null;
  archived_at: string | null;
  can_send: boolean;
  intake_summary: LiveChatIntake | null;
  resolution_summary: {
    issue_type: string;
    resolution_type: string;
    resolved_at: string;
  } | null;
  feedback_eligible: boolean;
  feedback_summary: LiveChatFeedback | null;
  created_at: string;
  updated_at: string;
}

export interface LiveChatMessage {
  message_id: number;
  thread_id: number;
  sender_type: LiveChatSenderType;
  sender_user_id: number | null;
  sender_admin_id: number | null;
  message_type: LiveChatMessageType;
  body: string;
  image_url?: string;
  created_at: string;
}

export interface LiveChatHelpTopic {
  topic_id: number;
  topic_code: string;
  title: string;
  description?: string | null;
  revision: number;
  sort_order: number;
}

export interface LiveChatFeedbackTag {
  key: string;
  label_th: string;
  label_en: string;
  sort_order: number;
}

export interface LiveChatError {
  httpStatus?: number;
  error_code?: string;
  message?: string;
  request_id?: string | null;
  retryAfter?: number;
  issues?: Array<{ path: string; message: string }>;
}

export interface LiveChatMediaConfigSpec {
  maxBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface LiveChatConfig {
  image: LiveChatMediaConfigSpec;
  video: LiveChatMediaConfigSpec;
}
