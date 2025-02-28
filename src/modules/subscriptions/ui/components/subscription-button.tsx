import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionButtonProps {
  isSubscribed: boolean;
  disabled: boolean;
  className?: string;
  size?: ButtonProps["size"];
  onClick: ButtonProps["onClick"];
}

export const SubscriptionButton = ({
  isSubscribed,
  disabled,
  className,
  size,
  onClick,
}: SubscriptionButtonProps) => {
  return (
    <Button
      variant={isSubscribed ? "secondary" : "default"}
      size={size}
      className={cn("rounded-full", className)}
      disabled={disabled}
      onClick={onClick}
    >
      {isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
};
