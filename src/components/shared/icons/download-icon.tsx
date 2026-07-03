import { SVGProps } from "react";

const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 4.25V15.25M12 15.25L16.25 11M12 15.25L7.75 11M5.25 19.75H18.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DownloadIcon;
