import re
import json
from typing import List, Literal
import openai
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredMarkdownLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.pydantic_v1 import BaseModel, Field
from util.index import get_file_extension


def trim_segment(segment: str) -> str:
    """
    Trims the segment to the maximum token length.
    """
    # It doesnt matter the exact max tokens, we just want to make sure the segment is not too long.
    # We should probably consider using a tokenizer in the future
    max_tokens = 6000
    segment = segment.strip()
    if len(segment) > max_tokens:
        segment = segment[:max_tokens]
    return segment


class Answer(BaseModel):
    title: str = Field(description="The answer title")
    is_correct: bool = Field(description="Whether the answer is correct or not")


class Question(BaseModel):

    title: str = Field(description="The question title")
    answers: List[Answer] = Field(description="The question's choice based answers")
    language: str = Field(description="The language of the provided text")
    success: bool = Field(
        description="Whether the question was successfully generated or not"
    )
    message: str = Field(description="An additional response message")


class Exam(BaseModel):
    questions: List[Question] = Field(description="List of exam questions")
    language: str = Field(description="The language of the provided text")


class QuizGPT:
    def __init__(self, openai_api_key: str, celery_task, files: List[str]) -> None:
        pages = []
        for file in files:
            file_extension = get_file_extension(file)

            if file_extension in ["md", "markdown"]:
                loader = UnstructuredMarkdownLoader(file)
            elif file_extension in ["pdf"]:
                loader = PyPDFLoader(file)
            elif file_extension in ["txt"]:
                loader = TextLoader(file)
            elif file_extension in ["docx", "doc"]:
                loader = UnstructuredWordDocumentLoader(file)

            documents = loader.load_and_split()
            pages.extend(documents)

        self.pages = pages
        self.openai_api_key = openai_api_key
        self.celery_task = celery_task
        self.language = self._detect_document_language()
        self.language = self._validate_language_or_default(self.language, "unknown")

    def _clean_text(self, text: str) -> str:
        """
        PDF Parsing returns text with multiple new lines and new lines within paragraphs.
        This method cleans up the new lines.
        """
        # Replace multiple new lines with a single new line
        text = re.sub(r"\n+", "\n", text)

        # Replace new lines within paragraphs with a space
        text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)

        return text

    def _detect_document_language(self) -> str:
        """
        Detect language of document using GPT.
        Could use another method to detect language, but this will do for now.
        """
        total_pages = len(self.pages)

        # Function to find the middle index and adjust
        def find_middle_index(current_page: int) -> int:
            return total_pages // 2 if current_page is None else current_page + 1

        current_page = None

        # Starting from the middle page (no particular reason for starting from there), loop
        # through the pages to detect the language
        while True:
            current_page = find_middle_index(current_page)

            # If we've reached the end of the pages, it means we couldn't detect the language
            if current_page >= total_pages:
                return "unknown"

            text = self.pages[current_page].page_content
            text = self._clean_text(text)
            # Prepare a prompt for GPT to detect the language of the content
            prompt = f"What language is the following text written in? If you do not know, respond with lower case 'unknown'.\n{text}"
            # Call the GPT API to detect the language
            client = openai.OpenAI(api_key=self.openai_api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                messages=[{"role": "user", "content": prompt}],
            )
            # Return the detected language text
            detected_language = response.choices[0].message.content.lower()

            # Assuming GPT will return 'unknown' if it can't detect the language
            if detected_language.lower() not in ["unknown"]:
                return detected_language

            # If the detected language is unknown or empty, move to the next page
            current_page += 1

    def _validate_language_or_default(self, value: str, default: str) -> str:
        """
        Validates the language provided, whether it is a real language or not. If
        not, returns the provided `default` value.
        """
        with open("util/quizgpt/languages.json") as f:
            d = json.load(f)
            languages: List[str] = [l["name"].lower() for l in d]

            if value.lower() in languages:
                return value

            return default

    def _extract_content(self, pages: List[Document]) -> str:
        """
        Extracts the text content from the provided pages and combines them into a single string variable.
        """
        combined_text = " ".join(pages.page_content for pages in pages)
        return self._clean_text(combined_text)

    def _split_content(self, content, num_segments) -> List[str]:
        """
        Splits content into approximately equal segments and returns them
        """
        # Split content into approximately equal segments
        segment_length = len(content) // num_segments
        segments = [
            content[i * segment_length : (i + 1) * segment_length]
            for i in range(num_segments)
        ]
        # Handle any remaining content by adding it to the last segment
        if len(content) % num_segments != 0:
            segments[-1] += content[num_segments * segment_length :]
        return segments

    def _gpt_generate_question(self, content: str) -> Question:
        """
        Generates a question based on the provided content using GPT
        """
        llm = ChatOpenAI(model="gpt-4o", api_key=self.openai_api_key)

        # structured_llm = llm.with_structured_output(Exam)
        structured_llm = llm.with_structured_output(Question)

        PROMPT = f"""
        Based on the below exam material text, generate a single exam question. Apply the following rules:
        - {f"The question's language must be {self.language}." if self.language else "Detect the question's language based on the material text."}
        - Create exactly 4 answers for the question.
        - The generated question must be meaningful and relevant to the provided content.
        - The question must be in the form of a question, not a statement.
        - The question must not contain anything directly from the examples of the provided content, instead, it should be based on the content, or the subjects of the content.
        - If you are unable to generate a question based on the provided rules and content, leave the title and answer titles empty, the `success` field as false and add a message (in english), use the following rules for the message:
        - - If the content is too short, use the exact message: "The content is too short to generate a question."
        - - If the content is irrelevant, use the exact message: "The content is irrelevant to generate a question."
        - - If the content is too vague, use the exact message: "The content is too vague to generate a question."
        - - If none of the above apply, use the exact message: "The question could not be generated." + additional text that provides a reason as to why the question could not be generated.

        Text:
        {content}
        """

        result = structured_llm.invoke(PROMPT)
        return result

    def generate_questions(
        self, num_questions: int
    ) -> tuple[
        List[Question], Literal["success", "too-short", "irrelevant", "vague"], str
    ]:
        """
        Generates questions from the provided pages.

        Returns:
        - A list of questions (can be empty if no questions were generated)
        - A status code message providing additional information about the success/failure of the operation
        - A human readable message providing additional information about the success/failure of the operation
        """
        if type(num_questions) is not int or num_questions < 1:
            raise ValueError(
                "The number of questions must be an integer greater than 0."
            )

        total_pages = len(self.pages)

        segments = []

        # Return values
        questions: List[Question] = []
        status_code_message: str = ""
        message: str = ""

        # If there are more questions than pages, we'll need to split the content into more segments
        if num_questions > total_pages:
            content = self._extract_content(self.pages)
            segments = self._split_content(content, num_questions)
        else:
            segments = []
            ratio = total_pages / num_questions
            for i in range(num_questions):
                start_page = int(i * ratio)
                end_page = int((i + 1) * ratio) if ratio > 1 else start_page + 1
                end_page = min(end_page, total_pages)
                segment_content = self._extract_content(self.pages[start_page:end_page])
                segments.append(segment_content)

        # Generate questions for each segment
        for i, segment in enumerate(segments):
            # This is a hotfix to ensure that the segment is not huge, as it can cause GPT to fail and can be a bit expensive.
            segment = trim_segment(segment)
            question = self._gpt_generate_question(segment)
            if not question.success:
                # If the question could not generate due to content being too short, we can assume that the
                # each provided segment is too short, not just this particular segment. Meaning that
                # the user is asking for too much questions for their provided content.
                #
                # We do not want to proceed with this, because even though other questions might succeed,
                # there is a probability that the short content of the question will affect its quality. ##
                if "too short" in question.message:
                    return (
                        [],
                        "too-short",
                        "The provided content is too short to generate questions.",
                    )

            questions.append(question)
            self.celery_task.update_state(
                state="PROGRESS", meta={"current": i + 1, "total": num_questions}
            )

        failed_questions_count = 0
        # In case there are any unsuccessful questions, attempt to regenerate them
        for i, question in enumerate(questions):
            # Find the unsuccessful question
            if not question.success or not question.title:
                unsuccessful_question_segment = segments[i]
                new_question = self._gpt_generate_question(
                    unsuccessful_question_segment
                )
                # If the new generated question was still unsuccessful, we can assume GPT is simply unable
                # to generate the question from the provided segment.
                if not new_question.success or not new_question.title:
                    failed_questions_count += 1
                    # Skip this question.
                    continue

                # Otherwise we replace the unsuccessful question with the new one.
                questions[i] = new_question

        if failed_questions_count > 0:
            message = f"{failed_questions_count} questions could not be generated."
            for q in questions:
                if not q.success:
                    if "too short" in q.message:
                        status_code_message = "too-short"
                        message += " The content is too short to generate a question."
                    elif "irrelevant" in q.message:
                        status_code_message = "irrelevant"
                        message += " The content is irrelevant to generate a question."
                    elif "vague" in q.message:
                        status_code_message = "vague"
                        message += " The content is too vague to generate a question."
        else:
            status_code_message = "success"
            message = "All questions were successfully generated."

        # Filter out any questions that were not successful
        questions = [q for q in questions if q.success and q.title]

        return questions, status_code_message, message

    def get_language(self) -> tuple[str, str]:
        with open("util/quizgpt/languages.json") as f:
            d = json.load(f)
            for l in d:
                if l["name"].lower() == self.language:
                    return l["code"], l["name"]

        return "unknown", "unknown"
