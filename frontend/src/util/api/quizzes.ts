import { PUBLIC_API_URL, customFetch } from "@/util";
import { useCallback, useEffect, useState } from "react";
import { GetQuizResponse } from "@/util/types";
import { QuizQuestion } from "@/pages/quizzes/[id]/start";

interface ISubjectsApiResponse {
  data: {
    id: string;
    title: string;
  }[];
  error?: string;
}

export function useGetSubjects(title?: string): ISubjectsApiResponse {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let query = "/quizzing/subjects";
        if (title) {
          query += `?search_query=${title}`;
        }
        const response = await customFetch(query);
        if (!response.ok) {
          return null;
        }
        const data = await response.json();

        if (!data) {
          setError("An error occurred while fetching subjects");
        }

        setSubjects(
          data.map((subject: { id: number; title: string }) => ({
            id: subject.id,
            title: subject.title,
          }))
        );
      } catch (error: any) {
        setError(error.message);
      }
    })();
  }, [title]);

  return { data: subjects, error };
}

export function useCreateOrGetSubject() {
  async function handleCreateOrGetSubject(
    title: string
  ): Promise<{ id: string; title: string }> {
    const getSubjectResponse = await customFetch(
      `/quizzing/subjects?search_query=${title}`,
      {}
    );

    if (!getSubjectResponse.ok) {
      throw new Error("Failed to fetch subjects");
    }

    const getSubjectData = await getSubjectResponse.json();

    if (getSubjectData.length) {
      const subject = getSubjectData.find(
        (subject: { id: string; title: string }) => subject.title === title
      );
      if (subject)
        return {
          id: subject.id,
          title: subject.title,
        };
    }

    // Else we create a new subject

    const response = await customFetch("/quizzing/subjects", {
      method: "POST",
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to create subject");
    }

    const data = await response.json();

    return {
      id: data.subject_id,
      title,
    };
  }

  return [handleCreateOrGetSubject];
}

export function useGetQuizzes(initialVariables?: {
  title?: string;
  subjectId?: string;
  language?: string;
}): {
  data: {
    hasMore: boolean;
    nextCursor: string;
    quizzes: {
      id: string;
      title: string;
      subject_id: string;
      subject_title: string;
      number_of_questions: number;
      description: string;
    }[];
  };
  error: null | string;
  loading: boolean;
  loadingReason: "initial-fetch" | "refetch" | "fetch-more";
  refetch: (variables?: {
    title?: string;
    subjectId?: string;
    language?: string;
  }) => void;
  fetchMore: () => void;
} {
  interface FetchVariables {
    title?: string;
    subjectId?: string;
    language?: string;
    limit?: number;
    cursor?: string;
  }

  interface QuizzesData {
    hasMore: boolean;
    nextCursor: string;
    quizzes: {
      id: string;
      title: string;
      subject_id: string;
      subject_title: string;
      number_of_questions: number;
      description: string;
    }[];
  }

  const transformQuizzes = (quizzes: any[]) => {
    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      subject_id: quiz.subject_id,
      subject_title: quiz.subject_title,
      number_of_questions: quiz.number_of_questions,
      description: quiz.description,
    }));
  };

  const [data, setData] = useState<QuizzesData>({
    hasMore: false,
    nextCursor: "",
    quizzes: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState<
    "initial-fetch" | "refetch" | "fetch-more"
  >("initial-fetch");
  const [variables, setVariables] = useState(initialVariables);

  const fetchQuizzes = useCallback(async (fetchVariables?: FetchVariables) => {
    setLoading(true);
    try {
      let query = "/quizzing/quizzes";
      const vars = fetchVariables || (variables as FetchVariables);

      const params = new URLSearchParams();
      if (vars?.limit) params.append("limit", vars.limit.toString());
      if (vars?.cursor) params.append("cursor", vars.cursor);
      if (vars?.title) params.append("search_query", vars.title);
      if (vars?.subjectId)
        params.append(
          "subject_id",
          vars.subjectId === "all" ? "" : vars.subjectId
        );
      if (vars?.language)
        params.append("language", vars.language === "all" ? "" : vars.language);

      if (params.toString()) {
        query += `?${params.toString()}`;
      }

      const response = await customFetch(query);

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingReason("initial-fetch");
      const result = await fetchQuizzes();
      setData({
        hasMore: result.has_more,
        nextCursor: result.next_cursor,
        quizzes: transformQuizzes(result.quizzes),
      });
    })();
  }, [fetchQuizzes]);

  const refetch = async (newVariables?: {
    title?: string;
    subjectId?: string;
    language?: string;
  }) => {
    setVariables(newVariables);
    setLoadingReason("refetch");
    const result = await fetchQuizzes(newVariables);
    setData({
      hasMore: result.has_more,
      nextCursor: result.next_cursor,
      quizzes: transformQuizzes(result.quizzes),
    });
  };

  const fetchMore = async () => {
    setLoadingReason("fetch-more");
    const result = await fetchQuizzes({
      ...variables,
      cursor: data.nextCursor,
    });
    setData({
      hasMore: result.has_more,
      nextCursor: result.next_cursor,
      quizzes: [...data.quizzes, ...transformQuizzes(result.quizzes)],
    });
  };

  return { data, error, loading, loadingReason, refetch, fetchMore };
}

