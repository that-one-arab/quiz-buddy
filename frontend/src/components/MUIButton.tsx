import React from "react";
import { Button, ButtonProps, colors } from "@mui/material";
import { TAILWIND_PRIMARY_COLOR } from "../../tailwind.config";

type MUIButtonProps = ButtonProps;

const colorMap = {
  primary: TAILWIND_PRIMARY_COLOR,
  secondary: colors.blue[500],
  error: colors.red[500],
  warning: colors.orange[500],
  info: colors.blue[500],
  success: colors.green[500],
  inherit: colors.grey[500],
};

/** This component is MUI's Button component.
 * Tailwind and MUI's style have conflicts. Tailwind overrides the button's
 * background color and sets it to transparent. This hack overrides Tailwind's
 * applied style to display the background color */
export default function MUIButton(props: MUIButtonProps) {
  const { children, ...rest } = props;

  const componentProps = rest;

  if (props.variant === "contained") {
    componentProps.style = {
      backgroundColor: props.color
        ? colorMap[props.color]
        : TAILWIND_PRIMARY_COLOR,
    };
  }

  return <Button {...rest}>{children}</Button>;
}
