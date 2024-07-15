import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Question, QuestionChoice } from "@/components/QuizQuestionPreview";

interface FinishedQuizQuestion extends Question {
  selectedChoice?: QuestionChoice;
}

interface Props {
  question: FinishedQuizQuestion;
}

const FinishedQuizQuestionPreview = ({ question }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent onClick={handleExpandClick} sx={{ cursor: "pointer" }}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">{question.title}</Typography>
          <Box>
            {!question?.selectedChoice ||
            question.correctChoice.id !== question.selectedChoice.id ? (
              <HighlightOffIcon color="error" />
            ) : (
              <CheckCircleOutlineIcon color="success" />
            )}
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show answers"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={expanded}>
          <List>
            {question.choices.map((choice) => {
              const isUserAnswer = question?.selectedChoice?.id === choice.id;
              const isCorrectAnswer = choice.id === question.correctChoice.id;
              const isWrongAnswer =
                question.selectedChoice &&
                choice.id === question.selectedChoice.id &&
                !isCorrectAnswer;

              return (
                <ListItem key={`${question.id}-${choice.id}`}>
                  <ListItemIcon>
                    {isCorrectAnswer ? (
                      <CheckCircleOutlineIcon color="success" />
                    ) : isWrongAnswer ? (
                      <HighlightOffIcon color="error" />
                    ) : null}
                  </ListItemIcon>
                  <ListItemText
                    primary={choice.title}
                    primaryTypographyProps={{
                      style: {
                        textDecoration: isUserAnswer ? "underline" : "none",
                        color: isCorrectAnswer
                          ? "green"
                          : isWrongAnswer
                          ? "red"
                          : "inherit",
                      },
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FinishedQuizQuestionPreview;
