import { SVGProps } from "react";

const SidebarLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M2.75 7.75C2.75 6.09315 4.09315 4.75 5.75 4.75H18.25C19.9069 4.75 21.25 6.09315 21.25 7.75V16.25C21.25 17.9069 19.9069 19.25 18.25 19.25H5.75C4.09315 19.25 2.75 17.9069 2.75 16.25V7.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.25 8.25V15.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default SidebarLeftIcon;
