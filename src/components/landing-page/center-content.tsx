import { cn } from "@/lib/tailwind-utils";
import { ReactNode } from "react";

interface CenterContentProps {
  children?: ReactNode;
  className?: string;
  id?: string;
}

const CenterContent = ({ children, className, id }: CenterContentProps) => {
  return (
    <section
      id={id}
      className={cn(
        "max-w-300 w-full mx-auto px-8 flex flex-col",
        className,
      )}
    >
      {children}
    </section>
  );
};

export default CenterContent;
