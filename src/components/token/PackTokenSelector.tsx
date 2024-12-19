import { FC } from "react";
import {
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
  Paper,
  Grid,
} from "@mui/material";
import { formatNumber } from "@lib/utilities/general";
import { resolveIpfs } from "@utils/assets";

export interface IPackTokenSelector {
  packInfo: Pack;
  selectedPack: Pack | undefined;
  onSelect: React.Dispatch<React.SetStateAction<Pack | undefined>>;
}

const PackTokenSelector: FC<IPackTokenSelector> = ({
  packInfo,
  selectedPack,
  onSelect,
}) => {
  const theme = useTheme();

  const isSelected = selectedPack?.id === packInfo.id;

  const getPriceDisplay = () => {
    const price = packInfo.price[0];

    switch (price.tokenId) {
      case "0000000000000000000000000000000000000000000000000000000000000000":
        return `${formatNumber(price.amount * 0.000000001, 2)} Erg`;
      case "03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04":
        return `$${(price.amount * 0.01).toFixed(2)}`;
      case "lovelace":
        return `${formatNumber(price.amount * 0.000001, 2)} Ada`;
      default:
        return "Price error.";
    }
  };

  return (
    <Paper
      onClick={() => onSelect(packInfo)}
      variant="outlined"
      className="custom-pointer"
      sx={{
        p: "12px",
        mb: "12px",
        backgroundColor: isSelected
          ? theme.palette.divider
          : theme.palette.background.paper,
        transition: "transform 0.15s ease-in-out",
        "&:before": {
          p: "1px",
        },
      }}
    >
      <Grid container spacing={2} direction="row" alignItems="center">
        <Grid item xs="auto">
          <Avatar
            variant="rounded"
            alt={packInfo.name}
            src={resolveIpfs(packInfo.image)}
            sx={{ width: 48, height: 48 }}
          />
        </Grid>
        <Grid item xs>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs>
              <Typography
                variant="h5"
                sx={{ mb: 0 }}
                className="custom-pointer"
              >
                {packInfo.name}
              </Typography>
            </Grid>
            <Grid item xs="auto">
              <Typography
                variant="h5"
                sx={{ mb: 0 }}
                className="custom-pointer"
              >
                {getPriceDisplay()}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PackTokenSelector;
