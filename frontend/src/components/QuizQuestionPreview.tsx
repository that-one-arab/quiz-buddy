import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Divider from "@mui/material/Divider";
import { green } from "@mui/material/colors";

export interface QuestionChoice {
  id: string;
  title: string;
}

export interface Question {
  id: string;
  title: string;
  choices: QuestionChoice[];
  correctChoice: QuestionChoice;
}

interface Props {
  question: Question;
  hideCorrectAnswer?: boolean;
}

const QuizQuestionPreview = ({ question, hideCorrectAnswer }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card variant="outlined" sx={{ marginBottom: 2 }}>
      <CardContent onClick={handleExpandClick} sx={{ cursor: "pointer" }}>
        <div className="flex justify-between items-center">
          <Typography variant="h6" component="div">
            {question.title}
          </Typography>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show answers"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <div style={{ margin: "0 50px" }}>
            {question.choices.map((answer, index) => {
              const isCorrectAnswer = answer.id === question.correctChoice.id;

              return (
                <React.Fragment key={`${question.id}-${answer.id}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontSize="1rem"
                        style={{
                          color:
                            !hideCorrectAnswer && isCorrectAnswer
                              ? green.A700
                              : "unset",
                          margin: "0 20px",
                        }}
                      >
                        <span>{`${index + 1}-`}</span>
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                        fontSize="1rem"
                        style={{
                          color:
                            !hideCorrectAnswer && isCorrectAnswer
                              ? green.A700
                              : "unset",
                          margin: "0 20px",
                        }}
                      >
                        <span>{answer.title}</span>
                      </Typography>
                    </div>
                    {!hideCorrectAnswer && isCorrectAnswer ? (
                      <Typography
                        sx={{ color: green.A700, margin: "0 20px" }}
                        component="span"
                      >
                        <CheckCircleIcon />
                      </Typography>
                    ) : null}
                  </div>
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default QuizQuestionPreview;
