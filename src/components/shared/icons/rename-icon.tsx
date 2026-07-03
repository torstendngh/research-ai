import { SVGProps } from "react";

const RenameIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M11 6.5H19.5C20.6046 6.5 21.5 7.39543 21.5 8.5V15.5C21.5 16.6046 20.6046 17.5 19.5 17.5H11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M6 6.5H4.5C3.39543 6.5 2.5 7.39543 2.5 8.5V15.5C2.5 16.6046 3.39543 17.5 4.5 17.5H6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8.5 3V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default RenameIcon;
