import { SVGProps } from "react";

const MindMapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 8.75C13.5188 8.75 14.75 7.51878 14.75 6C14.75 4.48122 13.5188 3.25 12 3.25C10.4812 3.25 9.25 4.48122 9.25 6C9.25 7.51878 10.4812 8.75 12 8.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6 20.75C7.51878 20.75 8.75 19.5188 8.75 18C8.75 16.4812 7.51878 15.25 6 15.25C4.48122 15.25 3.25 16.4812 3.25 18C3.25 19.5188 4.48122 20.75 6 20.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M18 20.75C19.5188 20.75 20.75 19.5188 20.75 18C20.75 16.4812 19.5188 15.25 18 15.25C16.4812 15.25 15.25 16.4812 15.25 18C15.25 19.5188 16.4812 20.75 18 20.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12 9V12M12 12H9C7.34315 12 6 13.3431 6 15M12 12H15C16.6569 12 18 13.3431 18 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export default MindMapIcon;
