import React, { FC, useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Avatar,
  useMediaQuery,
  useTheme,
  Paper,
  Grid,
  IconButton,
  Icon
} from '@mui/material'
import { timeFromNow } from '@lib/utilities/daytime'
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Link from '@components/Link'
import { formatNumber } from '@lib/utilities/general';
import { resolveIpfs } from '@utils/assets';

export interface IPackTokenSelector {
  packInfo: {
    name: string;
    image: string;
    price: {
      tokenId: string;
      amount: number;
    }[]
  };
  selected?: boolean[];
  setSelected?: React.Dispatch<React.SetStateAction<boolean[]>>;
  index?: number;
}

const PackTokenSelector: FC<IPackTokenSelector> = ({
  packInfo,
  selected,
  setSelected,
  index
}) => {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))

  const handleSelect = () => {
    if (setSelected != undefined && index != undefined) {
      setSelected(prev => {
        const newArray = prev.map((item, i) => { // surely this could be done better but it works. 
          if (prev[index] === true && index === i) return true
          if (prev[index] === true && index != i) return item
          if (prev[index] === false && index === i) return true
          if (prev[index] === false && index != i) return false
          else return item
        })
        return newArray
      })
    }
  }

  return (
    <Paper
      onClick={() => handleSelect()}
      variant="outlined"
      className="custom-pointer"
      sx={{
        p: '12px',
        mb: '12px',
        backgroundColor: selected !== undefined && index !== undefined && selected[index] ?
          theme.palette.divider :
          theme.palette.background.paper,
        // transform: selected !== undefined && index !== undefined && selected[index] ?
        //   "scale3d(0.95, 0.95, 1)" :
        //   "scale3d(1, 1, 1)",
        transition: "transform 0.15s ease-in-out",
        // cursor: 'pointer',
        '&:before': {
          p: '1px'
        }
      }}
    >
      <Grid
        container
        spacing={2}
        direction="row"
        alignItems="center"
      >
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
              <Typography variant="h5" sx={{ mb: 0 }} className="custom-pointer">
                {packInfo.name}
              </Typography>
            </Grid>
            <Grid item xs="auto">
              <Typography variant="h5" sx={{ mb: 0 }} className="custom-pointer">
                {packInfo.price[0].tokenId === '0000000000000000000000000000000000000000000000000000000000000000' ?
                  (
                    <>
                      {formatNumber((packInfo.price[0].amount * 0.000000001), 2)} {' Erg'}
                    </>

                  ) :
                  packInfo.price[0].tokenId === '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04' ?
                    <>
                      ${(packInfo.price[0].amount * 0.01).toFixed(2)}
                    </>
                    : (
                      <>
                        Price error.
                      </>
                    )}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper >
  );
};

export default PackTokenSelector;
