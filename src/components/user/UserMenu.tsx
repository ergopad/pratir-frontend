import React, { FC, useContext } from 'react';
import {
  useTheme,
  Button
} from '@mui/material'
import { WalletContext } from '@contexts/WalletContext';
import { useRouter } from 'next/router';
import AddWallet from '@components/wallet/AddWallet';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logout from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RedeemIcon from '@mui/icons-material/Redeem';
import { getShorterAddress } from '@lib/utilities/general';

interface IUserMenuProps {

}

const UserMenu: FC<IUserMenuProps> = ({ }) => {
  const theme = useTheme()
  const router = useRouter();
  const {
    walletAddress,
    setWalletAddress,
    dAppWallet,
    setDAppWallet,
    addWalletModalOpen,
    setAddWalletModalOpen,
    expanded,
    setExpanded
  } = useContext(WalletContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const clearWallet = async () => {
    if (dAppWallet.name === 'safew' || dAppWallet.name === 'nautilus') {
      // @ts-ignore
      await ergoConnector[dAppWallet.name].disconnect()
    }
    // clear state and local storage
    setWalletAddress('');
    // clear dApp state
    setDAppWallet({
      connected: false,
      name: '',
      addresses: [],
    });
    setExpanded(false)
  };

  return (
    <>
      {walletAddress ? (
        <>
          <Button variant="contained" onClick={handleClick}>
            {getShorterAddress(walletAddress, 5)}
          </Button>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => router.push('/open-packs')}>
              <ListItemIcon>
                <RedeemIcon fontSize="small" />
              </ListItemIcon>
              Open Packs
            </MenuItem>
            <MenuItem onClick={() => setAddWalletModalOpen(true)}>
              <ListItemIcon>
                <AccountBalanceWalletIcon fontSize="small" />
              </ListItemIcon>
              Change Wallet
            </MenuItem>
            <MenuItem onClick={() => clearWallet()}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button variant="contained" onClick={() => setAddWalletModalOpen(true)}>
          Connect Wallet
        </Button>
      )}
      <AddWallet />
    </>
  );
};

export default UserMenu;