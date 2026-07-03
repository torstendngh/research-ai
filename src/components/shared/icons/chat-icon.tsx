import { SVGProps } from "react";

const ChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M15.25 9.75H8.75M12.25 14.25H8.75M2.75 20.25H16.25C19.0114 20.25 21.25 18.0114 21.25 15.25V8.75C21.25 5.98858 19.0114 3.75 16.25 3.75H7.75C4.98858 3.75 2.75 5.98858 2.75 8.75V20.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChatIcon;
