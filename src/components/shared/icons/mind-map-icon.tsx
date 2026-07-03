import { SVGProps } from "react";

const MindMapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M8.75 12C8.75 10.4812 7.51878 9.25 6 9.25C4.48122 9.25 3.25 10.4812 3.25 12C3.25 13.5188 4.48122 14.75 6 14.75C7.51878 14.75 8.75 13.5188 8.75 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M20.75 18C20.75 16.4812 19.5188 15.25 18 15.25C16.4812 15.25 15.25 16.4812 15.25 18C15.25 19.5188 16.4812 20.75 18 20.75C19.5188 20.75 20.75 19.5188 20.75 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M20.75 6C20.75 4.48122 19.5188 3.25 18 3.25C16.4812 3.25 15.25 4.48122 15.25 6C15.25 7.51878 16.4812 8.75 18 8.75C19.5188 8.75 20.75 7.51878 20.75 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9 12L12 12M12 12L12 15C12 16.6569 13.3431 18 15 18M12 12L12 9C12 7.3431 13.3431 6 15 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export default MindMapIcon;
