export interface GetQuizResponse {
  description: string;
  duration: number;
  id: number;
  questions: {
    answers: {
      id: number;
      is_correct: boolean;
      title: string;
    }[];
    id: number;
    title: string;
  }[];
  subject_id: number;
  subject_title: string;
  success_percentage: number;
  title: string;
  language: string;
  can_delete: boolean;
}