interface ICreateQuizParams {
  gptApiKey: string;
  subject: { id: string; title: string };
  title: string;
  duration: number;
  numberOfQuestions: number;
  percentage: number;
  description: string;
  files: FileList | null;
  text: string;
}

export function useHandleCreateQuiz(): [
  (params: ICreateQuizParams) => Promise<{ taskId: string | null }>,
  { data: { taskId: string | null } | null; loading: boolean }
] {
  const [data, setData] = useState<{ taskId: string | null }>({ taskId: null });
  const [loading, setLoading] = useState(false);

  const [createOrGetSubject] = useCreateOrGetSubject();

  async function createQuiz(params: ICreateQuizParams): Promise<string> {
    const {
      gptApiKey,
      subject,
      title,
      duration,
      numberOfQuestions,
      percentage,
      description,
      files,
      text,
    } = params;

    if (!subject.id) {
      const fetchedSubject = await createOrGetSubject(subject.title);
      subject.id = fetchedSubject.id;
    }

    const formData = new FormData();

    formData.append("openai_api_key", gptApiKey);
    formData.append("subject_id", subject.id);
    formData.append("title", title);
    formData.append("duration", (duration * 60).toString());
    formData.append("number_of_questions", numberOfQuestions.toString());
    formData.append("success_percentage", percentage.toString());
    formData.append("description", description);

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }
    }

    if (text) {
      // Create a Blob from the text
      const blob = new Blob([text], { type: "text/plain" });
      // Create a File object from the Blob
      const file = new File([blob], "user_text.txt", { type: "text/plain" });
      // Append the file to the form data
      formData.append("file", file);
    }

    try {
      const response = await customFetch(
        "/quizzing/quizzes",
        {
          method: "POST",
          body: formData,
        },
        true
      );

      if (!response.ok) {
        throw new Error("Failed to create quiz");
      }

      const data = await response.json();

      return data.task_id;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function handleCreateQuiz(
    params: ICreateQuizParams
  ): Promise<{ taskId: string | null }> {
    setLoading(true);
    try {
      const quizTaskId = await createQuiz(params);
      setData({ taskId: quizTaskId });
      return { taskId: quizTaskId };
    } catch (error: any) {
      throw new Error(error);
    } finally {
      setLoading(false);
    }
  }

  return [handleCreateQuiz, { data, loading }];
}

// Not supported atm.
export function useDeleteQuiz() {
  async function handleDeleteQuiz(quizId: string) {
    const response = await customFetch(`/quizzing/quizzes/${quizId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete quiz");
    }

    return response;
  }

  return [handleDeleteQuiz];
}

export function useCreateQuizAttempt() {
  async function createQuizAttempt(quizId: string, questions: QuizQuestion[]) {
    const response = await customFetch(`/quizzing/quizzes/${quizId}/attempt`, {
      method: "POST",
      body: JSON.stringify({
        answered_questions: questions.map((q) => ({
          question_id: q.id,
          choice_id: q?.selectedChoice?.id,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create quiz attempt");
    }

    const data = await response.json();

    return {
      message: data.message as string,
      id: data.attempt_id as string,
    };
  }

  return [createQuizAttempt];
}

export async function getQuizServerSide(
  quizId: string
): Promise<GetQuizResponse | { notFound: boolean }> {
  const response = await fetch(`${PUBLIC_API_URL}/quizzing/quizzes/${quizId}`);

  if (!response.ok) {
    const statusCode = response.status;
    if (statusCode === 404) {
      return {
        notFound: true,
      };
    }

    throw new Error("Failed to fetch quiz");
  }

  const data = await response.json();

  // Fetch quiz data
  const subjectResponse = await fetch(
    `${PUBLIC_API_URL}/quizzing/subjects/${data.subject_id}`
  );

  const subjectData = await subjectResponse.json();

  // Check if the response is ok
  if (!subjectResponse.ok) {
    return {
      notFound: true,
    };
  }

  data.subject_title = subjectData.title;

  return data;
}

export interface QuizResult {
  id: number;
  quizId: number;
  result: number;
  didPass: boolean;
  successPercentage: number;
  isShared: boolean;
  questions: QuizQuestion[];
}

export async function getQuizAttemptServerSide(
  quizId: string,
  attemptId: string
): Promise<QuizResult | { notFound: boolean }> {
  const response = await fetch(
    `${PUBLIC_API_URL}/quizzing/quizzes/${quizId}/attempts/${attemptId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {
        notFound: true,
      };
    }

    throw new Error("Failed to fetch quiz attempt");
  }

  const data = await response.json();

  return {
    id: data.id,
    quizId: data.quiz_id,
    result: data.result, // number
    didPass: data.did_pass, // boolean,
    successPercentage: data.success_percentage, // number
    isShared: data.is_shared,
    questions: data.questions.map((q: any) => ({
      id: q.id,
      title: q.title,
      choices: q.answers.map((a: any) => ({
        id: a.id,
        title: a.title,
        isCorrect: a.is_correct,
      })),
      selectedChoice: q.choice,
      correctChoice: q.correct_choice,
    })),
  };
}

export async function shareQuiz(id: number) {
  const response = await customFetch(`/quizzing/quizzes/${id}/share`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Failed to share quiz");
  }

  return response;
}
