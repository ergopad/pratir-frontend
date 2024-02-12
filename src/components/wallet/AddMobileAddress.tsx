import React, { FC, useContext, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import Link from '@components/Link';
import QRCode from 'react-qr-code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
// import { generateVerificationId } from '@lib/verificationIdGen';
import { WalletContext } from '@contexts/WalletContext';

interface IErgopayProps {

}

const Ergopay: FC<IErgopayProps> = () => {
  const [verificationId, setVerificationId] = useState<string | null>(null)
  useEffect(() => {
    const fetchVerificationId = async () => {
      try {
        // const id = await generateVerificationId();
        setVerificationId('');
      } catch (error) {
        console.log(error);
      }
    };

    fetchVerificationId();
  }, []);

  const baseUrl = `${window.location.host}`;
  const ergopayDomain = `ergopay://${baseUrl}`;

  const link = `${ergopayDomain}/api/ergo-mobile/p2pk?p2pkAddress=#P2PK_ADDRESS#&verificationId=${verificationId}`

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {

      console.log('Link copied to clipboard!');
    }).catch(err => {

      console.error('Failed to copy link: ', err);
    });
  };

  const {
    walletAddress,
    setWalletAddress,
  } = useContext(WalletContext);

  const [polling, setPolling] = useState<boolean>(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (verificationId) {
          const response = await fetch(`/api/ergo-mobile/checkAddress?verificationId=${encodeURIComponent(verificationId)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              setWalletAddress(data.address);
              setPolling(false); // Stop polling
            }
          } else if (response.status === 404) {
            // Continue polling, address not set yet
          } else {
            console.error('Failed to fetch updates');
            setPolling(false);
          }
        }
      } catch (error) {
        console.error('Error fetching updates:', error);
        setPolling(false); // Stop polling on exception
      }
    };

    let intervalId: NodeJS.Timer;
    if (!walletAddress && !polling) {
      setPolling(true);
      intervalId = setInterval(checkForUpdates, 2000); // Poll every 2 seconds
    }

    return () => clearInterval(intervalId);
  }, [verificationId, walletAddress, polling]);


  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <Typography>
            Scan the QR code or follow <Link href={link}>this link</Link>
            <IconButton onClick={() => copyToClipboard(link)}>
              <ContentCopyIcon sx={{ height: '18px', width: '18px' }} />
            </IconButton>
          </Typography>
        </Box>
        <Box sx={{ background: '#fff', p: 3, mb: 2, borderRadius: '12px' }}>
          <QRCode
            size={180}
            value={link}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Ergopay;