import Window from "../window";
import QuizCards from "./quiz-cards";

/** The quiz cards tab: deck list + generator inside the standard window card. */
const QuizCardsTab = () => (
  <Window className="flex-1">
    <QuizCards />
  </Window>
);

export default QuizCardsTab;
