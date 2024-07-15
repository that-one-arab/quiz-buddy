import { useTranslation } from "next-i18next";
import { use, useState } from "react";
import { Menu, MenuItem, IconButton } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircleOutlined";
import Link from "next/link";
import { useUser } from "@/util/hooks";
import { useRouter } from "next/router";

const NavbarUserDropdown = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const user = useUser();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<
    (EventTarget & HTMLButtonElement) | null
  >(null);

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignout = () => {
    handleClose();
    user.clearUser();
    router.push("/login");
  };

  return (
    <div className={className}>
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <AccountCircle />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>
          <Link href="/settings/change-password">{t("common:settings")}</Link>
        </MenuItem>
        <MenuItem onClick={handleSignout}>{t("common:signout")}</MenuItem>
      </Menu>
    </div>
  );
};

export default NavbarUserDropdown;
