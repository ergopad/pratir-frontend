import React, { FC } from "react";
import { Button } from "@mui/material";
import { useRouter } from "next/router";
import ListItemIcon from "@mui/material/ListItemIcon";
import RedeemIcon from "@mui/icons-material/Redeem";
import { CardanoWallet } from "@meshsdk/react";

interface IUserMenuProps {}

const UserMenu: FC<IUserMenuProps> = ({}) => {
  const router = useRouter();

  return (
    <>
      <Button onClick={() => router.push("/open-packs")}>
        <ListItemIcon>
          <RedeemIcon fontSize="small" />
        </ListItemIcon>
        Open Packs
      </Button>
      <CardanoWallet isDark={true} />
    </>
  );
};

export default UserMenu;
