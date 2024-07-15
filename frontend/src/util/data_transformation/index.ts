import { Question } from "@/components/QuizQuestionPreview";
import { GetQuizResponse } from "@/util/types";

interface TransformQuizOptions {
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
}

export function transformQuiz(
  quiz: GetQuizResponse,
  options?: TransformQuizOptions
) {
  const questions: Question[] = quiz.questions.map((q) => {
    const correctChoice = q.answers.find((a) => a.is_correct);
    if (!correctChoice) {
      throw new Error("No correct answer found");
    }

    const choices = q.answers.map((a) => {
      return {
        id: a.id.toString(),
        title: a.title,
      };
    });

    if (options?.shuffleAnswers) {
      choices.sort(() => Math.random() - 0.5);
    }

    return {
      id: q.id.toString(),
      title: q.title,
      choices,
      correctChoice: {
        id: correctChoice.id.toString(),
        title: correctChoice.title,
      },
    };
  });

  if (options?.shuffleQuestions) {
    questions.sort(() => Math.random() - 0.5);
  }

  return {
    id: quiz.id.toString(),
    title: quiz.title,
    subject_id: quiz.subject_id.toString(),
    subject_title: quiz.subject_title,
    description: quiz.description,
    duration: quiz.duration,
    success_percentage: quiz.success_percentage,
    questions,
    language: quiz.language,
    canDelete: quiz.can_delete,
  };
}
