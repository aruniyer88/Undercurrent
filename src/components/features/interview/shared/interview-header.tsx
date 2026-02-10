'use client';

interface InterviewHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  className?: string;
}

export function InterviewHeader({
  questionNumber,
  totalQuestions,
  className,
}: InterviewHeaderProps) {
  return (
    <div className={className}>
      <p className="text-sm text-neutral-600 font-medium">
        Question {questionNumber} of {totalQuestions}
      </p>
    </div>
  );
}
