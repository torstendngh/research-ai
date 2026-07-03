import { SVGProps } from "react";

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M4.5 6L5.37929 19.6288C5.44718 20.6812 6.32055 21.5 7.37512 21.5H16.625C17.6795 21.5 18.5528 20.6812 18.6207 19.6288L19.5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 5.5H21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.54834 5.41709C8.82587 3.76154 10.2656 2.5 12 2.5C13.7344 2.5 15.1741 3.76154 15.4517 5.41709"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default TrashIcon;
