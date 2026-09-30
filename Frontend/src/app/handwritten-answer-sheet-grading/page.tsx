import SolutionPage from "@/components/marketing/SolutionPage";

export const metadata = {
  title: "Handwritten Answer Sheet Grading | ANKLYZE",
  description: "Review handwriting, working and diagrams in the context of the original examination page.",
};

export default function HandwrittenAnswerSheetGradingPage() {
  return <SolutionPage variant="handwriting" />;
}
