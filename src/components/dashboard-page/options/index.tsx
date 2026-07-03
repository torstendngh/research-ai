import Window from "../window";
import ProjectOptions from "./project-options";

/** The options tab: project settings inside the standard window card. */
const ProjectOptionsTab = () => (
  <Window className="flex-1" title="Project options">
    <ProjectOptions />
  </Window>
);

export default ProjectOptionsTab;
