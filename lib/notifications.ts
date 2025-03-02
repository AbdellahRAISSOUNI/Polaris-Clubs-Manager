import { toast as sonnerToast } from "sonner";
import { toast as shadcnToast } from "@/hooks/use-toast";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title?: string;
  description: string;
  duration?: number;
  action?: React.ReactNode;
}

/**
 * Show a notification toast
 * @param type The type of notification (success, error, warning, info)
 * @param options The notification options
 */
export function showNotification(type: NotificationType, options: NotificationOptions) {
  const { title, description, duration = 5000, action } = options;
  
  // Show notification using Sonner toast
  switch (type) {
    case "success":
      sonnerToast.success(title || "Success", {
        description,
        duration,
        action,
      });
      break;
    case "error":
      sonnerToast.error(title || "Error", {
        description,
        duration,
        action,
      });
      break;
    case "warning":
      sonnerToast.warning(title || "Warning", {
        description,
        duration,
        action,
      });
      break;
    case "info":
      sonnerToast.info(title || "Info", {
        description,
        duration,
        action,
      });
      break;
  }
  
  // Also show notification using Shadcn toast for redundancy
  shadcnToast({
    variant: type === "error" ? "destructive" : "default",
    title: title || capitalizeFirstLetter(type),
    description,
    duration,
    action,
  });
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Convenience functions
export const successNotification = (options: Omit<NotificationOptions, "title"> & { title?: string }) => 
  showNotification("success", options);

export const errorNotification = (options: Omit<NotificationOptions, "title"> & { title?: string }) => 
  showNotification("error", options);

export const warningNotification = (options: Omit<NotificationOptions, "title"> & { title?: string }) => 
  showNotification("warning", options);

export const infoNotification = (options: Omit<NotificationOptions, "title"> & { title?: string }) => 
  showNotification("info", options); 